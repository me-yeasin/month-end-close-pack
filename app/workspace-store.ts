/**
 * workspace-store.ts — multi-workspace CRUD via IndexedDB.
 *
 * Thin async functions only — no React, no Zustand.
 * The UI layer calls these and then updates the Zustand store separately.
 */

import { getDb, newId, type WorkspaceRecord, type AppStateRecord } from "./db";

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Load all workspaces, sorted oldest → newest.
 *  Backfills the `month`/`year` period for records created before the
 *  field existed, so the UI always receives a fully-populated record. */
export async function loadAllWorkspaces(): Promise<WorkspaceRecord[]> {
  const db = await getDb();
  const all = await db.getAll("workspaces");
  const now = new Date();
  return all
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((w) => ({
      ...w,
      month: w.month ?? now.getMonth(),
      year: w.year ?? now.getFullYear(),
    }));
}

/** Load the active workspace ID from appState. Returns null if not set. */
export async function loadActiveWorkspaceId(): Promise<string | null> {
  const db = await getDb();
  const state = await db.get("appState", "singleton");
  return state?.activeWorkspaceId ?? null;
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Create a new workspace record, persist it, and set it as active.
 * Returns the saved record (with generated id).
 */
export async function createWorkspace(
  input: Omit<WorkspaceRecord, "id" | "createdAt">,
): Promise<WorkspaceRecord> {
  const db = await getDb();
  const record: WorkspaceRecord = {
    id: newId(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  await db.put("workspaces", record);
  await db.put("appState", {
    id: "singleton",
    activeWorkspaceId: record.id,
  } satisfies AppStateRecord);
  return record;
}

/** Set the active workspace by ID (switches context). */
export async function setActiveWorkspace(id: string): Promise<void> {
  const db = await getDb();
  await db.put("appState", { id: "singleton", activeWorkspaceId: id } satisfies AppStateRecord);
}

/**
 * Patch fields on an existing workspace and persist the merged record.
 * idb's `put` upserts by keyPath, so we read → merge → write in one
 * transaction-free sequence (no other awaits in between).
 */
export async function updateWorkspace(
  id: string,
  patch: Partial<Omit<WorkspaceRecord, "id">>,
): Promise<void> {
  const db = await getDb();
  const existing = await db.get("workspaces", id);
  if (!existing) return;
  await db.put("workspaces", { ...existing, ...patch, id });
}

/** Delete a workspace by ID. Returns the new active ID (or null if none left). */
export async function deleteWorkspace(id: string): Promise<string | null> {
  const db = await getDb();
  await db.delete("workspaces", id);

  // If this was the active one, pick the first remaining workspace
  const state = await db.get("appState", "singleton");
  if (state?.activeWorkspaceId === id) {
    const remaining = await db.getAll("workspaces");
    const nextId = remaining[0]?.id ?? null;
    await db.put("appState", { id: "singleton", activeWorkspaceId: nextId } satisfies AppStateRecord);
    return nextId;
  }
  return state?.activeWorkspaceId ?? null;
}
