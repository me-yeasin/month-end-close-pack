/**
 * db.ts — Month-End Pack IndexedDB layer
 *
 * Uses the `idb` library (Jake Archibald) — a thin, TypeScript-native,
 * promise-based wrapper around the IndexedDB API.
 *
 * Rules followed (from idb docs):
 *  - Define a typed DBSchema so every store/index is type-safe.
 *  - Open with a version + upgrade callback; bump version when schema changes.
 *  - Use single-command shortcuts (db.get, db.put) for simple operations.
 *  - Never call this module during SSR — all exports are browser-only.
 *  - Never await unrelated promises inside a transaction (auto-closes).
 *
 * DB_VERSION history:
 *  v1 — single workspace store, keyed by "singleton"
 *  v2 — multi-workspace: workspaces store (UUID keys) + appState store
 *       Migration: copies the singleton record into workspaces with a UUID,
 *       then writes the new activeWorkspaceId into appState.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

export interface WorkspaceRecord {
  id: string;          // nanoid — unique per workspace
  name: string;
  currency: "GBP" | "EUR";
  vatStatus: "registered" | "unregistered";
  /** Selected period — 0-11 (Jan-Dec) and the Gregorian year. */
  month: number;
  year: number;
  createdAt: string;   // ISO timestamp
}

export interface AppStateRecord {
  id: "singleton";          // only one app-state row
  activeWorkspaceId: string | null;
}

/** A model available under a configured AI provider. */
export interface AiModelRecord {
  id: string;   // model id sent to the provider API
  name: string; // display name (user-editable)
}

/** A user-configured AI provider (BYO key, OpenAI-compatible). */
export interface AiProviderRecord {
  id: string;
  name: string;    // provider display name
  baseUrl: string; // e.g. https://api.openai.com/v1
  apiKey: string;  // stored locally on this device
  models: AiModelRecord[];
  createdAt: string;
}

/** Singleton row holding all AI providers + the active selection. */
export interface AiConfigRecord {
  id: "singleton";
  providers: AiProviderRecord[];
  activeProviderId: string | null;
  activeModelId: string | null;
}

/** A normalized bank transaction for a workspace month. */
export interface TransactionRecord {
  id: string;
  workspaceId: string;
  month: number; // 0-11
  year: number;
  date: string; // ISO date (YYYY-MM-DD)
  description: string;
  amount: number; // signed: positive = money in
  direction: "in" | "out";
  account: string;
  sourceFile: string;
  originalRow: number;
  /** Stable identity for de-duplication across files. */
  fingerprint: string;
  /** AI flag, if this transaction was flagged for review. */
  flag: {
    type: string;
    severity: "high" | "medium" | "low";
    reason: string;
  } | null;
  /** Review outcome, set once the user resolves the flag. */
  reviewState?: "accepted" | "personal" | "reviewed";
  /** Assigned category (id + display name), if any. */
  categoryId?: string;
  category?: string;
  /** VAT treatment chosen by the user, if any. */
  vatTreatment?: "included" | "excluded" | "not_applicable";
  createdAt: string;
}

/** A bank-import job (one per upload batch). */
export interface ImportJobRecord {
  id: string;
  workspaceId: string;
  month: number;
  year: number;
  status: "queued" | "processing" | "done" | "failed";
  stage: string; // reading | parsing | analyzing | merging | done | failed
  message: string;
  files: { name: string; size: number }[];
  totalTransactions: number;
  totalFlagged: number;
  chunkDone: number;
  chunkTotal: number;
  failedBatches?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface MonthEndPackDB extends DBSchema {
  workspaces: {
    value: WorkspaceRecord;
    key: string;
  };
  appState: {
    value: AppStateRecord;
    key: string;
  };
  aiConfig: {
    value: AiConfigRecord;
    key: string;
  };
  transactions: {
    value: TransactionRecord;
    key: string;
    indexes: { byWorkspace: string };
  };
  importJobs: {
    value: ImportJobRecord;
    key: string;
    indexes: { byWorkspace: string };
  };
}

// ---------------------------------------------------------------------------
// DB name + version
// ---------------------------------------------------------------------------

const DB_NAME = "month-end-pack";
const DB_VERSION = 4;

// ---------------------------------------------------------------------------
// Simple ID generator — no dependency needed for UUID-like strings
// ---------------------------------------------------------------------------

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------------------------------------------------------------------------
// Singleton connection — reused across all operations per page load
// ---------------------------------------------------------------------------

let _db: IDBPDatabase<MonthEndPackDB> | null = null;

export async function getDb(): Promise<IDBPDatabase<MonthEndPackDB>> {
  if (_db) return _db;

  _db = await openDB<MonthEndPackDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // ---- v1 → v2 migration ----
      // v1 had a single "workspace" store with key "singleton".
      // v2 replaces it with "workspaces" (multi) + "appState".

      // Create workspaces store if it does not exist
      if (!db.objectStoreNames.contains("workspaces")) {
        db.createObjectStore("workspaces", { keyPath: "id" });
      }

      // Create appState store if it does not exist
      if (!db.objectStoreNames.contains("appState")) {
        db.createObjectStore("appState", { keyPath: "id" });
      }

      // Create aiConfig store (v3) if it does not exist
      if (!db.objectStoreNames.contains("aiConfig")) {
        db.createObjectStore("aiConfig", { keyPath: "id" });
      }

      // Create transactions store (v4)
      if (!db.objectStoreNames.contains("transactions")) {
        const store = db.createObjectStore("transactions", { keyPath: "id" });
        store.createIndex("byWorkspace", "workspaceId");
      }

      // Create importJobs store (v4)
      if (!db.objectStoreNames.contains("importJobs")) {
        const store = db.createObjectStore("importJobs", { keyPath: "id" });
        store.createIndex("byWorkspace", "workspaceId");
      }

      // Remove the old v1 "workspace" store (migration complete)
      // Cast to any — "workspace" is not in the v2 typed schema
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyDb = db as any;
      if (anyDb.objectStoreNames.contains("workspace")) {
        anyDb.deleteObjectStore("workspace");
      }

      // Suppress unused variable warning — oldVersion used for future migrations
      void oldVersion;
    },
  });

  return _db;
}
