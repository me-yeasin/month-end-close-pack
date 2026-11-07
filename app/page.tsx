import {
  IconFileTypeCsv,
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileZip,
  IconJson,
} from "@tabler/icons-react";
import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={styles.shell}>
      {/* ================= SIDEBAR ================= */}
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="#top" aria-label="Month-End Pack home">
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
          <a className={`${styles.navItem} ${styles.active}`} href="#top">
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
          <a className={styles.navItem} href="#transactions">
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
          <a className={styles.navItem} href="#pack">
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
          <a className={styles.navItem} href="#attention">
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
          <a className={styles.navItem} href="#summary">
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
          <a className={styles.navItem} href="#pack">
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

      {/* ================= MAIN ================= */}
      <main className={styles.main} id="top">
        <div className={styles.mainInner}>
          <header className={styles.topbar}>
            <div className={styles.crumbs}>
              <span>Workspace</span>
              <svg
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
              <strong>November 2026</strong>
            </div>
            <div className={styles.topActions}>
              <span className={styles.localPill}>
                <span className={styles.pulse} />
                On this device
              </span>
              <button type="button" className={styles.iconBtn} aria-label="Search">
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

          {/* HERO */}
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={styles.heroCopy}>
              <div className={styles.heroEyebrow}>
                <i aria-hidden="true" /> Month-end workspace · GBP
              </div>
              <h1 id="hero-title">
                Almost <em>accountant-ready.</em>
              </h1>
              <p>
                142 transactions and 34 receipts are in. Three items need a quick
                look before you export November.
              </p>
              <div className={styles.heroMobileReady}>
                <strong>68%</strong> pack readiness
              </div>
              <div className={styles.heroActions}>
                <a href="#attention" className={`${styles.btn} ${styles.btnAmber}`}>
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
                </a>
                <button type="button" className={`${styles.btn} ${styles.btnGhost}`}>
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
              <svg className={styles.ring} viewBox="0 0 140 140" aria-hidden="true">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#F5EFDD" />
                    <stop offset="0.55" stopColor="#F0C877" />
                    <stop offset="1" stopColor="#E7B24A" />
                  </linearGradient>
                </defs>
                <circle className={styles.ringTrack} cx="70" cy="70" r="56" />
                <circle className={styles.ringValue} cx="70" cy="70" r="56" />
              </svg>
              <div className={styles.ringLabel}>
                <strong>
                  68<span>%</span>
                </strong>
                <span>pack readiness</span>
              </div>
            </div>
          </section>

          {/* PIPELINE */}
          <section className={styles.pipeline} aria-label="Monthly progress">
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
              <div className={styles.stepSub}>2 files · 142 transactions</div>
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
              <div className={styles.stepSub}>34 files · 2 duplicates skipped</div>
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
              <div className={styles.stepSub}>3 of 142 items need a look</div>
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
              <div className={styles.stepSub}>Unlocks at 100% ready</div>
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
                    <span className={styles.eyebrowSm}>Needs your attention</span>
                    <h2>Three quick fixes</h2>
                  </div>
                  <span className={styles.countPill}>3 of 6</span>
                </div>

                <div className={styles.exception}>
                  <span className={`${styles.exIcon} ${styles.red}`}>
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
                    <span>Tesco Stores · 12 Nov · £42.10</span>
                  </div>
                  <span className={styles.chip}>Groceries</span>
                  <button type="button" className={styles.miniBtn}>
                    Add receipt
                  </button>
                </div>

                <div className={styles.exception}>
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
                    <strong>Amount mismatch</strong>
                    <span>Adobe Creative Cloud · 03 Nov · £19.99 vs £21.99</span>
                  </div>
                  <span className={styles.chip}>Software</span>
                  <button type="button" className={styles.miniBtn}>
                    Resolve
                  </button>
                </div>

                <div className={styles.exception}>
                  <span className={`${styles.exIcon} ${styles.blue}`}>
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
                    <span>Uber Trip · 18 Nov · £14.20</span>
                  </div>
                  <span className={styles.chip}>Travel</span>
                  <button type="button" className={styles.miniBtn}>
                    Review
                  </button>
                </div>

                <button
                  type="button"
                  className={styles.cardLink}
                  style={{ marginTop: 12 }}
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
                    <span className={styles.eyebrowSm}>Latest activity</span>
                    <h2>Recent transactions</h2>
                  </div>
                  <a className={styles.cardLink} href="#transactions">
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
                  </a>
                </div>

                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <caption className="sr-only">Recent transactions</caption>
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
                        <span className={styles.vendor}>Stripe payout</span>
                        <span className={styles.subLine}>Sales and income</span>
                      </td>
                      <td className={`${styles.num} ${styles.inAmount}`}>
                        +£2,410.00
                      </td>
                      <td>
                        <span className={`${styles.status} ${styles.matched}`}>
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
                        <span className={`${styles.status} ${styles.matched}`}>
                          Matched
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className={styles.dateCell}>26 Nov</td>
                      <td>
                        <span className={styles.vendor}>Tesco Stores</span>
                        <span className={styles.subLine}>Groceries</span>
                      </td>
                      <td className={styles.num}>−£42.10</td>
                      <td>
                        <span className={`${styles.status} ${styles.missing}`}>
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
                        <span className={`${styles.status} ${styles.review}`}>
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
              <section className={`${styles.card} ${styles.money}`} id="summary">
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
                    <span className={styles.eyebrowSm}>Where it went</span>
                    <h2>Top categories</h2>
                  </div>
                  <button type="button" className={styles.cardLink}>
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
                        background: "linear-gradient(90deg,#1E4C3D,#3C7B60)",
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
                        background: "linear-gradient(90deg,#D7A23E,#EFC470)",
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
                        background: "linear-gradient(90deg,#7FA98B,#A9C6AF)",
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
                        background: "linear-gradient(90deg,#B9AE94,#D5CCB4)",
                      }}
                    />
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
                    <span>Ready soon · 3 blockers</span>
                  </div>
                </div>

                <ul className={styles.fileList}>
                  <li>
                    <span className={`${styles.fileIco} ${styles.xlsx}`}>
                      <IconFileTypeXls size={13} stroke={1.8} aria-hidden="true" />
                    </span>
                    transactions.xlsx <em>142 rows</em>
                  </li>
                  <li>
                    <span className={`${styles.fileIco} ${styles.pdf}`}>
                      <IconFileTypePdf size={13} stroke={1.8} aria-hidden="true" />
                    </span>
                    summary.pdf <em>1 page</em>
                  </li>
                  <li>
                    <span className={`${styles.fileIco} ${styles.folder}`}>
                      <IconFileZip size={13} stroke={1.8} aria-hidden="true" />
                    </span>
                    receipts/ <em>34 files</em>
                  </li>
                  <li>
                    <span className={`${styles.fileIco} ${styles.csv}`}>
                      <IconFileTypeCsv size={13} stroke={1.8} aria-hidden="true" />
                    </span>
                    exceptions.csv <em>6 items</em>
                  </li>
                  <li>
                    <span className={`${styles.fileIco} ${styles.json}`}>
                      <IconJson size={13} stroke={1.8} aria-hidden="true" />
                    </span>
                    audit.json <em>full trail</em>
                  </li>
                </ul>

                <button type="button" className={`${styles.btn} ${styles.btnForest} ${styles.full}`}>
                  Export pack
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                  </svg>
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
              <button type="button" className={styles.cardLink}>
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
        </div>
      </main>
    </div>
  );
}
