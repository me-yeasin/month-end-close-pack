"use client";

import styles from "./home.module.css";
import { useUiStore } from "./ui-store";

export function MobileMenuButton() {
  const open = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <button
      id="mobile-menu-button"
      type="button"
      className={styles.menuBtn}
      onClick={toggleSidebar}
      aria-label={open ? "Close navigation" : "Open navigation"}
      aria-expanded={open}
      aria-controls="app-sidebar"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 9h16" />
        <path d="M4 15h16" />
      </svg>
    </button>
  );
}
