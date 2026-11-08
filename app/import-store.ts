"use client";

/**
 * import-store.ts — bank statement import orchestration.
 *
 * Flow: parse files → merge with existing month rows → chunk → analyze each
 * chunk sequentially through the server proxy → attach flags → checkpoint.
 * Results and job progress are persisted to IndexedDB.
 */

import { create } from "zustand";
import {
  getDb,
  newId,
  type ImportJobRecord,
  type TransactionRecord,
} from "./db";
import {
  analyzeChunk,
  chunkTransactions,
  parseBankFiles,
  type AiConfig,
  type Flag,
} from "./bank-import";

const CHUNK_SIZE = 30;

type ImportState = {
  transactions: TransactionRecord[];
  job: ImportJobRecord | null;
  hydrated: boolean;
  hydrate: (workspaceId: string, month: number, year: number) => Promise<void>;
  startImport: (
    files: File[],
    workspace: { id: string; month: number; year: number },
    ai: AiConfig,
  ) => Promise<void>;
  reset: () => void;
};

async function persistTransactions(transactions: TransactionRecord[]): Promise<void> {
  if (transactions.length === 0) return;
  const db = await getDb();
  await Promise.all(transactions.map((t) => db.put("transactions", t)));
}

async function persistJob(job: ImportJobRecord): Promise<void> {
  const db = await getDb();
  await db.put("importJobs", job);
}

function withFlags(
  transaction: TransactionRecord,
  flags: Map<string, Flag>,
): TransactionRecord {
  const flag = flags.get(transaction.id);
  if (!flag) return transaction;
  return {
    ...transaction,
    flag: { type: flag.type, severity: flag.severity, reason: flag.reason },
  };
}

export const useImportStore = create<ImportState>((set, get) => ({
  transactions: [],
  job: null,
  hydrated: false,

  hydrate: async (workspaceId, month, year) => {
    const db = await getDb();
    const all = await db.getAllFromIndex("transactions", "byWorkspace", workspaceId);
    const transactions = all.filter((t) => t.month === month && t.year === year);
    const jobs = await db.getAllFromIndex("importJobs", "byWorkspace", workspaceId);
    let job =
      jobs
        .filter((j) => j.month === month && j.year === year)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .pop() ?? null;

    // A job still marked "processing" was interrupted by a reload/close.
    if (job && job.status === "processing") {
      job = {
        ...job,
        status: "failed",
        stage: "failed",
        message: "Import was interrupted",
        updatedAt: new Date().toISOString(),
      };
      await persistJob(job);
    }

    set({ transactions, job, hydrated: true });
  },

  startImport: async (files, workspace, ai) => {
    if (files.length === 0) return;

    const now = new Date().toISOString();
    const job: ImportJobRecord = {
      id: newId(),
      workspaceId: workspace.id,
      month: workspace.month,
      year: workspace.year,
      status: "processing",
      stage: "reading",
      message: "Reading files…",
      files: files.map((f) => ({ name: f.name, size: f.size })),
      totalTransactions: 0,
      totalFlagged: 0,
      chunkDone: 0,
      chunkTotal: 0,
      createdAt: now,
      updatedAt: now,
    };

    set({ job, transactions: [] });
    await persistJob(job);

    const patch = async (p: Partial<ImportJobRecord>) => {
      const current = get().job;
      if (!current) return;
      const next = { ...current, ...p, updatedAt: new Date().toISOString() };
      set({ job: next });
      await persistJob(next);
    };

    try {
      await patch({ stage: "parsing", message: "Parsing transactions…" });
      const parsed = await parseBankFiles(
        files,
        workspace.id,
        workspace.month,
        workspace.year,
      );

      // Merge with existing rows for this month (incremental, de-duplicated).
      const db = await getDb();
      const all = await db.getAllFromIndex(
        "transactions",
        "byWorkspace",
        workspace.id,
      );
      const existing = all.filter(
        (t) => t.month === workspace.month && t.year === workspace.year,
      );
      const existingFingerprints = new Set(existing.map((t) => t.fingerprint));
      const fresh = parsed.filter((t) => !existingFingerprints.has(t.fingerprint));
      const merged = [...existing, ...fresh];

      await persistTransactions(fresh);
      set({ transactions: merged });

      const chunks = chunkTransactions(fresh, CHUNK_SIZE);
      const totalFlagged = merged.filter((t) => t.flag).length;

      if (chunks.length === 0) {
        await patch({
          status: "done",
          stage: "done",
          message: "No new transactions",
          totalTransactions: merged.length,
          totalFlagged,
        });
        return;
      }

      await patch({
        stage: "analyzing",
        message: `Analyzing 0 of ${chunks.length}…`,
        chunkTotal: chunks.length,
        chunkDone: 0,
        totalTransactions: merged.length,
      });

      const flagsById = new Map<string, Flag>();
      let failedBatches = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        try {
          const flags = await analyzeChunk(ai, chunk);
          for (const flag of flags) flagsById.set(flag.id, flag);
        } catch {
          // Isolate a failed batch — continue with the rest.
          failedBatches += 1;
        }

        // Checkpoint: persist flags for this batch.
        const flaggedNow = chunk
          .filter((t) => flagsById.has(t.id))
          .map((t) => withFlags(t, flagsById));
        if (flaggedNow.length > 0) await persistTransactions(flaggedNow);

        // Reflect flags in memory.
        set((state) => ({
          transactions: state.transactions.map((t) => withFlags(t, flagsById)),
        }));

        await patch({
          chunkDone: i + 1,
          message: `Analyzing ${i + 1} of ${chunks.length}…`,
        });
      }

      await patch({
        status: "done",
        stage: "done",
        message: "Complete",
        chunkDone: chunks.length,
        failedBatches,
        totalFlagged: merged.filter((t) => flagsById.has(t.id) || t.flag).length,
      });
    } catch (err) {
      await patch({
        status: "failed",
        stage: "failed",
        message: "Import failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },

  reset: () => set({ transactions: [], job: null }),
}));
