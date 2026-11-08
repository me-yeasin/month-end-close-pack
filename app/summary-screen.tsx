"use client";

import { useMemo } from "react";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconDuplicate,
  IconAlertTriangle,
  IconCheck,
  IconClipboard,
  IconCurrency,
  IconCash,
} from "@tabler/icons-react";
import styles from "./home.module.css";

interface CategoryRow {
  name: string;
  amount: number;
  pct: number;
  color: string;
}

interface Summary {
  monthLabel: string;
  currency: "GBP" | "EUR";
  totalIn: number;
  totalOut: number;
  net: number;
  inDelta?: number;
  outDelta?: number;
  categories: CategoryRow[];
  vat: {
    included: number;
    excluded: number;
    rate: number;
    net: number;
  };
  counts: {
    missingReceipts: number;
    unmatchedReceipts: number;
    duplicates: number;
    uncategorised: number;
    lowConfidence: number;
  };
  readiness: number;
  blockers: { label: string; count: number; value?: number }[];
}

export function MonthSummaryScreen({ summary }: { summary: Summary }) {
  const currencySymbol = summary.currency === "GBP" ? "£" : "€";

  const largest = useMemo(
    () => (summary.categories.length ? Math.max(...summary.categories.map((c) => c.amount)) : 1),
    [summary.categories],
  );

  return (
    <div className={styles.screen}>
      {/* header */}
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>This month</span>
          <h2 className={styles.sectionH2}>{summary.monthLabel}</h2>
        </div>
        <div className={styles.sectionActions}>
          <span className={styles.tag}>{summary.currency}</span>
          <span className={styles.tag}>
            {summary.counts.missingReceipts + summary.counts.uncategorised} to resolve
          </span>
        </div>
      </div>

      {/* totals */}
      <div
        className={`${styles.section} ${styles.money}`}
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
      >
        <div className={styles.moneyRow}>
          <span className={styles.label}>Money in</span>
          <span className={styles.value}>
            <strong>
              {currencySymbol}
              {summary.totalIn.toFixed(2)}
            </strong>
            {summary.inDelta !== undefined && (
              <small
                className={summary.inDelta >= 0 ? styles.up : "color: var(--red-ink)"}
              >
                {summary.inDelta >= 0 ? "+" : ""}
                {summary.inDelta.toFixed(1)}% vs last month
              </small>
            )}
          </span>
        </div>
        <div className={styles.moneyRow}>
          <span className={styles.label}>Money out</span>
          <span className={styles.value}>
            <strong>
              {currencySymbol}
              {summary.totalOut.toFixed(2)}
            </strong>
            {summary.outDelta !== undefined && (
              <small
                className={summary.outDelta >= 0 ? styles.up : "color: var(--red-ink)"}
              >
                {summary.outDelta >= 0 ? "+" : ""}
                {summary.outDelta.toFixed(1)}% vs last month
              </small>
            )}
          </span>
        </div>
        <div className={`${styles.moneyRow} ${styles.net}`}>
          <span className={styles.label}>Net</span>
          <span className={styles.value}>
            <strong>
              {currencySymbol}
              {summary.net.toFixed(2)}
            </strong>
            <small>vs last month</small>
          </span>
        </div>
      </div>

      {/* category breakdown */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Where it went</span>
            <h2 className={styles.sectionH2}>By category</h2>
          </div>
          <button type="button" className={styles.cardLink}>
            All categories
          </button>
        </div>

        {summary.categories.length === 0 ? (
          <div className={styles.empty} style={{ padding: "24px 12px" }}>
            <div className={styles.emptyTitle}>No categories yet</div>
            <div className={styles.emptyDesc}>
              Assign categories to transactions and they will appear here.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {summary.categories.map((c) => (
              <div key={c.name} className={styles.catRow}>
                <div className={styles.catTop}>
                  <span>{c.name}</span>
                  <strong>
                    {currencySymbol}
                    {c.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </strong>
                </div>
                <div className={styles.bar}>
                  <span
                    style={{
                      width: `${Math.min(100, (c.amount / largest) * 100)}%`,
                      background:
                        c.color
                          ? `linear-gradient(90deg, ${c.color}, ${c.color}dd)`
                          : "linear-gradient(90deg, var(--forest-3), #4c8b6a)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VAT summary */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>VAT summary</span>
            <h2 className={styles.sectionH2}>Simple view, not a return</h2>
          </div>
        </div>

        <div
          className={styles.tableWrap}
          style={{ marginTop: 2, borderTop: "1px solid var(--line)" }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "9px 0",
                    color: "var(--muted)",
                    fontSize: 11,
                    width: "55%",
                  }}
                >
                  VAT included in amounts
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 550,
                  }}
                >
                  {currencySymbol}
                  {summary.vat.included.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "9px 0",
                    color: "var(--muted)",
                    fontSize: 11,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  VAT excluded from amounts
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 550,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  {currencySymbol}
                  {summary.vat.excluded.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "9px 0",
                    color: "var(--muted)",
                    fontSize: 11,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  Implied VAT rate
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 550,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  {summary.vat.rate.toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    padding: "9px 0",
                    color: "var(--muted)",
                    fontSize: 11,
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  Total net (approx.)
                </td>
                <td
                  style={{
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 600,
                    color: "var(--forest-3)",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  {currencySymbol}
                  {summary.vat.net.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          className={styles.callout}
          style={{ margin: "12px -12px 0", background: "var(--blue-soft)", color: "var(--blue-ink)", borderColor: "#c3d6e0" }}
        >
          <span className={`${styles.calloutIcon} ${styles.exIcon} ${styles.blue}`}>
            <IconCurrency size={15} stroke={1.8} />
          </span>
          <div>
            <strong>Not a VAT return.</strong>
            <p style={{ margin: "5px 0 0", color: "inherit" }}>
              This is a simple summary to help you and your accountant. It does
              not replace a formal VAT calculation.
            </p>
          </div>
        </div>
      </div>

      {/* exceptions */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>What is blocking the pack</span>
            <h2 className={styles.sectionH2}>Exceptions</h2>
          </div>
          <button
            type="button"
            className={`${styles.btnSecondary} ${styles.sm}`}
          >              <IconAlertTriangle size={13} stroke={1.8} />
            Review
          </button>
        </div>

        <div
          className={styles.metaRow}
          style={{ marginTop: 4 }}
        >
          <div className={styles.metaItem}>
            <span
              className={`${styles.statusPill} ${styles.danger}`}
            >
              <IconAlertTriangle size={11} stroke={2} />
            </span>
            <strong>{summary.counts.missingReceipts}</strong> missing receipt
            {summary.counts.missingReceipts !== 1 ? "s" : ""}
          </div>
          <div className={styles.metaItem}>
            <span
              className={`${styles.statusPill} ${styles.warning}`}
            >
              <IconAlertTriangle size={11} stroke={2} />
            </span>
            <strong>{summary.counts.unmatchedReceipts}</strong> unmatched receipt
            {summary.counts.unmatchedReceipts !== 1 ? "s" : ""}
          </div>
          <div className={styles.metaItem}>
            <span
              className={`${styles.statusPill} ${styles.muted}`}
            >
              <IconDuplicate size={11} stroke={2} />
            </span>
            <strong>{summary.counts.duplicates}</strong> duplicate
            {summary.counts.duplicates !== 1 ? "s" : ""}
          </div>
          <div className={styles.metaItem}>
            <span
              className={`${styles.statusPill} ${styles.amber}`}
            >
              <IconClipboard size={11} stroke={2} />
            </span>
            <strong>{summary.counts.uncategorised}</strong> uncategorised
          </div>
          <div className={styles.metaItem}>
            <span
              className={`${styles.statusPill} ${styles.amber}`}
            >
              <IconAlertTriangle size={11} stroke={2} />
            </span>
            <strong>{summary.counts.lowConfidence}</strong> low confidence
          </div>
        </div>
      </div>

      {/* readiness */}
      <div className={`${styles.section} ${styles.pack}`}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Pack readiness</span>
            <h2 className={styles.sectionH2}>Is this month ready for your accountant?</h2>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "6px 0 4px",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 96,
              height: 96,
              flexShrink: 0,
            }}
          >
            <svg
              viewBox="0 0 120 120"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: "rotate(-90deg)" }}
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="rgba(243, 237, 220, 0.14)"
                strokeWidth="9"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#rg)"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${(summary.readiness / 100) * 314.16} 314.16`}
              />
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F5EFDD" />
                  <stop offset="0.55" stopColor="#F0C877" />
                  <stop offset="1" stopColor="#E7B24A" />
                </linearGradient>
              </defs>
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                color: "var(--ink)",
              }}
            >
              <strong
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 30,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {summary.readiness}
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--amber-ink)",
                    marginLeft: 1,
                  }}
                >
                  %
                </span>
              </strong>
              <span
                style={{
                  color: "var(--muted)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                ready
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <span
                className={`${styles.statusPill} ${
                  summary.readiness >= 90
                    ? styles.success
                    : summary.readiness >= 60
                    ? styles.warning
                    : styles.danger
                }`}
              >
                {summary.readiness >= 90
                  ? "Almost ready"
                  : summary.readiness >= 60
                  ? "In progress"
                  : "Needs work"}
              </span>
              {summary.blockers.length > 0 && (
                <span className={styles.tag}>
                  {summary.blockers.length} blocker{summary.blockers.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {summary.blockers.length > 0 ? (
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {summary.blockers.map((b) => (
                  <li
                    key={b.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 10px",
                      border: "1px solid var(--line)",
                      borderRadius: 9,
                      background: "var(--surface-2)",
                      fontSize: 11.5,
                      color: "var(--ink-2)",
                    }}
                  >
                    <span
                      className={`${styles.statusPill} ${
                        b.label.toLowerCase().includes("missing") ||
                        b.label.toLowerCase().includes("receipt")
                          ? styles.danger
                          : b.label.toLowerCase().includes("categor")
                          ? styles.amber
                          : styles.muted
                      }`}
                    >
                      {b.label.toLowerCase().includes("missing") ||
                      b.label.toLowerCase().includes("receipt")
                        ? <IconAlertTriangle size={10} stroke={2} />
                        : b.label.toLowerCase().includes("categor")
                        ? <IconAlertTriangle size={10} stroke={2} />
                        : <IconDuplicate size={10} stroke={2} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      {b.label}
                      {b.count !== undefined && (
                        <>
                          {" "}
                          <span style={{ color: "var(--muted)" }}>
                            ({b.count})
                          </span>
                        </>
                      )}
                      {b.value !== undefined && (
                        <>
                          {" "}
                          <span style={{ color: "var(--muted)" }}>
                            {currencySymbol}{b.value.toFixed(2)}
                          </span>
                        </>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : summary.totalIn === 0 && summary.totalOut === 0 ? (
              <div
                className={styles.callout}
                style={{
                  margin: -4,
                  background: "var(--surface-2)",
                  color: "var(--ink-2)",
                  borderColor: "var(--line)",
                }}
              >
                <span className={styles.calloutIcon}>
                  <IconClipboard size={15} stroke={1.8} />
                </span>
                <p style={{ margin: 0, color: "inherit" }}>
                  Import a bank statement to see your pack readiness.
                </p>
              </div>
            ) : (
              <div
                className={styles.callout}
                style={{
                  margin: -4,
                  background: "var(--sage)",
                  color: "var(--forest)",
                  borderColor: "#c3d6c0",
                }}
              >
                <span className={styles.calloutIcon}>
                  <IconCheck size={15} stroke={2} />
                </span>
                <p style={{ margin: 0, color: "inherit" }}>
                  No blockers. This pack is ready to export.
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          className={styles.progress}
          style={{ marginTop: 6 }}
        >
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${
                summary.readiness >= 90
                  ? ""
                  : summary.readiness >= 60
                  ? styles.amber
                  : styles.red
              }`}
              style={{ width: `${summary.readiness}%` }}
            />
          </div>
          <span className={styles.progressLabel}>
            {summary.readiness}% of the month reviewed
          </span>
        </div>
      </div>

      {/* footer note */}
      <div
        className={styles.callout}
        style={{
          margin: "-12px -12px 0",
          background: "var(--surface-2)",
          color: "var(--ink-2)",
          borderColor: "var(--line)",
        }}
      >
        <span className={styles.calloutIcon}>
          <IconCash size={15} stroke={1.8} />
        </span>
        <p style={{ margin: 0, color: "inherit" }}>
          Month-over-month figures compare against the previous exported month.
        </p>
      </div>
    </div>
  );
}


