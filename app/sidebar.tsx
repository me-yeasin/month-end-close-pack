"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./home.module.css";
import { useUiStore, type View, type Currency, type VatStatus } from "./ui-store";
import {
  createWorkspace as dbCreateWorkspace,
  setActiveWorkspace as dbSetActive,
  deleteWorkspace as dbDeleteWorkspace,
} from "./workspace-store";
import { currentPeriod, formatPeriodShort } from "./period";
import { MonthPicker } from "./month-picker";

type NavItem = {
  id: View;
  label: string;
  badge?: number;
  icon: React.ReactNode;
};

/** `useLayoutEffect` in the browser, `useEffect` during SSR (no React warning). */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Fixed-position popover anchoring (floating-UI pattern).
 *
 * Popovers rendered inside the sidebar inherit its width and clipping — on
 * tablet the sidebar collapses to an 82px icon rail, which used to squeeze the
 * workspace popover into that rail and clip every row. Rendering the popover
 * through a portal into document.body with `position: fixed` escapes every
 * ancestor, so it always sizes to its content, anchored to the trigger's
 * viewport rect and clamped to the viewport. Re-anchors on resize and on any
 * scroll (including scrolls inside the drawer).
 */
function useFixedAnchor(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  preferredWidth: number,
): React.CSSProperties {
  // Hidden until measured so the popover never flashes at the body's top-left.
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "hidden",
    zIndex: 250,
  });

  useIsomorphicLayoutEffect(() => {
    if (!open) return;

    const MARGIN = 8;
    const GAP = 6;

    const update = () => {
      const el = anchorRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      // never wider than the viewport (keeps the popover usable on phones)
      const width = Math.min(preferredWidth, viewportW - MARGIN * 2);
      const left = Math.max(
        MARGIN,
        Math.min(rect.left, viewportW - width - MARGIN),
      );

      const spaceBelow = viewportH - rect.bottom - MARGIN;
      const spaceAbove = rect.top - MARGIN;
      // flip above the trigger when there is little room below
      const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
      const available = Math.max(140, (openUp ? spaceAbove : spaceBelow) - GAP);

      setStyle({
        position: "fixed",
        left,
        width,
        top: openUp ? "auto" : Math.min(rect.bottom + GAP, viewportH - 80),
        right: "auto",
        bottom: openUp ? viewportH - rect.top + GAP : "auto",
        maxHeight: available,
        overflowY: "auto",
        visibility: "visible",
        zIndex: 250,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, preferredWidth]);

  return style;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.6" />
        <rect x="14" y="3" width="7" height="7" rx="1.6" />
        <rect x="3" y="14" width="7" height="7" rx="1.6" />
        <rect x="14" y="14" width="7" height="7" rx="1.6" />
      </svg>
    ),
  },
  {
    id: "transactions",
    label: "Transactions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8h14" />
        <path d="m14 5 3 3-3 3" />
        <path d="M21 16H7" />
        <path d="m10 13-3 3 3 3" />
      </svg>
    ),
  },
  {
    id: "receipts",
    label: "Receipts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
      </svg>
    ),
  },
  {
    id: "review",
    label: "Review",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    id: "summary",
    label: "Summary",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12A9 9 0 1 1 12 3v9h9Z" />
        <path d="M15 3.5A9 9 0 0 1 20.5 9H15V3.5Z" />
      </svg>
    ),
  },
  {
    id: "export",
    label: "Export",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
    ),
  },
];

