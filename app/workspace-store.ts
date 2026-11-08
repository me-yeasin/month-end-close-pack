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

/** Load all workspaces, sorted oldest → newest. */
export async function loadAllWorkspaces(): Promise<WorkspaceRecord[]> {
  const db = await getDb();
  const all = await db.getAll("workspaces");
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
