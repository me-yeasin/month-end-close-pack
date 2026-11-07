"use client";

import { useEffect, useRef } from "react";
import styles from "./home.module.css";
import { useUiStore } from "./ui-store";

export function Sidebar() {
  const open = useUiStore((state) => state.sidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus({ preventScroll: true });
    } else if (wasOpen.current) {
      wasOpen.current = false;
      document.body.style.overflow = "";
      document
        .getElementById("mobile-menu-button")
        ?.focus({ preventScroll: true });
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSidebar();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>(
          "#app-sidebar a[href], #app-sidebar button:not([disabled])",
        ),
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, closeSidebar]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 721px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeSidebar();
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [closeSidebar]);

  return (
    <>
      <div
        className={`${styles.scrim} ${open ? styles.scrimOpen : ""}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        id="app-sidebar"
        className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}
        aria-label="Workspace navigation"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.drawerClose}
          onClick={closeSidebar}
          aria-label="Close navigation"
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
            <path d="m6 6 12 12" />
            <path d="M18 6 6 18" />
          </svg>
        </button>

        <a
          className={styles.brand}
          href="#top"
          aria-label="Month-End Pack home"
          onClick={closeSidebar}
        >
          <span className={styles.brandMark}>M</span>
          <span className={styles.brandText}>
            <strong>Month-End</strong>
            <em>pack</em>
          </span>
        </a>

        <div className={styles.workspace}>
          <span className={styles.wsLabel}>Workspace</span>
          <button type="button" className={styles.wsPicker}>
            <span className={styles.wsDot} />
            <span>Personal books</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        <nav className={styles.nav} aria-label="Main">
          <a
            className={`${styles.navItem} ${styles.active}`}
            href="#top"
            onClick={closeSidebar}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1.6" />
              <rect x="14" y="3" width="7" height="7" rx="1.6" />
              <rect x="3" y="14" width="7" height="7" rx="1.6" />
              <rect x="14" y="14" width="7" height="7" rx="1.6" />
            </svg>
            <span>Overview</span>
          </a>
          <a
            className={styles.navItem}
            href="#transactions"
            onClick={closeSidebar}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 8h14" />
              <path d="m14 5 3 3-3 3" />
              <path d="M21 16H7" />
              <path d="m10 13-3 3 3 3" />
            </svg>
            <span>Transactions</span>
          </a>
          <a className={styles.navItem} href="#pack" onClick={closeSidebar}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
              <path d="M9 8h6" />
              <path d="M9 12h6" />
            </svg>
            <span>Receipts</span>
          </a>
          <a className={styles.navItem} href="#attention" onClick={closeSidebar}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>Review</span>
            <span className={styles.navBadge}>3</span>
          </a>
          <a className={styles.navItem} href="#summary" onClick={closeSidebar}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 12A9 9 0 1 1 12 3v9h9Z" />
              <path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5Z" />
            </svg>
            <span>Summary</span>
          </a>
          <a className={styles.navItem} href="#pack" onClick={closeSidebar}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            <span>Export</span>
          </a>
        </nav>

        <div className={styles.sidebarSpacer} />

        <div className={styles.trustCard}>
          <div className={styles.trustIcon}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
          <strong>Local by design</strong>
          <p>Your files stay in this browser. No account, no cloud, no tracking.</p>
          <button type="button" className={styles.trustLink}>
            Where is my data?
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </button>
        </div>

        <button type="button" className={styles.navItem}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 21v-7" />
            <path d="M4 10V3" />
            <path d="M12 21v-9" />
            <path d="M12 8V3" />
            <path d="M20 21v-5" />
            <path d="M20 12V3" />
            <path d="M1 14h6" />
            <path d="M9 8h6" />
            <path d="M17 16h6" />
          </svg>
          <span>Settings</span>
        </button>
        <span className={styles.concept}>Concept 01 · Home</span>
      </aside>
    </>
  );
}
