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
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export interface WorkspaceRecord {
  id: "singleton"; // only one workspace for now — simple key
  name: string;
  currency: "GBP" | "EUR";
  vatStatus: "registered" | "unregistered";
  createdAt: string; // ISO timestamp
}

interface MonthEndPackDB extends DBSchema {
  workspace: {
    value: WorkspaceRecord;
    key: string;
  };
}

// ---------------------------------------------------------------------------
// DB name + version
// Bump DB_VERSION whenever the schema changes (add stores/indexes).
// ---------------------------------------------------------------------------

const DB_NAME = "month-end-pack";
const DB_VERSION = 1;

// ---------------------------------------------------------------------------
// Singleton connection promise
// One openDB call per page load — reused across all operations.
// ---------------------------------------------------------------------------

let _db: IDBPDatabase<MonthEndPackDB> | null = null;

export async function getDb(): Promise<IDBPDatabase<MonthEndPackDB>> {
  if (_db) return _db;

  _db = await openDB<MonthEndPackDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // workspace store — keyed by a string id ("singleton")
      if (!db.objectStoreNames.contains("workspace")) {
        db.createObjectStore("workspace", { keyPath: "id" });
      }
    },
  });

  return _db;
}