export function Sidebar({
  reviewCount = 0,
  onSelectPeriod,
}: {
  reviewCount?: number;
  /** Commit a new month/year — wired to the same handler as the topbar picker. */
  onSelectPeriod?: (month: number, year: number) => void;
}) {
  const open = useUiStore((state) => state.sidebarOpen);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const view = useUiStore((state) => state.view);
  const setView = useUiStore((state) => state.setView);
  const workspace = useUiStore((state) => state.workspace);
  const workspaces = useUiStore((state) => state.workspaces);
  const switchWorkspace = useUiStore((state) => state.switchWorkspace);
  const addWorkspace = useUiStore((state) => state.addWorkspace);
  const removeWorkspace = useUiStore((state) => state.removeWorkspace);
  const bankOnly = useUiStore((state) => state.bankOnly);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  // workspace picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null); // trigger (wrap)
  const wsPopRef = useRef<HTMLDivElement>(null); // portaled popover
  const wsPopStyle = useFixedAnchor(pickerOpen, pickerRef, 280);

  // month picker state (visible only inside the mobile drawer)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthWrapRef = useRef<HTMLDivElement>(null); // trigger (wrap)
  const monthPopRef = useRef<HTMLDivElement>(null); // portaled popover
  const monthPopStyle = useFixedAnchor(monthPickerOpen, monthWrapRef, 250);

  // delete confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // new workspace modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCurrency, setNewCurrency] = useState<Currency>("GBP");
  const [newVat, setNewVat] = useState<VatStatus>("unregistered");
  const [newNameTouched, setNewNameTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // Close picker when clicking outside (ignore clicks inside the portaled popover)
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !pickerRef.current?.contains(target) &&
        !wsPopRef.current?.contains(target)
      ) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  // Close month picker when clicking outside (mobile drawer)
  useEffect(() => {
    if (!monthPickerOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !monthWrapRef.current?.contains(target) &&
        !monthPopRef.current?.contains(target)
      ) {
        setMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [monthPickerOpen]);

  const openModal = () => {
    setPickerOpen(false);
    setNewName("");
    setNewCurrency("GBP");
    setNewVat("unregistered");
    setNewNameTouched(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewNameTouched(true);
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const now = currentPeriod();
      const record = await dbCreateWorkspace({
        name: newName.trim(),
        currency: newCurrency,
        vatStatus: newVat,
        month: now.month,
        year: now.year,
      });
      addWorkspace(record);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchWorkspace = async (id: string) => {
    setConfirmDeleteId(null);
    setPickerOpen(false);
    switchWorkspace(id);
    await dbSetActive(id);
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (deleting) return;
    setDeleting(true);
    try {
      const newActiveId = await dbDeleteWorkspace(id);
      removeWorkspace(id, newActiveId);
      setConfirmDeleteId(null);
      // If all workspaces gone (shouldn't happen with guard, but safe)
      if (!newActiveId) setPickerOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      document.body.style.overflow = "hidden";
      closeButtonRef.current?.focus({ preventScroll: true });
    } else if (wasOpen.current) {
      wasOpen.current = false;
      // the drawer is closing — its portalled popovers must not linger
      setPickerOpen(false);
      setMonthPickerOpen(false);
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
        // Escape closes the open popover first, the drawer second.
        if (pickerOpen || monthPickerOpen) {
          setPickerOpen(false);
          setMonthPickerOpen(false);
          return;
        }
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
  }, [open, closeSidebar, pickerOpen, monthPickerOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 721px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) closeSidebar();
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [closeSidebar]);

  const navigate = (id: View) => {
    setView(id);
    setPickerOpen(false);
    setMonthPickerOpen(false);
    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          onClick={() => {
            setPickerOpen(false);
            setMonthPickerOpen(false);
            closeSidebar();
          }}
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

        <button
          type="button"
          className={styles.brand}
          onClick={() => navigate("overview")}
          aria-label="Month-End Pack — go to overview"
        >
          <span className={styles.brandMark}>M</span>
          <span className={styles.brandText}>
            <strong>
              Month-End <em>pack</em>
            </strong>
          </span>
        </button>

        <div className={styles.workspace}>
          <span className={styles.wsLabel}>Workspace</span>
          <div
            ref={pickerRef}
            className={`${styles.wsPickerWrap} ${pickerOpen ? styles.wsPickerOpen : ""}`}
          >
            <button
              type="button"
              className={styles.wsPicker}
              onClick={() => setPickerOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
              aria-label={
                workspace
                  ? `Workspace ${workspace.name}. Switch or create a workspace.`
                  : "My workspace. Switch or create a workspace."
              }
              title={workspace?.name ?? "My workspace"}
            >
              <span className={styles.wsDot} />
              <span className={styles.wsPickerName}>{workspace?.name ?? "My workspace"}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {pickerOpen &&
              createPortal(
                <div
                  ref={wsPopRef}
                  className={`${styles.popoverLayer} ${styles.wsPopover}`}
                  style={wsPopStyle}
                  role="listbox"
                >
                {workspaces.map((ws) => (
                  <div key={ws.id} className={styles.wsPopoverRow}>
                    {confirmDeleteId === ws.id ? (
                      /* inline confirmation */
                      <div className={styles.wsConfirmRow}>
                        <span className={styles.wsConfirmMsg}>
                          Delete &ldquo;{ws.name}&rdquo;?
                        </span>
                        <div className={styles.wsConfirmActions}>
                          <button
                            type="button"
                            className={styles.wsConfirmCancel}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={styles.wsConfirmDelete}
                            disabled={deleting}
                            onClick={() => handleDeleteWorkspace(ws.id)}
                          >
                            {deleting ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          role="option"
                          aria-selected={ws.id === workspace?.id}
                          className={`${styles.wsPopoverItem} ${ws.id === workspace?.id ? styles.wsActive : ""}`}
                          onClick={() => handleSwitchWorkspace(ws.id)}
                        >
                          <span className={styles.wsPopoverDot} />
                          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ws.name}
                          </span>
                          {ws.id === workspace?.id && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 12, height: 12, flexShrink: 0 }}>
                              <path d="m5 12 5 5L20 7" />
                            </svg>
                          )}
                        </button>
                        {/* delete button — only rendered when more than one workspace exists */}
                        {workspaces.length > 1 && (
                          <button
                            type="button"
                            className={styles.wsDeleteBtn}
                            aria-label={`Delete workspace ${ws.name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(ws.id);
                            }}
                            title={`Delete "${ws.name}"`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                            </svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div className={styles.wsPopoverDivider} />
                <button
                  type="button"
                  className={styles.wsPopoverNew}
                  onClick={openModal}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  New workspace
                </button>
              </div>,
                document.body
              )}
          </div>
        </div>

        {/* Month/year picker — lives in the drawer on small screens only */}
        <div className={styles.drawerMonth} ref={monthWrapRef}>
          <span className={styles.wsLabel}>Period</span>
          <div className={styles.drawerMonthWrap}>
            <button
              type="button"
              className={styles.drawerMonthBtn}
              onClick={() => setMonthPickerOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={monthPickerOpen}
              aria-label={`Selected period ${workspace ? formatPeriodShort({ month: workspace.month, year: workspace.year }) : ""}. Change month or year.`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
              </svg>
              {workspace
                ? formatPeriodShort({ month: workspace.month, year: workspace.year })
                : "—"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.chev}>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {monthPickerOpen &&
              workspace &&
              createPortal(
                <div ref={monthPopRef}>
                  <MonthPicker
                    month={workspace.month}
                    year={workspace.year}
                    className={styles.popoverLayer}
                    style={monthPopStyle}
                    onSelect={(month, year) => {
                      onSelectPeriod?.(month, year);
                      setMonthPickerOpen(false);
                    }}
                    onClose={() => setMonthPickerOpen(false)}
                  />
                </div>,
                document.body,
              )}
          </div>
        </div>

        <nav className={styles.nav} aria-label="Main">
          {NAV_ITEMS.filter(
            (item) => !(bankOnly && item.id === "receipts"),
          ).map((item) => {
            const badge = item.id === "review" ? reviewCount : item.badge;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.navItem} ${view === item.id ? styles.active : ""}`}
                onClick={() => navigate(item.id)}
                aria-current={view === item.id ? "page" : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
                {badge != null && badge > 0 && (
                  <span className={styles.navBadge}>{badge}</span>
                )}
              </button>
            );
          })}
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

        <button
          type="button"
          className={`${styles.navItem} ${view === "settings" ? styles.active : ""}`}
          onClick={() => navigate("settings")}
          aria-current={view === "settings" ? "page" : undefined}
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
      </aside>

      {/* ---- New workspace modal ---- */}
      {modalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="ws-modal-title">
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} id="ws-modal-title">New workspace</h2>
              <button type="button" className={styles.modalClose} onClick={closeModal} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m6 6 12 12" /><path d="M18 6 6 18" />
                </svg>
              </button>
            </div>

            <form className={styles.modalForm} onSubmit={handleCreateWorkspace} noValidate>
              {/* name */}
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="ws-modal-name">
                  Workspace name
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>Required</span>
                </label>
                <input
                  id="ws-modal-name"
                  type="text"
                  className={`${styles.fieldInput} ${newNameTouched && !newName.trim() ? styles.error : ""}`}
                  placeholder="e.g. Side business, Personal"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => setNewNameTouched(true)}
                  autoComplete="off"
                  autoFocus
                  maxLength={60}
                />
                {newNameTouched && !newName.trim() && (
                  <span style={{ color: "var(--red-ink)", fontSize: 11 }}>Please enter a name.</span>
                )}
              </div>

              {/* currency */}
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Currency</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["GBP", "EUR"] as Currency[]).map((c) => (
                    <label
                      key={c}
                      className={`${styles.choice} ${newCurrency === c ? styles.selected : ""}`}
                      style={{ flex: 1 }}
                    >
                      <input type="radio" name="modal-currency" value={c} checked={newCurrency === c} onChange={() => setNewCurrency(c)} />
                      <span className={styles.choiceMark} />
                      <span className={styles.choiceTitle}>{c === "GBP" ? "£ GBP" : "€ EUR"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* vat */}
              <div className={styles.field}>
                <span className={styles.fieldLabel}>VAT status</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {([
                    { value: "registered" as VatStatus, label: "VAT registered" },
                    { value: "unregistered" as VatStatus, label: "Not registered" },
                  ]).map((opt) => (
                    <label
                      key={opt.value}
                      className={`${styles.choice} ${newVat === opt.value ? styles.selected : ""}`}
                    >
                      <input type="radio" name="modal-vat" value={opt.value} checked={newVat === opt.value} onChange={() => setNewVat(opt.value)} />
                      <span className={styles.choiceMark} />
                      <span className={styles.choiceTitle}>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={`${styles.btnSecondary} ${styles.btnSm}`} onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className={`${styles.btnPrimary} ${styles.btnSm}`} disabled={saving}>
                  {saving ? "Creating…" : "Create workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
