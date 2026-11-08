"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./home.module.css";
import { MobileMenuButton } from "./mobile-menu-button";
import { Sidebar } from "./sidebar";
import { TransactionsScreen } from "./transactions-screen";
import { ReceiptImportScreen } from "./receipts-screen";
import { ExceptionsScreen } from "./exceptions-screen";
import { MonthSummaryScreen } from "./summary-screen";
import { ExportPackScreen } from "./export-screen";
import { SettingsScreen } from "./settings-screen";
import { OverviewScreen } from "./overview-screen";
import { useAiStore, loadAiConfig } from "./ai-store";
import { useImportStore } from "./import-store";
import { useUiStore } from "./ui-store";
import { MonthPicker } from "./month-picker";
import { AddFilesModal } from "./add-files-modal";
import { formatPeriodLong, formatPeriodShort, currentPeriod } from "./period";
import { OnboardingScreen } from "./onboarding";
import {
  loadAllWorkspaces,
  loadActiveWorkspaceId,
  createWorkspace as dbCreateWorkspace,
  updateWorkspace as dbUpdateWorkspace,
} from "./workspace-store";

const VIEW_LABELS: Record<string, string> = {
  overview: "Overview",
  transactions: "Transactions",
  receipts: "Receipts",
  review: "Review",
  summary: "Summary",
  export: "Export",
  settings: "Settings",
};

function formatTxDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function Home() {
  const view = useUiStore((state) => state.view);
  const setView = useUiStore((state) => state.setView);
  const workspace = useUiStore((state) => state.workspace);
  const hydrateWorkspaces = useUiStore((state) => state.hydrateWorkspaces);
  const addWorkspace = useUiStore((state) => state.addWorkspace);
  const setPeriod = useUiStore((state) => state.setPeriod);

  // month picker popover state
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);

  // add-files modal state
  const [addFilesOpen, setAddFilesOpen] = useState(false);

  // AI provider configuration — gates the Add files action.
  const aiProviders = useAiStore((state) => state.providers);
  const aiActiveProviderId = useAiStore((state) => state.activeProviderId);
  const aiActiveModelId = useAiStore((state) => state.activeModelId);
  const hydrateAi = useAiStore((state) => state.hydrate);
  const aiConfigured = aiProviders.some(
    (p) =>
      p.id === aiActiveProviderId &&
      p.models.some((m) => m.id === aiActiveModelId),
  );

  // Bank import state (real transactions + job progress)
  const importTransactions = useImportStore((state) => state.transactions);
  const importJob = useImportStore((state) => state.job);
  const hydrateImport = useImportStore((state) => state.hydrate);
  const startImport = useImportStore((state) => state.startImport);
  const activeAiProvider =
    aiProviders.find((p) => p.id === aiActiveProviderId) ?? null;

  const handleAddFiles = (bankFiles: File[]) => {
    if (!workspace || !activeAiProvider || !aiActiveModelId) return;
    void startImport(
      bankFiles,
      { id: workspace.id, month: workspace.month, year: workspace.year },
      {
        baseUrl: activeAiProvider.baseUrl,
        apiKey: activeAiProvider.apiKey,
        model: aiActiveModelId,
      },
    );
  };

  // Close the month picker when clicking outside the trigger + popover
  useEffect(() => {
    if (!monthPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) {
        setMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [monthPickerOpen]);

  // Commit a period: update in-memory state + persist per-workspace preference
  const handleSelectPeriod = (month: number, year: number) => {
    setPeriod(month, year);
    if (workspace) dbUpdateWorkspace(workspace.id, { month, year });
    setMonthPickerOpen(false);
  };

  // true while we are reading IndexedDB on first mount
  const [loading, setLoading] = useState(true);

  const goBack = () => setView("overview");

  // On mount: read IndexedDB and hydrate the Zustand store.
  // useEffect never runs on the server — IndexedDB is browser-only.
  useEffect(() => {
    Promise.all([loadAllWorkspaces(), loadActiveWorkspaceId(), loadAiConfig()])
      .then(([workspaces, activeId, aiConfig]) => {
        hydrateWorkspaces(workspaces, activeId);
        if (aiConfig) {
          hydrateAi(
            aiConfig.providers,
            aiConfig.activeProviderId,
            aiConfig.activeModelId,
          );
        } else {
          hydrateAi([], null, null);
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the active month's imported transactions + latest job.
  useEffect(() => {
    if (!workspace) return;
    void hydrateImport(workspace.id, workspace.month, workspace.year);
  }, [workspace?.id, workspace?.month, workspace?.year, hydrateImport]);

  // Avoid flashing onboarding on page load while we check IndexedDB
  if (loading) return null;

  // Show onboarding if no workspace exists yet
  if (!workspace) {
    return (
      <OnboardingScreen
        onComplete={async (setup) => {
          const now = currentPeriod();
          const record = await dbCreateWorkspace({
            ...setup,
            month: now.month,
            year: now.year,
          });
          addWorkspace(record);
        }}
      />
    );
  }

  const txRows = importTransactions.map((t) => ({
    id: t.id,
    date: formatTxDate(t.date),
    description: t.description,
    account: t.account || undefined,
    amount: t.amount,
    direction: t.direction,
    category: undefined,
    categoryId: undefined,
    vat: undefined,
    note: undefined,
    personal: false,
    matchStatus: (t.flag ? "partial" : "matched") as
      | "matched"
      | "partial"
      | "unmatched",
    matchMeta: t.flag?.reason,
    status: (t.flag ? "review" : "matched") as
      | "matched"
      | "missing_receipt"
      | "review"
      | "uncategorised",
    selected: false,
    flagged: Boolean(t.flag),
  }));

  const reviewExceptions = importTransactions
    .filter((t) => t.flag)
    .map((t) => ({
      id: t.id,
      type: t.flag!.type as
        | "possible_personal"
        | "duplicate_transaction"
        | "foreign_currency"
        | "uncategorised",
      severity: t.flag!.severity,
      message: t.description,
      sub: t.flag!.reason,
      category: undefined,
      value: t.amount,
      valueLabel: undefined,
      checked: false,
    }));

  const flaggedCount = reviewExceptions.length;

  return (
    <div className={styles.shell}>
      <Sidebar reviewCount={flaggedCount} />

      {/* ================= MAIN ================= */}
      <main className={styles.main} id="top">
        <div className={styles.mainInner}>
          <header className={styles.topbar}>
            <div className={styles.crumbs}>
              <MobileMenuButton />
              <span className={styles.crumbSection}>{formatPeriodLong({ month: workspace.month, year: workspace.year })}</span>
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
              <div className={styles.monthWrap} ref={monthRef}>
                <button
                  type="button"
                  className={styles.monthBtn}
                  onClick={() => setMonthPickerOpen((v) => !v)}
                  aria-haspopup="dialog"
                  aria-expanded={monthPickerOpen}
                  aria-label={`Selected period ${formatPeriodLong({ month: workspace.month, year: workspace.year })}. Change month or year.`}
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
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                  </svg>
                  {formatPeriodShort({ month: workspace.month, year: workspace.year })}
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
                {monthPickerOpen && (
                  <MonthPicker
                    month={workspace.month}
                    year={workspace.year}
                    onSelect={handleSelectPeriod}
                    onClose={() => setMonthPickerOpen(false)}
                  />
                )}
              </div>
              <div className={styles.avatar} title="Account" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </div>
            </div>
          </header>

          {/* sub-view index bar for non-overview views */}
          {view !== "overview" && view !== "settings" && (
            <div
              className={styles.topbar}
              style={{ marginBottom: 18, height: "auto", paddingBottom: 14, borderBottom: "1px solid var(--line)" }}
            >
              <div className={styles.crumbs}>
                <strong>{formatPeriodLong({ month: workspace.month, year: workspace.year })}</strong>
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
              {!aiConfigured && (
                <div className={styles.aiWarn} role="alert">
                  <span className={styles.aiWarnIcon} aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                      <path d="M12 9v4" />
                      <path d="M12 17h.01" />
                    </svg>
                  </span>
                  <div className={styles.aiWarnText}>
                    <strong>AI model not configured</strong>
                    <span>
                      Configure an AI model to analyze your bank statements.
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.aiWarnBtn}
                    onClick={() => setView("settings")}
                  >
                    Configure
                  </button>
                </div>
              )}

              <OverviewScreen
                aiConfigured={aiConfigured}
                onAddFiles={() => setAddFilesOpen(true)}
                onReview={() => setView("review")}
                onTransactions={() => setView("transactions")}
                onExport={() => setView("export")}
                transactions={importTransactions}
                job={importJob}
                currency={workspace.currency}
              />
            </>
          )}

          {view === "transactions" && (
            <TransactionsScreen
              transactions={txRows}
              onEdit={() => setView("review")}
            />
          )}

          {view === "receipts" && (
            <ReceiptImportScreen
              receipts={[]}
              onUpload={() => {
                /* will wire to real import later */
              }}
            />
          )}

          {view === "review" && (
            <ExceptionsScreen
              exceptions={reviewExceptions}
              onAcceptSuggested={() => {}}
              onSetCategory={() => {}}
              onMarkPersonal={() => {}}
              onMarkReviewed={() => {}}
            />
          )}

          {view === "summary" && (
            <MonthSummaryScreen
              summary={{
                monthLabel: formatPeriodLong({
                  month: workspace.month,
                  year: workspace.year,
                }),
                currency: workspace.currency,
                totalIn: 0,
                totalOut: 0,
                net: 0,
                categories: [],
                vat: { included: 0, excluded: 0, rate: 0, net: 0 },
                counts: {
                  missingReceipts: 0,
                  unmatchedReceipts: 0,
                  duplicates: 0,
                  uncategorised: 0,
                  lowConfidence: 0,
                },
                readiness: 0,
                blockers: [],
              }}
            />
          )}

          {view === "export" && (
            <ExportPackScreen
              ready={false}
              transactionCount={0}
              receiptCount={0}
              blockerCount={0}
              onExport={() => {
                /* will wire to real export later */
              }}
            />
          )}

          {view === "settings" && <SettingsScreen />}
        </div>
      </main>

      <AddFilesModal
        open={addFilesOpen}
        onClose={() => setAddFilesOpen(false)}
        onAdd={handleAddFiles}
      />
    </div>
  );
}
