"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconCheck,
  IconClipboard,
  IconUserOff,
  IconReceipt,
  IconDuplicate,
  IconAlertTriangle,
  IconCash,
  IconCurrency,
  IconChevronDown,
} from "@tabler/icons-react";
import styles from "./home.module.css";
import { DEFAULT_CATEGORIES } from "../types";

type ExType =
  | "missing_receipt"
  | "unmatched_receipt"
  | "duplicate_transaction"
  | "duplicate_receipt"
  | "amount_mismatch"
  | "foreign_currency"
  | "possible_personal"
  | "uncategorised"
  | "low_confidence";

interface Exception {
  id: string;
  type: ExType;
  severity: "high" | "medium" | "low";
  message: string;
  sub?: string;
  date?: string;
  category?: string;
  value?: number;
  checked?: boolean;
}

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "possible_personal", label: "Personal" },
  { key: "duplicate_transaction", label: "Duplicates" },
  { key: "foreign_currency", label: "Foreign currency" },
  { key: "uncategorised", label: "Needs a look" },
];

const GROUP: Record<ExType, string> = {
  missing_receipt: "Missing receipt",
  unmatched_receipt: "Unmatched receipt",
  duplicate_transaction: "Duplicate transaction",
  duplicate_receipt: "Duplicate receipt",
  amount_mismatch: "Amount mismatch",
  foreign_currency: "Foreign currency",
  possible_personal: "Possible personal",
  uncategorised: "Uncategorised",
  low_confidence: "Low confidence",
};

const SEVERITY: Record<string, { label: string; pillCls: string; iconCls: string }> = {
  high: { label: "High", pillCls: styles.missing, iconCls: styles.rwIconRed },
  medium: { label: "Medium", pillCls: styles.review, iconCls: styles.rwIconAmber },
  low: { label: "Low", pillCls: styles.info, iconCls: styles.rwIconBlue },
};

