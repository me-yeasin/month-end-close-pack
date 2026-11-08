"use client";

import {
  IconReceipt,
  IconDuplicate,
  IconAlertTriangle,
  IconCheck,
  IconClipboard,
  IconLinkOff,
  IconArrowRight,
  IconDownload,
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

export function MonthSummaryScreen({
  summary,
  onReview,
  onExport,
}: {
  summary: Summary;
  /** Open the review screen from the blockers card / hero. */
  onReview?: () => void;
  /** Open the export screen from the pack card / hero. */
  onExport?: () => void;
}) {
  const symbol = summary.currency === "GBP" ? "£" : "€";

  const money = (v: number) =>
    v.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const counts = summary.counts;
  const attentionTotal =
    counts.missingReceipts +
    counts.unmatchedReceipts +
    counts.duplicates +
    counts.uncategorised +
    counts.lowConfidence;

  const isEmpty =
    summary.totalIn === 0 && summary.totalOut === 0 && summary.categories.length === 0;
  const blocked = summary.blockers.length > 0;
  const hasVatData = summary.vat.included !== 0 || summary.vat.excluded !== 0;

  const largest = summary.categories.length
    ? Math.max(...summary.categories.map((c) => c.amount))
    : 1;

  // hero copy — mirrors the overview tone
  let heroTitle: React.ReactNode;
  let heroText: string;
  if (isEmpty) {
    heroTitle = (
      <>
        Nothing to <em>summarize yet.</em>
      </>
    );
    heroText =
      "Import a bank statement and this summary builds itself — totals, categories, VAT and pack readiness.";
  } else if (blocked) {
    heroTitle = (
      <>
        Almost <em>accountant-ready.</em>
      </>
    );
    heroText = `${symbol}${money(summary.totalIn)} in, ${symbol}${money(
      summary.totalOut,
    )} out. ${summary.blockers.length} blocker${
      summary.blockers.length === 1 ? "" : "s"
    } stand between you and the export.`;
  } else {
    heroTitle = (
      <>
        Ready for <em>your accountant.</em>
      </>
    );
    heroText = `${symbol}${money(summary.totalIn)} in, ${symbol}${money(
      summary.totalOut,
    )} out, net ${symbol}${money(Math.abs(summary.net))}. No blockers — export whenever you like.`;
  }

  const COUNT_CARDS = [
    { key: "missingReceipts", label: "Missing receipts", icon: <IconReceipt size={15} stroke={1.8} />, tint: styles.sumIconRed },
    { key: "unmatchedReceipts", label: "Unmatched receipts", icon: <IconLinkOff size={15} stroke={1.8} />, tint: styles.sumIconAmber },
    { key: "duplicates", label: "Duplicates", icon: <IconDuplicate size={15} stroke={1.8} />, tint: styles.sumIconMuted },
    { key: "uncategorised", label: "Uncategorised", icon: <IconClipboard size={15} stroke={1.8} />, tint: styles.sumIconAmber },
    { key: "lowConfidence", label: "Low confidence", icon: <IconAlertTriangle size={15} stroke={1.8} />, tint: styles.sumIconBlue },
  ] as const;

  return (
    <div className={styles.screen}>
      {/* ------------------------------ header ------------------------------ */}
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Summary</span>
          <h2 className={styles.sectionH2}>{summary.monthLabel}</h2>
        </div>
        <div className={styles.sectionActions}>
          <span className={styles.tag}>{summary.currency}</span>
          {attentionTotal > 0 && (
            <span className={styles.tag}>
              {attentionTotal} to resolve
            </span>
          )}
        </div>
      </div>

      {/* ------------------------------ hero ------------------------------ */}
      <section className={styles.hero} aria-labelledby="summary-title">
        <div className={styles.heroCopy}>
          <div className={styles.heroEyebrow}>
            <i aria-hidden="true" />
            Month summary
          </div>
          <h1 id="summary-title">{heroTitle}</h1>
          <p>{heroText}</p>
          <div className={styles.heroActions}>
            {isEmpty ? null : blocked ? (
              <>
                <button
                  type="button"
                  className={`${styles.btnPrimary} ${styles.btnAmber}`}
                  onClick={onReview}
                >
                  Review blockers
                  <IconArrowRight size={15} stroke={2} />
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={onExport}
                  disabled
                  title="Resolve blockers to unlock the export"
                >
                  <IconDownload size={15} stroke={1.8} />
                  Export locked
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.btnAmber}`}
                onClick={onExport}
              >
                <IconDownload size={15} stroke={2} />
                Export pack
              </button>
            )}
          </div>
        </div>

        {isEmpty ? (
          <div className={styles.heroEmpty} aria-hidden="true">
            <span className={styles.heroEmptyRing}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
                <path d="M12 18v-6" />
                <path d="m9 15 3-3 3 3" />
              </svg>
            </span>
            <span className={styles.heroEmptyLabel}>No data yet</span>
          </div>
        ) : (
          <div
            className={styles.heroRing}
            role="img"
            aria-label={`${summary.readiness}% pack readiness`}
          >
            <svg className={styles.ring} viewBox="0 0 140 140" aria-hidden="true">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F5EFDD" />
                  <stop offset="0.55" stopColor="#F0C877" />
                  <stop offset="1" stopColor="#E7B24A" />
                </linearGradient>
              </defs>
              <circle className={styles.ringTrack} cx="70" cy="70" r="56" />
              <circle
                className={styles.ringValue}
                cx="70"
                cy="70"
                r="56"
                style={{
                  strokeDasharray: `${(summary.readiness / 100) * 351.9} 351.9`,
                }}
              />
            </svg>
            <div className={styles.ringLabel}>
              <strong>
                {summary.readiness}
                <span>%</span>
              </strong>
              <span>pack readiness</span>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------ totals strip ------------------------------ */}
      <section className={styles.sumTotals} aria-label="Month totals">
        <div className={styles.sumTotal}>
          <span className={styles.sumTotalLabel}>Money in</span>
          <strong className={`${styles.sumTotalValue} ${styles.sumTotalIn}`}>
            {symbol}
            {money(summary.totalIn)}
          </strong>
        </div>
        <div className={styles.sumTotal}>
          <span className={styles.sumTotalLabel}>Money out</span>
          <strong className={styles.sumTotalValue}>
            {symbol}
            {money(summary.totalOut)}
          </strong>
        </div>
        <div className={styles.sumTotal}>
          <span className={styles.sumTotalLabel}>Net</span>
          <strong className={`${styles.sumTotalValue} ${styles.sumTotalNet}`}>
            {summary.net < 0 ? "−" : ""}
            {symbol}
            {money(Math.abs(summary.net))}
          </strong>
        </div>
      </section>

      {/* ------------------------------ attention counts ------------------------------ */}
      {!isEmpty && attentionTotal > 0 && (
        <section className={styles.sumCounts} aria-label="Items needing attention">
          {COUNT_CARDS.map((c) => (
            <div key={c.key} className={styles.sumCount}>
              <span className={`${styles.sumCountIcon} ${c.tint}`}>{c.icon}</span>
              <span className={styles.sumCountText}>
                <strong className={styles.sumCountNum}>{counts[c.key]}</strong>
                <span className={styles.sumCountLabel}>{c.label}</span>
              </span>
            </div>
          ))}
        </section>
      )}

      {/* ------------------------------ detail grid ------------------------------ */}
      <div className={styles.contentGrid}>
        {/* LEFT — categories + VAT */}
        <div className={styles.stack}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <span className={styles.eyebrowSm}>Where it went</span>
                <h2>By category</h2>
              </div>
            </div>

            {summary.categories.length === 0 ? (
              <div className={styles.empty} style={{ padding: "24px 12px" }}>
                <div className={styles.emptyTitle}>No categories yet</div>
                <div className={styles.emptyDesc}>
                  Assign categories to transactions and they will appear here.
                </div>
              </div>
            ) : (
              summary.categories.map((c) => (
                <div key={c.name} className={styles.catRow}>
                  <div className={styles.catTop}>
                    <span>{c.name}</span>
                    <strong>
                      {symbol}
                      {c.amount.toLocaleString("en-GB", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </strong>
                  </div>
                  <div className={styles.bar}>
                    <span
                      style={{
                        width: `${Math.min(100, (c.amount / largest) * 100)}%`,
                        background: c.color
                          ? `linear-gradient(90deg, ${c.color}, ${c.color}dd)`
                          : "linear-gradient(90deg, var(--forest-3), #4c8b6a)",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <span className={styles.eyebrowSm}>VAT summary</span>
                <h2>Simple view, not a return</h2>
              </div>
            </div>

            {hasVatData ? (
              <>
                <div className={styles.moneyRow}>
                  <span className={styles.label}>VAT included in amounts</span>
                  <span className={styles.value}>
                    <strong>
                      {symbol}
                      {money(summary.vat.included)}
                    </strong>
                  </span>
                </div>
                <div className={styles.moneyRow}>
                  <span className={styles.label}>VAT excluded from amounts</span>
                  <span className={styles.value}>
                    <strong>
                      {symbol}
                      {money(summary.vat.excluded)}
                    </strong>
                  </span>
                </div>
                <div className={styles.moneyRow}>
                  <span className={styles.label}>Implied VAT rate</span>
                  <span className={styles.value}>
                    <strong>{summary.vat.rate.toFixed(1)}%</strong>
                  </span>
                </div>
                <div className={`${styles.moneyRow} ${styles.net}`}>
                  <span className={styles.label}>Total net (approx.)</span>
                  <span className={styles.value}>
                    <strong>
                      {symbol}
                      {money(summary.vat.net)}
                    </strong>
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.empty} style={{ padding: "24px 12px" }}>
                <div className={styles.emptyTitle}>No VAT data yet</div>
                <div className={styles.emptyDesc}>
                  Set a VAT treatment on your transactions and the summary
                  will appear here.
                </div>
              </div>
            )}

            <p className={styles.sumNote}>
              A simple summary to help you and your accountant — not a formal
              VAT calculation.
            </p>
          </section>
        </div>

        {/* RIGHT — blockers + pack */}
        <div className={styles.stack}>
          <section className={styles.card} id="blockers">
            <div className={styles.cardHead}>
              <div>
                <span className={styles.eyebrowSm}>Before you export</span>
                <h2>Blockers</h2>
              </div>
              {!isEmpty && blocked && onReview && (
                <button
                  type="button"
                  className={styles.cardLink}
                  onClick={onReview}
                >
                  Review
                  <IconArrowRight size={12} stroke={2} />
                </button>
              )}
            </div>

            {isEmpty ? (
              <div className={styles.empty} style={{ padding: "24px 12px" }}>
                <div className={styles.emptyTitle}>Nothing to check yet</div>
                <div className={styles.emptyDesc}>
                  Import a bank statement to see what blocks the pack.
                </div>
              </div>
            ) : blocked ? (
              summary.blockers.map((b) => (
                <div key={b.label} className={styles.exception}>
                  <span
                    className={`${styles.exIcon} ${
                      b.label.toLowerCase().includes("receipt") ||
                      b.label.toLowerCase().includes("missing")
                        ? styles.sumIconRed
                        : styles.sumIconAmber
                    }`}
                  >
                    {b.label.toLowerCase().includes("categor") ? (
                      <IconClipboard size={15} stroke={1.8} />
                    ) : b.label.toLowerCase().includes("duplicate") ? (
                      <IconDuplicate size={15} stroke={1.8} />
                    ) : (
                      <IconAlertTriangle size={15} stroke={1.8} />
                    )}
                  </span>
                  <div className={styles.exBody}>
                    <strong>{b.label}</strong>
                    <span>
                      {b.count} item{b.count !== 1 ? "s" : ""}
                      {b.value !== undefined &&
                        ` · ${symbol}${money(b.value)}`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty} style={{ padding: "24px 12px" }}>
                <div className={styles.emptyIcon}>
                  <IconCheck size={22} stroke={1.8} />
                </div>
                <div className={styles.emptyTitle}>No blockers</div>
                <div className={styles.emptyDesc}>
                  Everything is reviewed. This month is ready to go.
                </div>
              </div>
            )}
          </section>

          <section className={`${styles.card} ${styles.pack}`} id="pack">
            <div className={styles.packHead}>
              <span className={styles.packIcon}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                  <path d="m4.5 7.5 7.5 4 7.5-4" />
                  <path d="M12 12v9" />
                </svg>
              </span>
              <div>
                <strong>Accountant pack</strong>
                <span>
                  {isEmpty
                    ? "Nothing to export yet"
                    : blocked
                      ? `${attentionTotal} to resolve`
                      : "Ready to export"}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={`${styles.btnPrimary} ${styles.full}`}
              disabled={isEmpty || blocked}
              onClick={onExport}
            >
              <IconDownload size={15} stroke={2} />
              Export pack
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
