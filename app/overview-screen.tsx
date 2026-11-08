"use client";

import styles from "./home.module.css";

/**
 * OverviewScreen — the home/overview for the active month.
 *
 * Renders the zero-data empty state: a brand-new workspace shows a clean,
 * simple starting point instead of populated mock data.
 */
export function OverviewScreen({
  aiConfigured,
  onAddFiles,
}: {
  aiConfigured: boolean;
  onAddFiles: () => void;
}) {
  return (
    <>
      {/* ================= HERO (empty) ================= */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <div className={styles.heroEyebrow}>
            <i aria-hidden="true" />
            Month-end workspace
          </div>
          <h1 id="hero-title">
            Your month starts <em>here.</em>
          </h1>
          <p>
            Add a bank statement to get started. We&rsquo;ll analyze it and flag
            anything that needs a look before you export.
          </p>
          <div className={styles.heroActions}>
            <span className={styles.addFilesWrap}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={onAddFiles}
                disabled={!aiConfigured}
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
                <span
                  className={styles.tooltip}
                  id="add-files-tooltip"
                  role="tooltip"
                >
                  Configure the AI model first
                </span>
              )}
            </span>
          </div>
        </div>

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
      </section>

      {/* ================= PIPELINE (empty) ================= */}
      <section className={styles.pipeline} aria-label="Monthly progress">
        <article className={`${styles.step} ${styles.active}`}>
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
            <span className={styles.stepStatus}>Start here</span>
          </div>
          <div className={styles.stepTitle}>Bank files</div>
          <div className={styles.stepSub}>No files yet</div>
          <div className={styles.stepBar}>
            <span style={{ width: "0%" }} />
          </div>
        </article>

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
                <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7L11 6" />
                <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7L13 18" />
              </svg>
            </span>
            <span className={styles.stepStatus}>Not yet</span>
          </div>
          <div className={styles.stepTitle}>Match &amp; review</div>
          <div className={styles.stepSub}>Nothing to review</div>
          <div className={styles.stepBar}>
            <span style={{ width: "0%" }} />
          </div>
        </article>

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
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                <path d="m4.5 7.5 7.5 4 7.5-4" />
                <path d="M12 12v9" />
              </svg>
            </span>
            <span className={styles.stepStatus}>Not yet</span>
          </div>
          <div className={styles.stepTitle}>Export pack</div>
          <div className={styles.stepSub}>Unlocks when ready</div>
          <div className={styles.stepBar}>
            <span style={{ width: "0%" }} />
          </div>
        </article>
      </section>

      {/* ================= GRID ================= */}
      <div className={styles.contentGrid}>
        {/* LEFT */}
        <div className={styles.stack}>
          <section className={styles.card} id="attention">
            <div className={styles.cardHead}>
              <div>
                <span className={styles.eyebrowSm}>Needs your attention</span>
                <h2>Nothing to review yet</h2>
              </div>
            </div>
            <div className={styles.empty} style={{ padding: "28px 16px" }}>
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
                Upload a bank statement and anything that looks off will show up
                here for a quick review.
              </div>
            </div>
          </section>

          <section className={styles.card} id="transactions">
            <div className={styles.cardHead}>
              <div>
                <span className={styles.eyebrowSm}>Latest activity</span>
                <h2>Recent transactions</h2>
              </div>
            </div>
            <div className={styles.empty} style={{ padding: "28px 16px" }}>
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
                  <path d="M8 6h13" />
                  <path d="M8 12h13" />
                  <path d="M8 18h13" />
                  <path d="M3 6h.01" />
                  <path d="M3 12h.01" />
                  <path d="M3 18h.01" />
                </svg>
              </div>
              <div className={styles.emptyTitle}>No transactions yet</div>
              <div className={styles.emptyDesc}>
                Import a bank statement and your transactions will appear here.
              </div>
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
            <div className={styles.empty} style={{ padding: "20px 12px" }}>
              <div className={styles.emptyTitle}>No activity yet</div>
              <div className={styles.emptyDesc}>
                Money in, money out, and net will appear once you import
                transactions.
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <span className={styles.eyebrowSm}>Where it went</span>
                <h2>Top categories</h2>
              </div>
            </div>
            <div className={styles.empty} style={{ padding: "20px 12px" }}>
              <div className={styles.emptyTitle}>No categories yet</div>
              <div className={styles.emptyDesc}>
                Your category breakdown will appear once transactions are
                imported.
              </div>
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
                <span>Not ready yet</span>
              </div>
            </div>
            <div className={styles.empty} style={{ padding: "20px 12px" }}>
              <div className={styles.emptyTitle}>Your pack is empty</div>
              <div className={styles.emptyDesc}>
                Import a statement and complete the review to build your export
                pack.
              </div>
            </div>
            <button
              type="button"
              className={`${styles.btnPrimary} ${styles.full}`}
              disabled
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

      {/* ================= ARCHIVE (empty) ================= */}
      <section className={styles.archive} id="archive">
        <div className={styles.archiveHead}>
          <span className={styles.eyebrowSm}>Previous months</span>
        </div>
        <div
          className={`${styles.empty} ${styles.emptyBox}`}
          style={{ padding: "26px 16px" }}
        >
          <div className={styles.emptyTitle}>No previous months yet</div>
          <div className={styles.emptyDesc}>
            Completed months will be archived here.
          </div>
        </div>
      </section>
    </>
  );
}
