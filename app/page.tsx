"use client";

import { useEffect, useState } from "react";
import styles from "./home.module.css";
import { MobileMenuButton } from "./mobile-menu-button";
import { Sidebar } from "./sidebar";
import { TransactionsScreen } from "./transactions-screen";
import { ReceiptImportScreen } from "./receipts-screen";
import { ReceiptReviewScreen } from "./receipt-review-screen";
import { ExceptionsScreen } from "./exceptions-screen";
import { MonthSummaryScreen } from "./summary-screen";
import { ExportPackScreen } from "./export-screen";
import { useUiStore } from "./ui-store";
import { OnboardingScreen } from "./onboarding";
import {
  loadAllWorkspaces,
  loadActiveWorkspaceId,
  createWorkspace as dbCreateWorkspace,
} from "./workspace-store";

const VIEW_LABELS: Record<string, string> = {
  overview: "Overview",
  transactions: "Transactions",
  receipts: "Receipts",
  review: "Review",
  summary: "Summary",
  export: "Export",
};

export default function Home() {
  const view = useUiStore((state) => state.view);
  const setView = useUiStore((state) => state.setView);
  const workspace = useUiStore((state) => state.workspace);
  const hydrateWorkspaces = useUiStore((state) => state.hydrateWorkspaces);
  const addWorkspace = useUiStore((state) => state.addWorkspace);

  // true while we are reading IndexedDB on first mount
  const [loading, setLoading] = useState(true);

  const goBack = () => setView("overview");

  // On mount: read IndexedDB and hydrate the Zustand store.
  // useEffect never runs on the server — IndexedDB is browser-only.
  useEffect(() => {
    Promise.all([loadAllWorkspaces(), loadActiveWorkspaceId()])
      .then(([workspaces, activeId]) => hydrateWorkspaces(workspaces, activeId))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Avoid flashing onboarding on page load while we check IndexedDB
  if (loading) return null;

  // Show onboarding if no workspace exists yet
  if (!workspace) {
    return (
      <OnboardingScreen
        onComplete={async (setup) => {
          const record = await dbCreateWorkspace(setup);
          addWorkspace(record);
        }}
      />
    );
  }

  return (
    <div className={styles.shell}>
      <Sidebar />

      {/* ================= MAIN ================= */}
      <main className={styles.main} id="top">
        <div className={styles.mainInner}>
          <header className={styles.topbar}>
            <div className={styles.crumbs}>
              <MobileMenuButton />
              <span className={styles.crumbSection}>November 2026</span>
              {view !== "overview" && (
                <>
                  <svg
                    className={styles.crumbChevron}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  <strong>{VIEW_LABELS[view]}</strong>
                </>
              )}
            </div>
            <div className={styles.topActions}>
              <span className={styles.localPill}>
                <span className={styles.pulse} />
                On this device
              </span>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Search"
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
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.2-3.2" />
                </svg>
              </button>
              <button type="button" className={styles.monthBtn}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4" />
                  <path d="M8 2v4" />
                  <path d="M3 10h18" />
                </svg>
                Nov 2026
                <svg
                  className={styles.chev}
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
              <div className={styles.avatar} title="Account">
                AM
              </div>
            </div>
          </header>

          {/* sub-view index bar for non-overview views */}
          {view !== "overview" && (
            <div
              className={styles.topbar}
              style={{ marginBottom: 18, height: "auto", paddingBottom: 14, borderBottom: "1px solid var(--line)" }}
            >
              <div className={styles.crumbs}>
                <strong>November 2026</strong>
                <svg
                  className={styles.crumbChevron}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                <span style={{ textTransform: "uppercase", color: "var(--muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em" }}>
                  {view === "transactions" && "Ledger"}
                  {view === "receipts" && "Receipts"}
                  {view === "review" && "Review"}
                  {view === "summary" && "Summary"}
                  {view === "export" && "Export"}
                </span>
              </div>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={goBack}
                aria-label="Back to overview"
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
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            </div>
          )}

          {/* ================= VIEW CONTENT ================= */}
          {view === "overview" && (
            <>
              {/* HERO */}
              <section className={styles.hero} aria-labelledby="hero-title">
                <div className={styles.heroCopy}>
                  <div className={styles.heroEyebrow}>
                    <i aria-hidden="true" />
                    Month-end workspace · GBP
                  </div>
                  <h1 id="hero-title">
                    Almost <em>accountant-ready.</em>
                  </h1>
                  <p>
                    142 transactions and 34 receipts are in. Three items need a
                    quick look before you export November.
                  </p>
                  <div className={styles.heroMobileReady}>
                    <strong>68%</strong> pack readiness
                  </div>
                  <div className={styles.heroActions}>
                    <button
                      type="button"
                      className={`${styles.btnPrimary}`}
                      style={{ background: "var(--amber)", color: "#3d2a06", boxShadow: "0 14px 24px -16px rgba(231,178,74,0.7), inset 0 1px 0 rgba(255,255,255,0.18)" }}
                      onClick={() => setView("review")}
                    >
                      Review 3 items
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
                    <button
                      type="button"
                      className={`${styles.btnSecondary}`}
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
                  </div>
                  <div className={styles.heroMeta}>
                    <span>
                      <strong>2</strong> bank files
                    </span>
                    <i aria-hidden="true" />
                    <span>
                      <strong>142</strong> transactions
                    </span>
                    <i aria-hidden="true" />
                    <span>
                      <strong>34</strong> receipts
                    </span>
                    <i aria-hidden="true" />
                    <span>
                      <strong>6</strong> exceptions
                    </span>
                  </div>
                </div>

                <div
                  className={styles.heroRing}
                  role="img"
                  aria-label="Pack readiness: 68 percent"
                >
                  <svg
                    className={styles.ring}
                    viewBox="0 0 140 140"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#F5EFDD" />
                        <stop offset="0.55" stopColor="#F0C877" />
                        <stop offset="1" stopColor="#E7B24A" />
                      </linearGradient>
                    </defs>
                    <circle
                      className={styles.ringTrack}
                      cx="70"
                      cy="70"
                      r="56"
                    />
                    <circle
                      className={styles.ringValue}
                      cx="70"
                      cy="70"
                      r="56"
                    />
                  </svg>
                  <div className={styles.ringLabel}>
                    <strong>68<span>%</span></strong>
                    <span>pack readiness</span>
                  </div>
                </div>
              </section>

              {/* PIPELINE */}
              <section
                className={styles.pipeline}
                aria-label="Monthly progress"
              >
                <article className={`${styles.step} ${styles.done}`}>
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
                    <span className={styles.stepStatus}>Complete</span>
                  </div>
                  <div className={styles.stepTitle}>Bank files</div>
                  <div className={styles.stepSub}>
                    2 files · 142 transactions
                  </div>
                  <div className={styles.stepBar}>
                    <span style={{ width: "100%" }} />
                  </div>
                </article>

                <article className={`${styles.step} ${styles.done}`}>
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
                    <span className={styles.stepStatus}>Complete</span>
                  </div>
                  <div className={styles.stepTitle}>Receipts</div>
                  <div className={styles.stepSub}>
                    34 files · 2 duplicates skipped
                  </div>
                  <div className={styles.stepBar}>
                    <span style={{ width: "100%" }} />
                  </div>
                </article>

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
                        <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7L11 6" />
                        <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7L13 18" />
                      </svg>
                    </span>
                    <span className={styles.stepStatus}>In progress</span>
                  </div>
                  <div className={styles.stepTitle}>Match &amp; review</div>
                  <div className={styles.stepSub}>
                    3 of 142 items need a look
                  </div>
                  <div className={styles.stepBar}>
                    <span style={{ width: "88%" }} />
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
                  <div className={styles.stepSub}>
                    Unlocks at 100% ready
                  </div>
                  <div className={styles.stepBar}>
                    <span style={{ width: "0%" }} />
                  </div>
                </article>
              </section>

              {/* GRID */}
              <div className={styles.contentGrid}>
                {/* LEFT */}
                <div className={styles.stack}>
                  <section className={styles.card} id="attention">
                    <div className={styles.cardHead}>
                      <div>
                        <span className={styles.eyebrowSm}>
                          Needs your attention
                        </span>
                        <h2>Three quick fixes</h2>
                      </div>
                      <span className={styles.countPill}>3 of 6</span>
                    </div>

                    <div className={styles.exception}>
                      <span
                        className={`${styles.exIcon} ${styles.red}`}
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
                          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                          <path d="M9 8h6" />
                          <path d="M9 12h3" />
                        </svg>
                      </span>
                      <div className={styles.exBody}>
                        <strong>Missing receipt</strong>
                        <span>
                          Tesco Stores · 12 Nov · £42.10
                        </span>
                      </div>
                      <span className={styles.chip}>Groceries</span>
                      <button
                        type="button"
                        className={styles.miniBtn}
                        onClick={() => setView("receipts")}
                      >
                        Add receipt
                      </button>
                    </div>

                    <div className={styles.exception}>
                      <span
                        className={`${styles.exIcon} ${styles.amber}`}
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
                          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                      </span>
                      <div className={styles.exBody}>
                        <strong>Amount mismatch</strong>
                        <span>
                          Adobe Creative Cloud · 03 Nov · £19.99 vs £21.99
                        </span>
                      </div>
                      <span className={styles.chip}>Software</span>
                      <button
                        type="button"
                        className={styles.miniBtn}
                        onClick={() => setView("review")}
                      >
                        Resolve
                      </button>
                    </div>

                    <div className={styles.exception}>
                      <span
                        className={`${styles.exIcon} ${styles.blue}`}
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
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 21a8 8 0 0 1 16 0" />
                        </svg>
                      </span>
                      <div className={styles.exBody}>
                        <strong>Possible personal expense</strong>
                        <span>
                          Uber Trip · 18 Nov · £14.20
                        </span>
                      </div>
                      <span className={styles.chip}>Travel</span>
                      <button
                        type="button"
                        className={styles.miniBtn}
                        onClick={() => setView("review")}
                      >
                        Review
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.cardLink}
                      style={{ marginTop: 12 }}
                      onClick={() => setView("review")}
                    >
                      View all 6 exceptions
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
                  </section>

                  <section className={styles.card} id="transactions">
                    <div className={styles.cardHead}>
                      <div>
                        <span className={styles.eyebrowSm}>
                          Latest activity
                        </span>
                        <h2>Recent transactions</h2>
                      </div>
                      <button
                        type="button"
                        className={styles.cardLink}
                        onClick={() => setView("transactions")}
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
                        <caption className="sr-only">
                          Recent transactions
                        </caption>
                        <thead>
                          <tr>
                            <th className={styles.colDate}>Date</th>
                            <th>Description</th>
                            <th className={styles.colAmount}>Amount</th>
                            <th className={styles.colStatus}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className={styles.dateCell}>28 Nov</td>
                            <td>
                              <span className={styles.vendor}>
                                Stripe payout
                              </span>
                              <span className={styles.subLine}>
                                Sales and income
                              </span>
                            </td>
                            <td className={`${styles.num} ${styles.inAmount}`}>
                              +£2,410.00
                            </td>
                            <td>
                              <span
                                className={`${styles.status} ${styles.matched}`}
                              >
                                Matched
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.dateCell}>27 Nov</td>
                            <td>
                              <span className={styles.vendor}>Figma</span>
                              <span className={styles.subLine}>
                                Software and subscriptions
                              </span>
                            </td>
                            <td className={styles.num}>−£12.00</td>
                            <td>
                              <span
                                className={`${styles.status} ${styles.matched}`}
                              >
                                Matched
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.dateCell}>26 Nov</td>
                            <td>
                              <span className={styles.vendor}>
                                Tesco Stores
                              </span>
                              <span className={styles.subLine}>
                                Groceries
                              </span>
                            </td>
                            <td className={styles.num}>−£42.10</td>
                            <td>
                              <span
                                className={`${styles.status} ${styles.missing}`}
                              >
                                Missing receipt
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.dateCell}>25 Nov</td>
                            <td>
                              <span className={styles.vendor}>Uber Trip</span>
                              <span className={styles.subLine}>Travel</span>
                            </td>
                            <td className={styles.num}>−£14.20</td>
                            <td>
                              <span
                                className={`${styles.status} ${styles.review}`}
                              >
                                Needs review
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                {/* RIGHT */}
                <div className={styles.stack}>
                  <section
                    className={`${styles.card} ${styles.money}`}
                    id="summary"
                  >
                    <div className={styles.cardHead}>
                      <div>
                        <span className={styles.eyebrowSm}>This month</span>
                        <h2>November so far</h2>
                      </div>
                    </div>
                    <div className={styles.moneyRow}>
                      <span className={styles.label}>Money in</span>
                      <span className={styles.value}>
                        <strong>£12,480.00</strong>
                        <small className={styles.up}>+8.2%</small>
                      </span>
                    </div>
                    <div className={styles.moneyRow}>
                      <span className={styles.label}>Money out</span>
                      <span className={styles.value}>
                        <strong>£8,214.36</strong>
                        <small>−3.1%</small>
                      </span>
                    </div>
                    <div className={`${styles.moneyRow} ${styles.net}`}>
                      <span className={styles.label}>Net</span>
                      <span className={styles.value}>
                        <strong>£4,265.64</strong>
                        <small>vs Oct</small>
                      </span>
                    </div>
                  </section>

                  <section className={styles.card}>
                    <div className={styles.cardHead}>
                      <div>
                        <span className={styles.eyebrowSm}>
                          Where it went
                        </span>
                        <h2>Top categories</h2>
                      </div>
                      <button
                        type="button"
                        className={styles.cardLink}
                        onClick={() => setView("summary")}
                      >
                        All
                      </button>
                    </div>

                    <div className={styles.catRow}>
                      <div className={styles.catTop}>
                        <span>Software &amp; subscriptions</span>
                        <strong>£1,240</strong>
                      </div>
                      <div className={styles.bar}>
                        <span
                          style={{
                            width: "82%",
                            background:
                              "linear-gradient(90deg,#1E4C3D,#3C7B60)",
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.catRow}>
                      <div className={styles.catTop}>
                        <span>Travel</span>
                        <strong>£860</strong>
                      </div>
                      <div className={styles.bar}>
                        <span
                          style={{
                            width: "57%",
                            background:
                              "linear-gradient(90deg,#D7A23E,#EFC470)",
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.catRow}>
                      <div className={styles.catTop}>
                        <span>Meals &amp; entertainment</span>
                        <strong>£540</strong>
                      </div>
                      <div className={styles.bar}>
                        <span
                          style={{
                            width: "36%",
                            background:
                              "linear-gradient(90deg,#7FA98B,#A9C6AF)",
                          }}
                        />
                      </div>
                    </div>
                    <div className={styles.catRow}>
                      <div className={styles.catTop}>
                        <span>Office supplies</span>
                        <strong>£310</strong>
                      </div>
                      <div className={styles.bar}>
                        <span
                          style={{
                            width: "21%",
                            background:
                              "linear-gradient(90deg,#B9AE94,#D5CCB4)",
                          }}
                        />
                      </div>
                    </div>
                  </section>

                  <section
                    className={`${styles.card} ${styles.pack}`}
                    id="pack"
                  >
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
                        <span>Ready soon · 3 blockers</span>
                      </div>
                    </div>

                    <ul className={styles.fileList}>
                      <li>
                        <span
                          className={`${styles.fileIco} ${styles.xlsx}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            aria-hidden="true"
                            style={{ width: 13, height: 13, display: "block" }}
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                            <path d="M14 2v6h6" />
                            <path d="M12 18v-6" />
                            <path d="M9 15h6" />
                          </svg>
                        </span>
                        transactions.xlsx <em>142 rows</em>
                      </li>
                      <li>
                        <span className={`${styles.fileIco} ${styles.pdf}`}>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            aria-hidden="true"
                            style={{ width: 13, height: 13, display: "block" }}
                          >
                            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
                            <path d="M9 8h6" />
                            <path d="M9 12h6" />
                          </svg>
                        </span>
                        summary.pdf <em>1 page</em>
                      </li>
                      <li>
                        <span
                          className={`${styles.fileIco} ${styles.folder}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            aria-hidden="true"
                            style={{ width: 13, height: 13, display: "block" }}
                          >
                            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                            <path d="m4.5 7.5 7.5 4 7.5-4" />
                            <path d="M12 12v9" />
                          </svg>
                        </span>
                        receipts/ <em>34 files</em>
                      </li>
                      <li>
                        <span
                          className={`${styles.fileIco} ${styles.csv}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            aria-hidden="true"
                            style={{ width: 13, height: 13, display: "block" }}
                          >
                            <path d="M3 21h18" />
                            <path d="M5 21V8l7-5 7 5v13" />
                            <path d="M9 21v-6h6v6" />
                          </svg>
                        </span>
                        exceptions.csv <em>6 items</em>
                      </li>
                      <li>
                        <span
                          className={`${styles.fileIco} ${styles.json}`}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            aria-hidden="true"
                            style={{ width: 13, height: 13, display: "block" }}
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                            <path d="M14 2v6h6" />
                            <path d="m9 15 2 2 4-4" />
                          </svg>
                        </span>
                        audit.json <em>full trail</em>
                      </li>
                    </ul>

                    <button
                      type="button"
                      className={`${styles.btnPrimary} ${styles.full}`}
                      onClick={() => setView("export")}
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
                    <p className={styles.fine}>
                      3 blockers will be listed in exceptions.csv
                    </p>
                  </section>
                </div>
              </div>

              {/* ARCHIVE */}
              <section className={styles.archive} id="archive">
                <div className={styles.archiveHead}>
                  <span className={styles.eyebrowSm}>Previous months</span>
                  <button
                    type="button"
                    className={styles.cardLink}
                    onClick={() => setView("summary")}
                  >
                    View archive
                  </button>
                </div>
                <div className={styles.archiveGrid}>
                  <button type="button" className={styles.archiveCard}>
                    <span className={styles.archiveMonth}>October</span>
                    <span className={styles.archiveMeta}>
                      <span className={styles.ok}>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                        Exported
                      </span>
                      <span>2 Nov 2026</span>
                    </span>
                    <span className={styles.archiveAmount}>£3,980.20</span>
                  </button>
                  <button type="button" className={styles.archiveCard}>
                    <span className={styles.archiveMonth}>September</span>
                    <span className={styles.archiveMeta}>
                      <span className={styles.ok}>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="m5 12 4 4L19 6" />
                        </svg>
                        Exported
                      </span>
                      <span>3 Oct 2026</span>
                    </span>
                    <span className={styles.archiveAmount}>£4,112.80</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.archiveCard} ${styles.new}`}
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
                      <path d="M12 5v14" />
                      <path d="M5 12h14" />
                    </svg>
                    Start December
                  </button>
                </div>
              </section>
            </>
          )}

          {view === "transactions" && (
            <TransactionsScreen
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              transactions={Mock.tx as any}
              onEdit={(id) => {
                setView("review");
              }}
            />
          )}

          {view === "receipts" && (
            <ReceiptImportScreen
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              receipts={Mock.rc as any}
              onUpload={(files) => {
                /* will wire to real import later */
              }}
            />
          )}

          {view === "review" && (
            <>
              <ReceiptReviewScreen
                id="rec-3"
                name="adobe-creative-cloud-nov.pdf"
                status="needs_review"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                fields={Mock.receiptFields as any}
                matchStatus="partial"
                matchMeta="Adobe · 03 Nov · £19.99"
                suggestedCategory="Software and subscriptions"
              />
              <ExceptionsScreen
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                exceptions={Mock.exceptions.slice(0, 3) as any}
                onAcceptSuggested={(ids) => {}}
                onSetCategory={(ids, cat) => {}}
                onMarkPersonal={(ids) => {}}
                onMarkReviewed={(ids) => {}}
              />
            </>
          )}

          {view === "summary" && (
            <MonthSummaryScreen
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              summary={Mock.summary as any}
            />
          )}

          {view === "export" && (
            <ExportPackScreen
              ready={false}
              transactionCount={142}
              receiptCount={34}
              blockerCount={3}
              onExport={(preset) => {
                /* will wire to real export later */
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small mock dataset so the screens render with realistic content during
// design review. Replace with real state once the data layer is built.
// ---------------------------------------------------------------------------

const Mock = {
  tx: [
    {
      id: "tx-1",
      date: "28 Nov",
      description: "Stripe payout",
      account: "Stripe",
      amount: 2410.0,
      direction: "in",
      category: "Sales and income",
      categoryId: "sales",
      vat: "not_applicable",
      note: "Card sales",
      personal: false,
      matchStatus: "matched",
      matchMeta: "Matched to receipt",
      status: "matched",
    },
    {
      id: "tx-2",
      date: "27 Nov",
      description: "Figma",
      account: "Wise",
      amount: 12.0,
      direction: "out",
      category: "Software and subscriptions",
      categoryId: "software",
      vat: "included",
      note: "",
      personal: false,
      matchStatus: "matched",
      matchMeta: "Matched to receipt",
      status: "matched",
    },
    {
      id: "tx-3",
      date: "26 Nov",
      description: "Tesco Stores",
      account: "Monzo",
      amount: 42.1,
      direction: "out",
      category: "Groceries",
      categoryId: "meals",
      vat: "included",
      note: "",
      personal: false,
      matchStatus: "unmatched",
      matchMeta: undefined,
      status: "missing_receipt",
      flagged: true,
    },
    {
      id: "tx-4",
      date: "25 Nov",
      description: "Uber Trip",
      account: "Monzo",
      amount: 14.2,
      direction: "out",
      category: "Travel",
      categoryId: "travel",
      vat: "not_applicable",
      note: "",
      personal: false,
      matchStatus: "unmatched",
      matchMeta: undefined,
      status: "review",
      flagged: true,
    },
    {
      id: "tx-5",
      date: "24 Nov",
      description: "Adobe Creative Cloud",
      account: "Wise",
      amount: 19.99,
      direction: "out",
      category: "Software and subscriptions",
      categoryId: "software",
      vat: "included",
      note: "",
      personal: false,
      matchStatus: "partial",
      matchMeta: "£19.99 vs £21.99",
      status: "review",
      flagged: true,
    },
    {
      id: "tx-6",
      date: "23 Nov",
      description: "Stationery World",
      account: "Monzo",
      amount: 28.5,
      direction: "out",
      category: "Office supplies",
      categoryId: "office",
      vat: "included",
      note: "",
      personal: false,
      matchStatus: "matched",
      matchMeta: "Matched to receipt",
      status: "matched",
    },
    {
      id: "tx-7",
      date: "22 Nov",
      description: "Client lunch",
      account: "Monzo",
      amount: 64.0,
      direction: "out",
      category: "Meals and entertainment",
      categoryId: "meals",
      vat: "included",
      note: "Client meeting",
      personal: false,
      matchStatus: "matched",
      matchMeta: "Matched to receipt",
      status: "matched",
    },
    {
      id: "tx-8",
      date: "21 Nov",
      description: "Amazon Web Services",
      account: "Wise",
      amount: 85.0,
      direction: "out",
      category: "Software and subscriptions",
      categoryId: "software",
      vat: "excluded",
      note: "",
      personal: false,
      matchStatus: "matched",
      matchMeta: "Matched to receipt",
      status: "matched",
    },
    {
      id: "tx-9",
      date: "20 Nov",
      description: "Office coffee run",
      account: "Monzo",
      amount: 8.5,
      direction: "out",
      category: "Meals and entertainment",
      categoryId: "meals",
      vat: "included",
      note: "",
      personal: true,
      matchStatus: "unmatched",
      matchMeta: undefined,
      status: "uncategorised",
    },
    {
      id: "tx-10",
      date: "19 Nov",
      description: "Zoom subscription",
      account: "Wise",
      amount: 13.99,
      direction: "out",
      category: "Software and subscriptions",
      categoryId: "software",
      vat: "included",
      note: "",
      personal: false,
      matchStatus: "matched",
      matchMeta: "Matched to receipt",
      status: "matched",
    },
    {
      id: "tx-11",
      date: "18 Nov",
      description: "Train fare London",
      account: "Monzo",
      amount: 56.0,
      direction: "out",
      category: "Travel",
      categoryId: "travel",
      vat: "not_applicable",
      note: "",
      personal: false,
      matchStatus: "unmatched",
      matchMeta: undefined,
      status: "uncategorised",
    },
    {
      id: "tx-12",
      date: "17 Nov",
      description: "Cloud hosting",
      account: "Wise",
      amount: 42.0,
      direction: "out",
      category: "Software and subscriptions",
      categoryId: "software",
      vat: "excluded",
      note: "",
      personal: false,
      matchStatus: "matched",
      matchMeta: "Matched to receipt",
      status: "matched",
    },
    {
      id: "tx-13",
      date: "16 Nov",
      description: "Office supplies",
      account: "Monzo",
      amount: 96.0,
      direction: "out",
      category: "Office supplies",
      categoryId: "office",
      vat: "included",
      note: "",
      personal: false,
      matchStatus: "matched",
      matchMeta: "Matched to receipt",
      status: "matched",
    },
    {
      id: "tx-14",
      date: "15 Nov",
      description: "Team lunch",
      account: "Monzo",
      amount: 112.5,
      direction: "out",
      category: "Meals and entertainment",
      categoryId: "meals",
      vat: "included",
      note: "Team offsite",
      personal: false,
      matchStatus: "matched",
      matchMeta: "Matched to receipt",
      status: "matched",
    },
    {
      id: "tx-15",
      date: "14 Nov",
      description: "Software subscription",
      account: "Wise",
      amount: 29.0,
      direction: "out",
      category: "Software and subscriptions",
      categoryId: "software",
      vat: "included",
      note: "",
      personal: false,
      matchStatus: "unmatched",
      matchMeta: undefined,
      status: "missing_receipt",
      flagged: true,
    },
  ],
  rc: [
    {
      id: "rec-1",
      name: "tesco-stores-12-nov.pdf",
      type: "pdf",
      size: 124000,
      status: "extracted",
      pages: 1,
    },
    {
      id: "rec-2",
      name: "stripe-payout-receipt.png",
      type: "image",
      size: 382000,
      status: "extracted",
      pages: 1,
    },
    {
      id: "rec-3",
      name: "adobe-creative-cloud-nov.pdf",
      type: "pdf",
      size: 211000,
      status: "needs_review",
      pages: 1,
    },
    {
      id: "rec-4",
      name: "uber-trip-18-nov.jpg",
      type: "image",
      size: 512000,
      status: "queued",
    },
    {
      id: "rec-5",
      name: "client-lunch-22-nov.pdf",
      type: "pdf",
      size: 188000,
      status: "processing",
      progress: 62,
      pages: 1,
    },
    {
      id: "rec-6",
      name: "stationery-world-23-nov.pdf",
      type: "pdf",
      size: 96000,
      status: "extracted",
      pages: 1,
      duplicate: true,
    },
    {
      id: "rec-7",
      name: "aws-invoice-nov.pdf",
      type: "pdf",
      size: 420000,
      status: "failed",
      error: "Could not read amount",
    },
  ],
  receiptFields: [
    { label: "Vendor", value: "Adobe Inc.", confidence: 0.94, kind: "text" },
    {
      label: "Date",
      value: "2026-11-03",
      confidence: 0.88,
      kind: "date",
    },
    {
      label: "Total amount",
      value: 19.99,
      confidence: 0.52,
      kind: "amount",
    },
    {
      label: "Currency",
      value: "GBP",
      confidence: 0.96,
      kind: "currency",
    },
    {
      label: "VAT amount",
      value: 3.41,
      confidence: 0.48,
      kind: "amount",
      placeholder: "e.g. 3.41",
    },
    {
      label: "Payment method",
      value: "Card",
      confidence: 0.91,
      kind: "text",
    },
    {
      label: "Line items",
      value: "1× Creative Cloud All Apps",
      confidence: 0.63,
      kind: "text",
    },
  ],
  exceptions: [
    {
      id: "ex-1",
      type: "missing_receipt",
      severity: "high",
      message: "No receipt attached",
      sub: "Tesco Stores · 12 Nov · £42.10",
      category: "Groceries",
    },
    {
      id: "ex-2",
      type: "amount_mismatch",
      severity: "high",
      message: "Amount mismatch",
      sub: "Adobe Creative Cloud · 03 Nov · £19.99 vs £21.99",
      category: "Software and subscriptions",
      valueLabel: "£19.99 vs £21.99",
    },
    {
      id: "ex-3",
      type: "possible_personal",
      severity: "medium",
      message: "Possible personal expense",
      sub: "Uber Trip · 18 Nov · £14.20",
      category: "Travel",
    },
    {
      id: "ex-4",
      type: "duplicate_transaction",
      severity: "low",
      message: "Duplicate transaction",
      sub: "Stationery World · 23 Nov · £96.00 appears twice",
      category: "Office supplies",
      valueLabel: "2× £96.00",
    },
    {
      id: "ex-5",
      type: "uncategorised",
      severity: "medium",
      message: "Uncategorised",
      sub: "Train fare London · 18 Nov · £56.00",
      category: undefined,
      valueLabel: "No category",
    },
    {
      id: "ex-6",
      type: "low_confidence",
      severity: "low",
      message: "Low confidence extraction",
      sub: "Adobe Creative Cloud receipt · VAT amount unsure",
      category: "Software and subscriptions",
      valueLabel: "VAT unsure",
    },
  ],
  summary: {
    monthLabel: "November 2026",
    currency: "GBP",
    totalIn: 12480.0,
    totalOut: 8214.36,
    net: 4265.64,
    inDelta: 8.2,
    outDelta: -3.1,
    categories: [
      { name: "Software & subscriptions", amount: 1240, pct: 82, color: "#2a6350" },
      { name: "Travel", amount: 860, pct: 57, color: "#7a5413" },
      { name: "Meals & entertainment", amount: 540, pct: 36, color: "#3e6b8a" },
      { name: "Office supplies", amount: 310, pct: 21, color: "#7c857d" },
      { name: "Bank fees", amount: 180, pct: 12, color: "#8c3a28" },
      { name: "Professional fees", amount: 120, pct: 8, color: "#5c6459" },
    ],
    vat: {
      included: 1840.20,
      excluded: 612.00,
      rate: 20.0,
      net: 5762.16,
    },
    counts: {
      missingReceipts: 2,
      unmatchedReceipts: 3,
      duplicates: 1,
      uncategorised: 2,
      lowConfidence: 2,
    },
    readiness: 68,
    blockers: [
      { label: "Missing receipts", count: 2, value: 61.60 },
      { label: "Unmatched receipts", count: 3, value: 91.70 },
      { label: "Uncategorised transactions", count: 2, value: 64.50 },
    ],
  },
};
