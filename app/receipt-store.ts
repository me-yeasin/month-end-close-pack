"use client";

/**
 * receipt-store.ts — receipt upload + local extraction orchestration.
 *
 * Mirrors import-store: Zustand is the single source of truth, state updates
 * are applied synchronously (optimistic UI) and persisted to IndexedDB after.
 * The processing queue runs sequentially, one receipt at a time, so a slow
 * OCR never blocks the UI and failures stay isolated to single files.
 */

import { create } from "zustand";
import {
  getDb,
  newId,
  type ExtractedReceipt,
  type ReceiptRecord,
} from "./db";
import {
  extractReceiptText,
  hashFile,
  meanFieldConfidence,
  structureReceipts,
  type AiConfig,
} from "./receipt-import";

/** Field confidences below this mark the receipt as needs_review. */
const REVIEW_CONFIDENCE = 0.6;

type Workspace = { id: string; month: number; year: number };

type ReceiptState = {
  receipts: ReceiptRecord[];
  hydrated: boolean;
  processing: boolean;
  hydrate: (workspaceId: string, month: number, year: number) => Promise<void>;
  /** Dedupe by hash, persist as queued, then run the processing queue. */
  addFiles: (
    files: File[],
    workspace: Workspace,
    ai: AiConfig,
  ) => Promise<void>;
  /** Re-run extraction + structuring for one failed receipt. */
  retry: (id: string, ai: AiConfig) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  /** Set/clear the match on one receipt (used by the matching engine). */
  setReceiptMatch: (
    id: string,
    transactionId: string | null,
    matchType?: "exact" | "fuzzy",
    matchConfidence?: number,
  ) => Promise<void>;
};

async function persistReceipts(receipts: ReceiptRecord[]): Promise<void> {
  if (receipts.length === 0) return;
  const db = await getDb();
  await Promise.all(receipts.map((r) => db.put("receipts", r)));
}

async function deleteReceipt(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("receipts", id);
}

