import { create } from "zustand";

export type View =
  | "overview"
  | "transactions"
  | "receipts"
  | "review"
  | "summary"
  | "export";

export type Currency = "GBP" | "EUR";
export type VatStatus = "registered" | "unregistered";

export interface Workspace {
  name: string;
  currency: Currency;
  vatStatus: VatStatus;
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

  // workspace
  workspace: Workspace | null;
  createWorkspace: (ws: Workspace) => void;
};

export const useUiStore = create<UiState>((set) => ({
  // sidebar
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // view
  view: "overview",
  setView: (view) => set({ view }),

  // workspace
  workspace: null,
  createWorkspace: (ws) => set({ workspace: ws }),
}));
