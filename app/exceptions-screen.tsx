"use client";

import { useState, useMemo } from "react";
import {
  IconCheck,
  IconX,
  IconClipboard,
  IconUserOff,
  IconReceipt,
  IconDuplicate,
  IconAlertTriangle,
  IconCash,
  IconCurrency,
} from "@tabler/icons-react";
import styles from "./home.module.css";

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
  category?: string;
  value?: number;
  valueLabel?: string;
  checked?: boolean;
}

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs_review", label: "Needs review" },
  { key: "missing_receipt", label: "Missing receipt" },
  { key: "unmatched_receipt", label: "Unmatched receipt" },
  { key: "duplicate", label: "Duplicates" },
  { key: "low_confidence", label: "Low confidence" },
];

const GROUP: Record<ExType, { label: string; icon: string }> = {
  missing_receipt: { label: "Missing receipt", icon: "receipt" },
  unmatched_receipt: { label: "Unmatched receipt", icon: "receipt" },
  duplicate_transaction: { label: "Duplicate transaction", icon: "duplicate" },
  duplicate_receipt: { label: "Duplicate receipt", icon: "duplicate" },
  amount_mismatch: { label: "Amount mismatch", icon: "amount" },
  foreign_currency: { label: "Foreign currency", icon: "currency" },
  possible_personal: { label: "Possible personal", icon: "personal" },
  uncategorised: { label: "Uncategorised", icon: "uncategorised" },
  low_confidence: { label: "Low confidence", icon: "review" },
};

const SEV: Record<string, string> = {
  high: styles.red,
  medium: styles.amber,
  low: styles.blue,
};