/** Extract + structure one receipt; reports the updated record via callback. */
async function processOne(
  receipt: ReceiptRecord,
  ai: AiConfig,
  onReceipt: (r: ReceiptRecord) => void,
): Promise<void> {
  const now = new Date().toISOString();

  // ---- stage 1: local extraction ----
  const processing: ReceiptRecord = {
    ...receipt,
    status: "processing",
    error: undefined,
    updatedAt: now,
  };
  onReceipt(processing);
  await persistReceipts([processing]);

  let extraction;
  try {
    extraction = await extractReceiptText(receipt.blob, receipt.mimeType);
  } catch (err) {
    onReceipt({
      ...receipt,
      status: "failed",
      error: err instanceof Error ? err.message : "Could not read the file.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const text = extraction.text.trim();
  if (!text) {
    onReceipt({
      ...receipt,
      pageCount: extraction.pageCount,
      status: "failed",
      error: "No readable text found — try a clearer photo or scan.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const extractedReceipt: ReceiptRecord = {
    ...receipt,
    pageCount: extraction.pageCount,
    ocrText: text,
    ocrConfidence: extraction.ocrConfidence,
    status: "extracted",
    updatedAt: new Date().toISOString(),
  };
  onReceipt(extractedReceipt);
  await persistReceipts([extractedReceipt]);

  // ---- stage 2: LLM structuring ----
  let fields: ExtractedReceipt | null = null;
  try {
    const [structured] = await structureReceipts(ai, [
      { id: receipt.id, text },
    ]);
    if (structured && structured.id === receipt.id) {
      fields = structured.fields;
    }
  } catch (err) {
    onReceipt({
      ...extractedReceipt,
      status: "failed",
      error:
        err instanceof Error
          ? err.message
          : "The AI could not structure this receipt.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  if (!fields) {
    onReceipt({
      ...extractedReceipt,
      status: "failed",
      error: "The AI returned no fields for this receipt.",
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const needsReview =
    fields.vendor.confidence < REVIEW_CONFIDENCE ||
    fields.total.confidence < REVIEW_CONFIDENCE ||
    fields.date.confidence < REVIEW_CONFIDENCE ||
    meanFieldConfidence(fields) < REVIEW_CONFIDENCE;

  onReceipt({
    ...extractedReceipt,
    extracted: fields,
    status: needsReview ? "needs_review" : "extracted",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Sequential queue runner — drains all queued (non-duplicate) receipts for
 * the workspace month, one at a time. Safe to call while already running.
 */
async function runQueue(
  get: () => ReceiptState,
  set: (partial: Partial<ReceiptState>) => void,
  workspace: Workspace,
  ai: AiConfig,
): Promise<void> {
  if (get().processing) return;
  set({ processing: true });
  try {
    for (;;) {
      const next = get().receipts.find(
        (r) =>
          r.workspaceId === workspace.id &&
          r.month === workspace.month &&
          r.year === workspace.year &&
          !r.duplicate &&
          r.status === "queued",
      );
      if (!next) break;
      await processOne(next, ai, (updated) => {
        set({
          receipts: get().receipts.map((r) =>
            r.id === updated.id ? updated : r,
          ),
        });
      });
    }
  } finally {
    set({ processing: false });
  }
}

export const useReceiptStore = create<ReceiptState>((set, get) => ({
  receipts: [],
  hydrated: false,
  processing: false,

  hydrate: async (workspaceId, month, year) => {
    const db = await getDb();
    const all = await db.getAllFromIndex("receipts", "byWorkspace", workspaceId);
    const receipts = all.filter((r) => r.month === month && r.year === year);
    set({ receipts, hydrated: true });
  },

  addFiles: async (files, workspace, ai) => {
    if (files.length === 0) return;

    const existingHashes = new Set(get().receipts.map((r) => r.hash));
    const now = new Date().toISOString();
    const fresh: ReceiptRecord[] = [];
    const duplicates: ReceiptRecord[] = [];

    for (const file of files) {
      const hash = await hashFile(file);
      const record: ReceiptRecord = {
        id: newId(),
        workspaceId: workspace.id,
        month: workspace.month,
        year: workspace.year,
        originalName: file.name,
        hash,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        blob: file,
        status: "queued",
        duplicate: existingHashes.has(hash),
        createdAt: now,
        updatedAt: now,
      };
      existingHashes.add(hash);
      (record.duplicate ? duplicates : fresh).push(record);
    }

    // optimistic: show everything immediately, persist after
    set((state) => ({ receipts: [...state.receipts, ...fresh, ...duplicates] }));
    try {
      await persistReceipts([...fresh, ...duplicates]);
    } catch (err) {
      console.error("Failed to persist receipts", err);
    }

    await runQueue(get, set, workspace, ai);
  },

  retry: async (id, ai) => {
    const receipt = get().receipts.find((r) => r.id === id);
    if (!receipt || receipt.duplicate) return;
    const reset: ReceiptRecord = {
      ...receipt,
      status: "queued",
      error: undefined,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      receipts: state.receipts.map((r) => (r.id === id ? reset : r)),
    }));
    await persistReceipts([reset]);
    await runQueue(
      get,
      set,
      { id: receipt.workspaceId, month: receipt.month, year: receipt.year },
      ai,
    );
  },

  remove: async (id) => {
    const target = get().receipts.find((r) => r.id === id);
    set((state) => ({ receipts: state.receipts.filter((r) => r.id !== id) }));
    try {
      await deleteReceipt(id);
    } catch (err) {
      console.error("Failed to delete receipt", err);
    }
    if (target?.matchId) {
      // keep the transaction side consistent
      const { useImportStore } = await import("./import-store");
      await useImportStore.getState().setTransactionMatch(target.matchId, null);
    }
  },

  clear: async () => {
    const all = get().receipts;
    const matched = all.filter((r) => r.matchId).map((r) => r.matchId!);
    set({ receipts: [] });
    try {
      const db = await getDb();
      await Promise.all(all.map((r) => db.delete("receipts", r.id)));
      const { useImportStore } = await import("./import-store");
      await Promise.all(
        matched.map((id) => useImportStore.getState().setTransactionMatch(id, null)),
      );
    } catch (err) {
      console.error("Failed to clear receipts", err);
    }
  },

  setReceiptMatch: async (id, transactionId, matchType, matchConfidence) => {
    const target = get().receipts.find((r) => r.id === id);
    if (!target) return;
    const updated: ReceiptRecord = {
      ...target,
      matchId: transactionId ?? undefined,
      matchType: transactionId ? matchType : undefined,
      matchConfidence: transactionId ? matchConfidence : undefined,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      receipts: state.receipts.map((r) => (r.id === id ? updated : r)),
    }));
    try {
      await persistReceipts([updated]);
    } catch (err) {
      console.error("Failed to persist receipt match", err);
    }
  },
}));
