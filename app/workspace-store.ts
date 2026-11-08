/**
 * workspace-store.ts — read and write the workspace record in IndexedDB.
 *
 * Thin async functions only — no React, no Zustand. The UI layer calls these
 * and then updates the Zustand store separately so components re-render.
 */

import { getDb, type WorkspaceRecord } from "./db";

const WORKSPACE_KEY = "singleton" as const;

/**
 * Load the workspace from IndexedDB.
 * Returns null if no workspace has been created yet (first-time user).
 */
export async function loadWorkspace(): Promise<WorkspaceRecord | null> {
  const db = await getDb();
  const record = await db.get("workspace", WORKSPACE_KEY);
  return record ?? null;
}

/**
 * Save (or overwrite) the workspace record in IndexedDB.
 * Uses `put` so it works for both initial creation and future updates.
 */
export async function saveWorkspace(record: WorkspaceRecord): Promise<void> {
  const db = await getDb();
  await db.put("workspace", record);
}