export function ExceptionsScreen({
  exceptions,
  onAcceptSuggested,
  onSetCategory,
  onMarkPersonal,
  onMarkReviewed,
}: {
  exceptions: Exception[];
  onAcceptSuggested?: (ids: string[]) => void;
  onSetCategory?: (ids: string[], category: string) => void;
  onMarkPersonal?: (ids: string[]) => void;
  onMarkReviewed?: (ids: string[]) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [bulk, setBulk] = useState<string[]>([]);
  const [nextId, setNextId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? exceptions
        : filter === "duplicate"
        ? exceptions.filter((e) =>
            e.type === "duplicate_transaction" || e.type === "duplicate_receipt",
          )
        : exceptions.filter((e) => e.type === filter),
    [exceptions, filter],
  );

  const selected = bulk.length;
  const counts = {
    needs_review: exceptions.filter(
      (e) => e.type === "low_confidence",
    ).length,
    missing: exceptions.filter((e) => e.type === "missing_receipt").length,
    unmatched: exceptions.filter((e) => e.type === "unmatched_receipt").length,
    duplicate: exceptions.filter(
      (e) => e.type === "duplicate_transaction" || e.type === "duplicate_receipt",
    ).length,
  };

  const next = () => {
    const remaining = filtered.filter((e) => !e.checked);
    if (remaining.length === 0) return;
    setNextId(remaining[0].id);
  };

  const current = nextId ? filtered.find((e) => e.id === nextId) : null;

  return (
    <div className={styles.screen}>
      {/* header */}
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Review</span>
          <h2 className={styles.sectionH2}>Exceptions</h2>
        </div>
        <div className={styles.sectionActions}>
          <span className={styles.tag}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
          {selected > 0 && (
            <span className={styles.badge}>{selected}</span>
          )}
        </div>
      </div>

      {/* tabs */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Filter</span>
            <h2 className={styles.sectionH2}>What needs attention</h2>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filterTabs}>
            {FILTER_TABS.map((t) => {
              const count =
                t.key === "all"
                  ? exceptions.length
                  : t.key === "duplicate"
                  ? counts.duplicate
                  : t.key === "needs_review"
                  ? counts.needs_review
                  : counts[t.key as keyof typeof counts] ?? 0;
              return (
                <button
                  key={t.key}
                  type="button"
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

          <div className={styles.filterSpacer} />

          {selected > 0 && (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className={styles.hintInline}>
                {selected} selected
              </span>
              <button
                type="button"
                className={`${styles.btnGhostSmall} ${styles.sm}`}
                onClick={() => setBulk([])}
              >
                Clear
              </button>
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles.sm}`}
                onClick={() => onMarkReviewed?.(bulk)}
              >
                <IconCheck size={13} stroke={1.8} />
                Mark reviewed
              </button>
              <button
                type="button"
                className={`${styles.btnDanger} ${styles.sm}`}
                onClick={() => onMarkPersonal?.(bulk)}
              >
                <IconUserOff size={13} stroke={1.8} />
                Mark personal
              </button>
            </div>
          )}
        </div>

        {/* count summary */}
        <div
          className={styles.metaRow}
          style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}
        >
          <div className={styles.metaItem}>
            <strong>{counts.needs_review}</strong> need review
          </div>
          <div className={styles.metaItem}>
            <strong>{counts.missing}</strong> missing receipt
          </div>
          <div className={styles.metaItem}>
            <strong>{counts.unmatched}</strong> unmatched receipt
          </div>
          <div className={styles.metaItem}>
            <strong>{counts.duplicate}</strong> duplicates
          </div>
        </div>
      </div>

      {/* item list */}
      <div className={styles.section}>
        <div
          className={styles.sectionHead}
          style={{ marginBottom: 4 }}
        >
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>
              {filter === "all" ? "All exceptions" : GROUP[
                filter as ExType
              ]?.label ?? "Exceptions"}
            </span>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <IconCheck size={22} stroke={1.8} />
            </div>
            <div className={styles.emptyTitle}>Nothing here</div>
            <div className={styles.emptyDesc}>
              No exceptions match this filter. Your month is looking clean.
            </div>
          </div>
        )}

        {filtered.map((ex) => (
          <div
            key={ex.id}
            className={styles.exception}
            style={{
              borderLeft:
                "3px solid " +
                (SEV[ex.severity] === styles.red
                  ? "var(--red-ink)"
                  : SEV[ex.severity] === styles.amber
                  ? "var(--amber-ink)"
                  : "var(--blue-ink)"),
            }}            >          <span className={`${styles.exIcon} ${SEV[ex.severity] === styles.red ? styles.exIconRed : SEV[ex.severity] === styles.amber ? styles.exIconAmber : styles.exIconBlue}`}
              style={{ width: 34, height: 34 }}
            >
              <ExceptionIcon type={ex.type} />
            </span>

            <div className={styles.exBody}>
              <strong>
                {GROUP[ex.type]?.label ?? ex.type}
              </strong>
              <span>
                {ex.message}
                {ex.sub && <> &middot; {ex.sub}</>}
              </span>
            </div>

            {ex.category && (
              <span className={styles.chip}>{ex.category}</span>
            )}
            {ex.value !== undefined && ex.valueLabel && (
              <span
                className={styles.tag}
                style={{
                  borderColor: "var(--amber)",
                  color: "var(--amber-ink)",
                  background: "var(--amber-soft)",
                }}
              >
                {ex.valueLabel}
              </span>
            )}

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span className={styles.check}>
                <input
                  type="checkbox"
                  className={styles.checkBox}
                  checked={ex.checked ?? bulk.includes(ex.id)}
                  onChange={() => {
                    setBulk((prev) =>
                      prev.includes(ex.id)
                        ? prev.filter((id) => id !== ex.id)
                        : [...prev, ex.id],
                    );
                  }}
                />
              </span>
              <button
                type="button"
                className={`${styles.btnGhostSmall} ${styles.sm}`}
                onClick={() => {
                  onAcceptSuggested?.([ex.id]);
                }}
              >
                Accept
              </button>
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles.sm}`}
                onClick={() => {
                  onSetCategory?.([ex.id], "software");
                }}
              >
                Set category
              </button>
              {ex.type === "possible_personal" && (
                <button
                  type="button"
                  className={`${styles.btnDanger} ${styles.sm}`}
                  onClick={() => onMarkPersonal?.([ex.id])}
                >
                  <IconUserOff size={13} stroke={1.8} />
                  Personal
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* bulk actions bar when nothing selected */}
      {selected === 0 && (
        <div
          className={styles.callout}
          style={{ margin: "-12px -12px 0", background: "var(--sage)", borderColor: "#c3d6c0", color: "var(--forest)" }}              >
            <span
              className={`${styles.calloutIcon} ${styles.exIcon} ${styles.exIconForest}`}
              data-ex>
            <IconClipboard size={15} stroke={1.8} />
          </span>
          <div>
            <strong>
              You can accept all high-confidence suggestions in one go.
            </strong>
            <p style={{ margin: "5px 0 0", color: "inherit" }}>
              Use the checkboxes to pick items, or Accept on each one as you go.
            </p>
          </div>
          <button
            type="button"
            className={`${styles.btnSecondary} ${styles.sm}`}
            style={{ marginLeft: "auto" }}
            onClick={() => onAcceptSuggested?.(filtered.filter((e) => e.severity !== "high").map((e) => e.id))}
          >
            Accept all high-confidence
          </button>
        </div>
      )}

      {/* keyboard-next hint */}
      <div
        className={styles.metaRow}
        style={{ marginTop: 6, color: "var(--muted)", fontSize: 11 }}
      >
        <span className={styles.kbd}>J</span>
        <span>next item</span>
        <span style={{ marginLeft: 14 }} className={styles.kbd}>K</span>
        <span>previous</span>
        <span style={{ marginLeft: 14 }} className={styles.kbd}>Space</span>
        <span>toggle</span>
        <span style={{ marginLeft: 14 }} className={styles.kbd}>A</span>
        <span>accept</span>
      </div>

      {/* focused item overlay */}
      {current && (
        <div
          className={styles.callout}
          style={{
            margin: "-12px -12px 0",
            background: "var(--surface)",
            border: "1px solid var(--line-strong)",
            borderLeft: "3px solid var(--forest)",
          }}
        >
          <span className={`${styles.calloutIcon} ${styles.exIcon} ${styles.exIconForest}`} data-ex>
            <IconAlertTriangle size={15} stroke={1.8} />
          </span>
          <div>
            <strong>Focused item</strong>
            <p style={{ margin: "5px 0 0", color: "inherit" }}>
              {GroupLabel(current.type)}: {current.message}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
            <span className={styles.kbd}>J</span>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>skip</span>
          </div>
        </div>
      )}

      {/* footer */}
      <div className={styles.tableFooter} style={{ paddingTop: 12 }}>
        <span className={styles.tableCount}>
          {filtered.length} exception{filtered.length !== 1 ? "s" : ""} ·
          {filtered.filter((e) => !e.checked).length} remaining
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`${styles.btnSecondary} ${styles.sm}`}
            onClick={() => onAcceptSuggested?.(filtered.map((e) => e.id))}
          >
            Accept all
          </button>
          <button
            type="button"
            className={`${styles.btnPrimary} ${styles.sm}`}
            onClick={() => onMarkReviewed?.([])}
          >
            <IconCheck size={13} stroke={1.8} />
            Mark all reviewed
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupLabel(type: ExType) {
  return GROUP[type]?.label ?? type;
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

// inline alert icon shim so the focused-item overlay can render without
// depending on IconAlert when it is not otherwise imported.

