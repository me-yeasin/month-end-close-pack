import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type View =
  | "overview"
  | "transactions"
  | "receipts"
  | "review"
  | "summary"
  | "export"
  | "settings";

export type Currency = "GBP" | "EUR";
export type VatStatus = "registered" | "unregistered";

export interface Workspace {
  id: string;
  name: string;
  currency: Currency;
  vatStatus: VatStatus;
  /** Selected period — 0-11 (Jan-Dec) and the Gregorian year. */
  month: number;
  year: number;
  createdAt: string;
}

type UiState = {
  // sidebar
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;

  // view / navigation
  view: View;
  setView: (view: View) => void;

  // workspaces
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  /** Active workspace derived from the list — null if list is empty */
  workspace: Workspace | null;
  /** Bulk-hydrate after reading IndexedDB on mount */
  hydrateWorkspaces: (workspaces: Workspace[], activeId: string | null) => void;
  /** Add a newly-created workspace and make it active */
  addWorkspace: (ws: Workspace) => void;
  /** Switch the active workspace */
  switchWorkspace: (id: string) => void;
  /** Remove a workspace by id; optionally pass the new active id */
  removeWorkspace: (id: string, newActiveId: string | null) => void;
  /** Update the active workspace's selected period (month + year). */
  setPeriod: (month: number, year: number) => void;

  // bank-only mode (global, persisted preference)
  bankOnly: boolean;
  setBankOnly: (value: boolean) => void;
  toggleBankOnly: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
  // sidebar
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // view
  view: "overview",
  setView: (view) => set({ view }),

  // workspaces
  workspaces: [],
  activeWorkspaceId: null,
  workspace: null,

  hydrateWorkspaces: (workspaces, activeId) => {
    const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0] ?? null;
    set({
      workspaces,
      activeWorkspaceId: active?.id ?? null,
      workspace: active,
    });
  },

  addWorkspace: (ws) => {
    set((state) => ({
      workspaces: [...state.workspaces, ws],
      activeWorkspaceId: ws.id,
      workspace: ws,
    }));
  },

  switchWorkspace: (id) => {
    const ws = get().workspaces.find((w) => w.id === id) ?? null;
    set({ activeWorkspaceId: id, workspace: ws });
  },

  removeWorkspace: (id, newActiveId) => {
    set((state) => {
      const workspaces = state.workspaces.filter((w) => w.id !== id);
      const active = workspaces.find((w) => w.id === newActiveId) ?? workspaces[0] ?? null;
      return {
        workspaces,
        activeWorkspaceId: active?.id ?? null,
        workspace: active,
      };
    });
  },

  setPeriod: (month, year) => {
    const { activeWorkspaceId, workspaces } = get();
    if (!activeWorkspaceId) return;
    // Immutable update: new array + new active object so subscribers re-render.
    const updated = workspaces.map((w) =>
      w.id === activeWorkspaceId ? { ...w, month, year } : w,
    );
    set({
      workspaces: updated,
      workspace: updated.find((w) => w.id === activeWorkspaceId) ?? null,
    });
  },

  // bank-only mode
  bankOnly: false,
  setBankOnly: (value) => set({ bankOnly: value }),
  toggleBankOnly: () => set((state) => ({ bankOnly: !state.bankOnly })),
}),
    {
      name: "mep-ui-prefs",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? window.localStorage
          : (undefined as unknown as Storage),
      ),
      // Only persist the user preference; everything else is hydrated from
      // IndexedDB on mount.
      partialize: (state) => ({ bankOnly: state.bankOnly }),
    },
  ),
);