export function ExceptionsScreen({
  exceptions,
  onAcceptSuggested,
  onSetCategory,
  onMarkPersonal,
  onMarkReviewed,
  currency = "GBP",
}: {
  exceptions: Exception[];
  onAcceptSuggested?: (ids: string[]) => void;
  onSetCategory?: (ids: string[], category: string) => void;
  onMarkPersonal?: (ids: string[]) => void;
  onMarkReviewed?: (ids: string[]) => void;
  currency?: "GBP" | "EUR";
}) {
  const symbol = currency === "EUR" ? "€" : "£";

  const [filter, setFilter] = useState("all");
  const [bulk, setBulk] = useState<string[]>([]);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [focusIdxRaw, setFocusIdx] = useState(0);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const open = useMemo(
    () => exceptions.filter((e) => !resolved.has(e.id)),
    [exceptions, resolved],
  );

  const filtered = useMemo(() => {
    const base = filter === "all" ? exceptions : exceptions.filter((e) => e.type === filter);
    return base.filter((e) => !resolved.has(e.id));
  }, [exceptions, filter, resolved]);

  // keep keyboard focus inside bounds when the list changes — derived, not stored
  const focusIdx = Math.min(focusIdxRaw, Math.max(0, filtered.length - 1));

  const selected = bulk.filter((id) => filtered.some((e) => e.id === id));
  const selecting = selected.length > 0;

  const toggle = (id: string) => {
    setBulk((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    const allSelected = filtered.length > 0 && filtered.every((e) => bulk.includes(e.id));
    setBulk(allSelected ? [] : filtered.map((e) => e.id));
  };

  const resolve = (ids: string[]) => {
    setResolved((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setBulk((prev) => prev.filter((id) => !ids.includes(id)));
  };

  const accept = (ids: string[]) => {
    onAcceptSuggested?.(ids);
    resolve(ids);
  };

  const markPersonal = (ids: string[]) => {
    onMarkPersonal?.(ids);
    resolve(ids);
  };

  const markReviewed = (ids: string[]) => {
    onMarkReviewed?.(ids);
    resolve(ids);
  };

  const setCategory = (ids: string[], categoryId: string) => {
    onSetCategory?.(ids, categoryId);
    const name =
      DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
    setCategories((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = name));
      return next;
    });
    resolve(ids);
  };

  const acceptSuggestions = () => {
    const ids = filtered.filter((e) => e.severity !== "high").map((e) => e.id);
    if (ids.length > 0) accept(ids);
  };

  // keyboard-first review: J/K move, Space select, A accept
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (filtered.length === 0) return;
      const focused = filtered[Math.min(focusIdx, filtered.length - 1)];
      if (!focused) return;
      if (e.key === "j") {
        e.preventDefault();
        setFocusIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === "k") {
        e.preventDefault();
        setFocusIdx((i) => Math.max(0, i - 1));
      } else if (e.key === " ") {
        e.preventDefault();
        toggle(focused.id);
      } else if (e.key === "a") {
        e.preventDefault();
        accept([focused.id]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-registered on every render — closures stay fresh

  // select-all checkbox: reflect page scope, support indeterminate
  const allSelected = filtered.length > 0 && filtered.every((e) => bulk.includes(e.id));
  const someSelected = filtered.some((e) => bulk.includes(e.id)) && !allSelected;
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const remaining = open.length;
  const total = exceptions.length;
  const progress = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
  const suggestionCount = filtered.filter((e) => e.severity !== "high").length;

  const formatAmount = (v: number) =>
    `${v >= 0 ? "+" : "−"}${symbol}${Math.abs(v).toFixed(2)}`;

  return (
    <div className={styles.screen}>
      {/* ------------------------------ header ------------------------------ */}
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Review</span>
          <h2 className={styles.sectionH2}>Exceptions</h2>
        </div>
        <div className={styles.sectionActions}>
          {total > 0 && (
            <span className={styles.tag}>
              {remaining} of {total} to review
            </span>
          )}
        </div>
      </div>

      <section className={styles.section}>
        {/* progress */}
        {total > 0 && (
          <div className={styles.rwProgress}>
            <div className={styles.rwProgressBar}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.rwProgressLabel}>{progress}% reviewed</span>
          </div>
        )}

        {/* toolbar — swaps between filters and bulk actions */}
        <div className={styles.rwToolbar}>
          {selecting ? (
            <>
              <div className={styles.rwToolbarInfo}>
                <span className={styles.badge}>{selected.length}</span>
                <span className={styles.rwToolbarLabel}>
                  {selected.length === 1 ? "item selected" : "items selected"}
                </span>
                <button
                  type="button"
                  className={`${styles.btnGhostSmall} ${styles.sm}`}
                  onClick={() => setBulk([])}
                >
                  Clear
                </button>
              </div>
              <div className={styles.rwBarActions}>
                <div className={styles.rwCategoryWrap}>
                  <select
                    className={styles.rwCategorySelect}
                    defaultValue=""
                    aria-label="Set category for selected items"
                    onChange={(e) => {
                      if (e.target.value) {
                        setCategory(selected, e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>
                      Set category…
                    </option>
                    {DEFAULT_CATEGORIES.filter((c) => c.id !== "uncategorised").map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <IconChevronDown size={13} stroke={1.8} className={styles.rwCategoryChev} />
                </div>
                <button
                  type="button"
                  className={`${styles.btnSecondary} ${styles.sm}`}
                  onClick={() => markReviewed(selected)}
                >
                  <IconCheck size={13} stroke={1.8} />
                  Mark reviewed
                </button>
                <button
                  type="button"
                  className={`${styles.btnDanger} ${styles.sm}`}
                  onClick={() => markPersonal(selected)}
                >
                  <IconUserOff size={13} stroke={1.8} />
                  Mark personal
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={styles.filterTabs} role="tablist">
                {FILTER_TABS.map((t) => {
                  const count =
                    t.key === "all"
                      ? total
                      : exceptions.filter((e) => e.type === t.key && !resolved.has(e.id)).length;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="tab"
                      aria-selected={filter === t.key}
                      className={`${styles.filterTab} ${
                        filter === t.key ? styles.active : ""
                      }`}
                      onClick={() => setFilter(t.key)}
                    >
                      {t.label}
                      {count > 0 && <span className={styles.badge}>{count}</span>}
                    </button>
                  );
                })}
              </div>
              <div className={styles.rwBarActions}>
                {suggestionCount > 0 && (
                  <button
                    type="button"
                    className={`${styles.btnGhostSmall} ${styles.sm}`}
                    onClick={acceptSuggestions}
                  >
                    <IconCheck size={13} stroke={1.8} />
                    Accept {suggestionCount} suggestion{suggestionCount === 1 ? "" : "s"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* list */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <IconCheck size={22} stroke={1.8} />
            </div>
            <div className={styles.emptyTitle}>
              {total > 0 && remaining === 0 ? "All reviewed" : "Nothing here"}
            </div>
            <div className={styles.emptyDesc}>
              {total > 0 && remaining === 0
                ? "Every exception has been handled. Your month is looking clean."
                : "No exceptions match this filter."}
            </div>
          </div>
        ) : (
          <div className={styles.rwTable} role="table" aria-label="Exceptions to review">
            {/* head */}
            <div className={styles.rwHead} role="row">
              <div className={styles.rwCellCheck} role="columnheader">
                <label className={styles.check}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label={`Select all ${filtered.length} items in this view`}
                  />
                  <span className={styles.checkBox} />
                </label>
              </div>
              <div role="columnheader">Issue</div>
              <div className={styles.rwDate} role="columnheader">
                Date
              </div>
              <div className={styles.rwAmount} role="columnheader">
                Amount
              </div>
              <div className={styles.rwSeverity} role="columnheader">
                Severity
              </div>
              <div className={styles.rwActions} role="columnheader">
                <span className={styles.visuallyHidden}>Actions</span>
              </div>
            </div>

            {/* rows */}
            {filtered.map((ex, idx) => {
              const sev = SEVERITY[ex.severity] ?? SEVERITY.low;
              const isFocused = idx === focusIdx;
              const category = categories[ex.id] ?? ex.category;
              return (
                <div
                  key={ex.id}
                  role="row"
                  className={`${styles.rwRow} ${isFocused ? styles.rwRowFocus : ""} ${
                    bulk.includes(ex.id) ? styles.rwRowSelected : ""
                  }`}
                >
                  <div className={styles.rwCellCheck} role="cell">
                    <label className={styles.check}>
                      <input
                        type="checkbox"
                        checked={bulk.includes(ex.id)}
                        onChange={() => toggle(ex.id)}
                        aria-label={`Select ${GROUP[ex.type]}: ${ex.message}`}
                      />
                      <span className={styles.checkBox} />
                    </label>
                  </div>

                  <div className={styles.rwIssue} role="cell">
                    <span className={`${styles.exIcon} ${sev.iconCls}`}>
                      <ExceptionIcon type={ex.type} />
                    </span>
                    <span className={styles.rwIssueText}>
                      <span className={styles.rwIssueType}>{GROUP[ex.type] ?? ex.type}</span>
                      <span className={styles.rwIssueTitle}>{ex.message}</span>
                      {ex.sub && <span className={styles.rwIssueReason}>{ex.sub}</span>}
                      {category && <span className={styles.chip}>{category}</span>}
                    </span>
                  </div>

                  <div className={styles.rwDate} role="cell">
                    {ex.date ?? "—"}
                  </div>

                  <div
                    className={`${styles.rwAmount} ${ex.value !== undefined && ex.value >= 0 ? styles.rwAmountIn : ""}`}
                    role="cell"
                  >
                    {ex.value !== undefined ? formatAmount(ex.value) : "—"}
                  </div>

                  <div className={styles.rwSeverity} role="cell">
                    <span className={`${styles.status} ${sev.pillCls}`}>{sev.label}</span>
                  </div>

                  <div className={styles.rwActions} role="cell">
                    <div className={styles.rwRowActions}>
                      <button
                        type="button"
                        className={styles.btnGhostSmall}
                        onClick={() => accept([ex.id])}
                      >
                        <IconCheck size={13} stroke={1.8} />
                        Accept
                      </button>
                      {ex.type === "possible_personal" && (
                        <button
                          type="button"
                          className={styles.btnDanger}
                          onClick={() => markPersonal([ex.id])}
                        >
                          <IconUserOff size={13} stroke={1.8} />
                          Personal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* footer */}
        <div className={styles.tableFooter}>
          <span className={styles.tableCount}>
            {filtered.length} item{filtered.length !== 1 ? "s" : ""} in view
          </span>
          <div className={styles.rwKbdHints}>
            <span className={styles.kbd}>J</span>
            <span>next</span>
            <span className={styles.kbd}>K</span>
            <span>prev</span>
            <span className={styles.kbd}>Space</span>
            <span>select</span>
            <span className={styles.kbd}>A</span>
            <span>accept</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function ExceptionIcon({ type }: { type: ExType }) {
  if (type === "missing_receipt" || type === "unmatched_receipt") {
    return <IconReceipt size={15} stroke={1.8} />;
  }
  if (type === "duplicate_transaction" || type === "duplicate_receipt") {
    return <IconDuplicate size={15} stroke={1.8} />;
  }
  if (type === "amount_mismatch") {
    return <IconCash size={15} stroke={1.8} />;
  }
  if (type === "foreign_currency") {
    return <IconCurrency size={15} stroke={1.8} />;
  }
  if (type === "possible_personal") {
    return <IconUserOff size={15} stroke={1.8} />;
  }
  if (type === "uncategorised") {
    return <IconClipboard size={15} stroke={1.8} />;
  }
  return <IconAlertTriangle size={15} stroke={1.8} />;
}
