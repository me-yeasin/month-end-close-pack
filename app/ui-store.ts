import { create } from "zustand";

export type View =
  | "overview"
  | "transactions"
  | "receipts"
  | "review"
  | "summary"
  | "export";

type UiState = {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  view: View;
  setView: (view: View) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  view: "overview",
  setView: (view) => set({ view }),
}));
