"use client";

import styles from "./home.module.css";
import type { ImportJobRecord, TransactionRecord } from "./db";

const FLAG_LABELS: Record<string, string> = {
  possible_personal: "Possible personal expense",
  duplicate_transaction: "Possible duplicate",
  foreign_currency: "Foreign currency",
  uncategorised: "Needs a closer look",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

const amberStyle = {
  background: "var(--amber)",
  color: "#3d2a06",
  boxShadow:
    "0 14px 24px -16px rgba(231,178,74,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
};

export function OverviewScreen({
  aiConfigured,
  bankOnly = false,
  onAddFiles,
  onReview,
  onTransactions,
  onExport,
  transactions,
  job = null,
  currency,
}: {
  aiConfigured: boolean;
  /** When true, the Receipts step is hidden (bank-only workspace). */
  bankOnly?: boolean;
  onAddFiles: () => void;
  onReview: () => void;
  onTransactions: () => void;
  onExport: () => void;
  transactions: TransactionRecord[];
  job?: ImportJobRecord | null;
  currency: "GBP" | "EUR";
}) {
  const hasData = transactions.length > 0;
  const isProcessing = job?.status === "processing";
  const transactionCount = transactions.length;
  const flagged = transactions.filter((t) => t.flag);
  const flaggedCount = flagged.length;

  const totalIn = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const net = totalIn - totalOut;

  const readiness =
    transactionCount > 0
      ? Math.round(((transactionCount - flaggedCount) / transactionCount) * 100)
      : 0;

  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);

  const currencySymbol = currency === "GBP" ? "£" : "€";

  const jobProgress =
    job && job.status === "done"
      ? 100
      : job && job.chunkTotal > 0
        ? Math.round((job.chunkDone / job.chunkTotal) * 100)
        : job
          ? 8
          : 0;

  const ringPct = isProcessing ? jobProgress : readiness;

  const bankStatus = job
    ? job.status === "done"
      ? "Complete"
      : job.status === "failed"
        ? "Failed"
        : "Processing"
    : "Start here";

  const bankSub = job
    ? job.status === "done"
      ? `${job.totalTransactions} transactions · ${job.totalFlagged} flagged${
          job.failedBatches
            ? ` · ${job.failedBatches} batch${job.failedBatches === 1 ? "" : "es"} failed`
            : ""
        }`
      : job.message
    : "No files yet";

  const bankStepClass = job
    ? job.status === "done"
      ? styles.done
      : job.status === "failed"
        ? styles.locked
        : styles.active
    : styles.active;

  const reviewPct =
    transactionCount > 0
      ? Math.round(((transactionCount - flaggedCount) / transactionCount) * 100)
      : 0;

  const matchStatus = !hasData
    ? "Not yet"
    : flaggedCount > 0
      ? "To review"
      : "All clear";
  const matchSub = !hasData
    ? "Nothing to review"
    : flaggedCount > 0
      ? `${flaggedCount} flagged`
      : `${transactionCount} transactions`;
  const matchClass = !hasData
    ? styles.locked
    : flaggedCount > 0
      ? styles.active
      : styles.done;
  const matchBar = !hasData ? 0 : flaggedCount > 0 ? reviewPct : 100;

  const exportStatus = !hasData
    ? "Not yet"
    : flaggedCount > 0
      ? "Locked"
      : "Ready";
  const exportSub = !hasData
    ? "Unlocks when ready"
    : flaggedCount > 0
      ? `${flaggedCount} to review`
      : "All clear";
  const exportClass =
    hasData && flaggedCount === 0 ? styles.done : styles.locked;
  const exportBar = hasData && flaggedCount === 0 ? 100 : 0;

  let heroTitle: React.ReactNode;
  let heroText: string;
  if (isProcessing) {
    heroTitle = (
      <>
        Analyzing your <em>statement…</em>
      </>
    );
    heroText = job?.message ?? "Working through your transactions…";
  } else if (hasData && flaggedCount > 0) {
    heroTitle = (
      <>
        Almost <em>accountant-ready.</em>
      </>
    );
    heroText = `${transactionCount} transactions in. ${flaggedCount} item${
      flaggedCount === 1 ? " needs" : "s need"
    } a quick look before you export.`;
  } else if (hasData) {
    heroTitle = (
      <>
        You&rsquo;re <em>all set.</em>
      </>
    );
    heroText = `${transactionCount} transactions in and nothing needs review. Ready to export.`;
  } else {
    heroTitle = (
      <>
        Your month starts <em>here.</em>
      </>
    );
    heroText =
      "Add a bank statement to get started. We'll analyze it and flag anything that needs a look before you export.";
  }

  const addFilesButton = (
    <span className={styles.addFilesWrap}>
      <button
        type="button"
        className={styles.btnSecondary}
        onClick={onAddFiles}
        disabled={!aiConfigured || isProcessing}
        aria-describedby={!aiConfigured ? "add-files-tooltip" : undefined}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        Add files
      </button>
      {!aiConfigured && (
        <span className={styles.tooltip} id="add-files-tooltip" role="tooltip">
          Configure the AI model first
        </span>
      )}
    </span>
  );

  return (
    <>
      {/* ================= HERO ================= */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <div className={styles.heroEyebrow}>
            <i aria-hidden="true" />
            Month-end workspace
          </div>
          <h1 id="hero-title">{heroTitle}</h1>
          <p>{heroText}</p>
          <div className={styles.heroActions}>
            {isProcessing ? (
              <button type="button" className={styles.btnSecondary} disabled>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-6.2-8.5" />
                </svg>
                Processing…
              </button>
            ) : hasData && flaggedCount > 0 ? (
              <>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={amberStyle}
                  onClick={onReview}
                >
                  Review {flaggedCount} item{flaggedCount === 1 ? "" : "s"}
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
                {addFilesButton}
              </>
            ) : hasData ? (
              <>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={amberStyle}
                  onClick={onTransactions}
                >
                  View transactions
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
                {addFilesButton}
              </>
            ) : (
              addFilesButton
            )}
          </div>
        </div>

        {isProcessing || hasData ? (
          <div
            className={styles.heroRing}
            role="img"
            aria-label={`${ringPct}% ${isProcessing ? "analyzed" : "pack readiness"}`}
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
                style={{ strokeDasharray: `${(ringPct / 100) * 351.9} 351.9` }}
              />
            </svg>
            <div className={styles.ringLabel}>
              <strong>
                {ringPct}
                <span>%</span>
              </strong>
              <span>{isProcessing ? "analyzed" : "pack readiness"}</span>
            </div>
          </div>
        ) : (
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
            <span className={styles.heroEmptyLabel}>No files yet</span>
          </div>
        )}
      </section>

      {/* ================= PIPELINE ================= */}
      <section className={styles.pipeline} aria-label="Monthly progress">
        <article className={`${styles.step} ${bankStepClass}`}>
          <div className={styles.stepTop}>
            <span className={styles.stepIco}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 10 12 4l9 6" />
                <path d="M5 10v9" />
                <path d="M9 10v9" />
                <path d="M15 10v9" />
                <path d="M19 10v9" />
                <path d="M3 21h18" />
              </svg>
            </span>
            <span className={styles.stepStatus}>{bankStatus}</span>
          </div>
          <div className={styles.stepTitle}>Bank files</div>
          <div className={styles.stepSub}>{bankSub}</div>
          <div className={styles.stepBar}>
            <span style={{ width: `${jobProgress}%` }} />
          </div>
        </article>

        {!bankOnly && (
          <article className={`${styles.step} ${styles.locked}`}>
            <div className={styles.stepTop}>
              <span className={styles.stepIco}>
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
              </span>
              <span className={styles.stepStatus}>Not yet</span>
            </div>
            <div className={styles.stepTitle}>Receipts</div>
            <div className={styles.stepSub}>No receipts yet</div>
            <div className={styles.stepBar}>
              <span style={{ width: "0%" }} />
            </div>
          </article>
        )}

        <article className={`${styles.step} ${matchClass}`}>
          <div className={styles.stepTop}>
            <span className={styles.stepIco}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7L11 6" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7L13 18" />
              </svg>
            </span>
            <span className={styles.stepStatus}>{matchStatus}</span>
          </div>
          <div className={styles.stepTitle}>Match &amp; review</div>
          <div className={styles.stepSub}>{matchSub}</div>
          <div className={styles.stepBar}>
            <span style={{ width: `${matchBar}%` }} />
          </div>
        </article>

        <article className={`${styles.step} ${exportClass}`}>
          <div className={styles.stepTop}>
            <span className={styles.stepIco}>
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
            <span className={styles.stepStatus}>{exportStatus}</span>
          </div>
          <div className={styles.stepTitle}>Export pack</div>
          <div className={styles.stepSub}>{exportSub}</div>
          <div className={styles.stepBar}>
            <span style={{ width: `${exportBar}%` }} />
          </div>
        </article>
      </section>

      {/* ================= GRID (data) ================= */}
      {hasData && (
        <div className={styles.contentGrid}>
          {/* LEFT */}
          <div className={styles.stack}>
            <section className={styles.card} id="attention">
              <div className={styles.cardHead}>
                <div>
                  <span className={styles.eyebrowSm}>Needs your attention</span>
                  <h2>
                    {flaggedCount > 0
                      ? `${flaggedCount} item${flaggedCount === 1 ? "" : "s"} to review`
                      : "Nothing to review"}
                  </h2>
                </div>
                {flaggedCount > 0 && (
                  <span className={styles.countPill}>{flaggedCount}</span>
                )}
              </div>

              {flaggedCount > 0 ? (
                <>
                  {flagged.slice(0, 3).map((t) => (
                    <div key={t.id} className={styles.exception}>
                      <span className={`${styles.exIcon} ${styles.amber}`}>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                      </span>
                      <div className={styles.exBody}>
                        <strong>{FLAG_LABELS[t.flag!.type] ?? "Needs review"}</strong>
                        <span>
                          {t.description} · {formatDate(t.date)} ·{" "}
                          {currencySymbol}
                          {Math.abs(t.amount).toFixed(2)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.miniBtn}
                        onClick={onReview}
                      >
                        Review
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.cardLink}
                    style={{ marginTop: 12 }}
                    onClick={onReview}
                  >
                    View all {flaggedCount} item
                    {flaggedCount === 1 ? "" : "s"}
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
                </>
              ) : (
                <div className={styles.empty} style={{ padding: "24px 12px" }}>
                  <div className={styles.emptyIcon}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div className={styles.emptyTitle}>You&rsquo;re all clear</div>
                  <div className={styles.emptyDesc}>
                    Nothing needs review in this month.
                  </div>
                </div>
              )}
            </section>

            <section className={styles.card} id="transactions">
              <div className={styles.cardHead}>
                <div>
                  <span className={styles.eyebrowSm}>Latest activity</span>
                  <h2>Recent transactions</h2>
                </div>
                <button
                  type="button"
                  className={styles.cardLink}
                  onClick={onTransactions}
                >
                  Open ledger
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

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.colDate}>Date</th>
                      <th>Description</th>
                      <th className={styles.colAmount}>Amount</th>
                      <th className={styles.colStatus}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((t) => (
                      <tr key={t.id}>
                        <td className={styles.dateCell}>{formatDate(t.date)}</td>
                        <td>
                          <span className={styles.vendor}>{t.description}</span>
                        </td>
                        <td
                          className={`${styles.num} ${t.amount >= 0 ? styles.inAmount : ""}`}
                        >
                          {t.amount >= 0 ? "+" : "−"}
                          {currencySymbol}
                          {Math.abs(t.amount).toFixed(2)}
                        </td>
                        <td>
                          <span
                            className={`${styles.status} ${t.flag ? styles.review : styles.matched}`}
                          >
                            {t.flag ? "Needs review" : "Matched"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className={styles.stack}>
            <section className={`${styles.card} ${styles.money}`} id="summary">
              <div className={styles.cardHead}>
                <div>
                  <span className={styles.eyebrowSm}>This month</span>
                  <h2>This month so far</h2>
                </div>
              </div>
              <div className={styles.moneyRow}>
                <span className={styles.label}>Money in</span>
                <span className={styles.value}>
                  <strong>
                    {currencySymbol}
                    {totalIn.toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </span>
              </div>
              <div className={styles.moneyRow}>
                <span className={styles.label}>Money out</span>
                <span className={styles.value}>
                  <strong>
                    {currencySymbol}
                    {totalOut.toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </span>
              </div>
              <div className={`${styles.moneyRow} ${styles.net}`}>
                <span className={styles.label}>Net</span>
                <span className={styles.value}>
                  <strong>
                    {net < 0 ? "−" : ""}
                    {currencySymbol}
                    {Math.abs(net).toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </span>
              </div>
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
                    {flaggedCount > 0
                      ? `${flaggedCount} to review`
                      : "Ready to export"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={`${styles.btnPrimary} ${styles.full}`}
                disabled={flaggedCount > 0}
                onClick={onExport}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ width: 15, height: 15 }}
                >
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
                Export pack
              </button>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
