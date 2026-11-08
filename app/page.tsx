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
import { useReceiptStore } from "./receipt-store";
import { buildSummary } from "./summary";
import { buildExportPack, type PackPreset } from "./export-pack";
import { autoMatch } from "./matching";
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
  const bankOnly = useUiStore((state) => state.bankOnly);
  const workspace = useUiStore((state) => state.workspace);
  const hydrateWorkspaces = useUiStore((state) => state.hydrateWorkspaces);
  const addWorkspace = useUiStore((state) => state.addWorkspace);
  const setPeriod = useUiStore((state) => state.setPeriod);

  // month picker popover state
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);

  // add-files modal state
  const [addFilesOpen, setAddFilesOpen] = useState(false);
  const [addFilesMode, setAddFilesMode] = useState<
    "all" | "bank" | "receipts"
  >("all");
  const openAddFiles = (mode: "all" | "bank" | "receipts") => {
    setAddFilesMode(mode);
    setAddFilesOpen(true);
  };

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
  const resolveTransactions = useImportStore((state) => state.resolveTransactions);
  const setCategory = useImportStore((state) => state.setCategory);
  const setTransactionMatch = useImportStore((state) => state.setTransactionMatch);

  // Receipt pipeline state
  const receiptRecords = useReceiptStore((state) => state.receipts);
  const hydrateReceipts = useReceiptStore((state) => state.hydrate);
  const addReceiptFiles = useReceiptStore((state) => state.addFiles);
  const retryReceipt = useReceiptStore((state) => state.retry);
  const removeReceipt = useReceiptStore((state) => state.remove);
  const clearReceipts = useReceiptStore((state) => state.clear);
  const setReceiptMatch = useReceiptStore((state) => state.setReceiptMatch);
  const receiptsProcessing = useReceiptStore((state) => state.processing);

  const activeAiProvider =
    aiProviders.find((p) => p.id === aiActiveProviderId) ?? null;

  const handleAddFiles = (bankFiles: File[], receiptFiles: File[]) => {
    if (!workspace) return;
    if (bankFiles.length > 0 && activeAiProvider && aiActiveModelId) {
      void startImport(
        bankFiles,
        { id: workspace.id, month: workspace.month, year: workspace.year },
        {
          baseUrl: activeAiProvider.baseUrl,
          apiKey: activeAiProvider.apiKey,
          model: aiActiveModelId,
        },
      );
    }
    if (receiptFiles.length > 0 && activeAiProvider && aiActiveModelId) {
      void addReceiptFiles(
        receiptFiles,
        { id: workspace.id, month: workspace.month, year: workspace.year },
        {
          baseUrl: activeAiProvider.baseUrl,
          apiKey: activeAiProvider.apiKey,
          model: aiActiveModelId,
        },
      );
    }
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

  // Load the active month's imported transactions, receipts + latest job.
  useEffect(() => {
    if (!workspace) return;
    void hydrateImport(workspace.id, workspace.month, workspace.year);
    void hydrateReceipts(workspace.id, workspace.month, workspace.year);
  }, [workspace?.id, workspace?.month, workspace?.year, hydrateImport, hydrateReceipts]);

  // Auto-match extracted receipts to bank transactions. Idempotent: matched
  // pairs are excluded, so the effect converges after applying its changes.
  useEffect(() => {
    if (!workspace) return;
    const suggestions = autoMatch(receiptRecords, importTransactions);
    if (suggestions.length === 0) return;
    void (async () => {
      for (const s of suggestions) {
        await setReceiptMatch(s.receiptId, s.transactionId, s.matchType, s.confidence);
        await setTransactionMatch(s.transactionId, s.receiptId);
      }
    })();
  }, [receiptRecords, importTransactions, workspace, setReceiptMatch, setTransactionMatch]);

  // Bank-only mode hides the Receipts view — bounce the user out if they're on it.
  useEffect(() => {
    if (bankOnly && view === "receipts") setView("overview");
  }, [bankOnly, view, setView]);

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
    category: t.category,
    categoryId: t.categoryId,
    vat: t.vatTreatment,
    note: undefined,
    personal: t.reviewState === "personal",
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

  // Unresolved flags only — resolving an item clears its flag in the store,
  // so the review list and all counts stay consistent automatically.
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
      date: formatTxDate(t.date),
      category: t.category,
      value: t.amount,
    }));

  const resolvedCount = importTransactions.filter(
    (t) => !t.flag && t.reviewState !== undefined,
  ).length;
  const flaggedCount = reviewExceptions.length;

  // receipt view models — match info resolved against the transaction ledger
  const txById = new Map(importTransactions.map((t) => [t.id, t]));
  const receiptRows = receiptRecords.map((r) => {
    const matchedTx = r.matchId ? txById.get(r.matchId) : undefined;
    return {
      id: r.id,
      name: r.originalName,
      type: (r.mimeType === "application/pdf" ? "pdf" : "image") as "pdf" | "image",
      size: r.size,
      status: r.status,
      pages: r.pageCount,
      duplicate: r.duplicate,
      error: r.error,
      match:
        matchedTx && r.matchType
          ? {
              vendor: matchedTx.description,
              date: formatTxDate(matchedTx.date),
              matchType: r.matchType,
              confidence: r.matchConfidence ?? 0,
            }
          : null,
    };
  });

  const monthSummary = buildSummary(
    importTransactions,
    formatPeriodLong({ month: workspace.month, year: workspace.year }),
    workspace.currency,
    receiptRecords,
  );

  // Build the accountant pack ZIP in the browser and save it locally.
  const handleExport = async (
    preset: PackPreset,
  ): Promise<string | void> => {
    if (!workspace) return;
    // include receipts under receipts/, renamed by date, vendor and amount
    const packReceipts = receiptRecords
      .filter(
        (r) =>
          !r.duplicate &&
          (r.status === "extracted" || r.status === "needs_review"),
      )
      .map((r) => {
        const ext = r.mimeType.includes("pdf")
          ? "pdf"
          : r.mimeType.includes("png")
            ? "png"
            : "jpg";
        const vendor = (r.extracted?.vendor.value || "receipt")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);
        const date = r.extracted?.date.value || r.createdAt.slice(0, 10);
        const total = r.extracted?.total.value?.toFixed(2) ?? "0.00";
        return {
          name: `${date}-${vendor}-${total}.${ext}`,
          data: r.blob,
        };
      });

    const result = await buildExportPack({
      preset,
      transactions: importTransactions,
      summary: monthSummary,
      job: importJob,
      workspaceId: workspace.id,
      monthLabel: formatPeriodLong({
        month: workspace.month,
        year: workspace.year,
      }),
      monthId: `${workspace.year}-${String(workspace.month + 1).padStart(2, "0")}`,
      currency: workspace.currency,
      receipts: packReceipts,
    });
    return result.fileName;
  };

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
                bankOnly={bankOnly}
                onAddFiles={() => openAddFiles(bankOnly ? "bank" : "all")}
                onReview={() => setView("review")}
                onTransactions={() => setView("transactions")}
                onExport={() => setView("export")}
                transactions={importTransactions}
                job={importJob}
                currency={workspace.currency}
                receipts={receiptRecords}
                receiptProcessing={receiptsProcessing}
              />
            </>
          )}

          {view === "transactions" && (
            <TransactionsScreen
              transactions={txRows}
              onEdit={() => setView("review")}
              currency={workspace.currency}
              onImport={() => openAddFiles("bank")}
              aiConfigured={aiConfigured}
              isProcessing={importJob?.status === "processing"}
            />
          )}

          {view === "receipts" && (
            <ReceiptImportScreen
              receipts={receiptRows}
              aiConfigured={aiConfigured}
              onUpload={(files) => {
                if (activeAiProvider && aiActiveModelId && workspace) {
                  void addReceiptFiles(
                    files,
                    { id: workspace.id, month: workspace.month, year: workspace.year },
                    {
                      baseUrl: activeAiProvider.baseUrl,
                      apiKey: activeAiProvider.apiKey,
                      model: aiActiveModelId,
                    },
                  );
                }
              }}
              onRetry={(id) => {
                if (activeAiProvider && aiActiveModelId) {
                  void retryReceipt(id, {
                    baseUrl: activeAiProvider.baseUrl,
                    apiKey: activeAiProvider.apiKey,
                    model: aiActiveModelId,
                  });
                }
              }}
              onRemove={(id) => void removeReceipt(id)}
              onClear={() => void clearReceipts()}
            />
          )}

          {view === "review" && (
            <ExceptionsScreen
              exceptions={reviewExceptions}
              resolvedCount={resolvedCount}
              onAcceptSuggested={(ids) => void resolveTransactions(ids, "accepted")}
              onSetCategory={(ids, categoryId) => void setCategory(ids, categoryId)}
              onMarkPersonal={(ids) => void resolveTransactions(ids, "personal")}
              onMarkReviewed={(ids) => void resolveTransactions(ids, "reviewed")}
              currency={workspace.currency}
            />
          )}

          {view === "summary" && (
            <MonthSummaryScreen
              onReview={() => setView("review")}
              onExport={() => setView("export")}
              summary={monthSummary}
            />
          )}

          {view === "export" && (
            <ExportPackScreen
              ready={importTransactions.length > 0 && monthSummary.blockers.length === 0}
              hasData={importTransactions.length > 0}
              transactionCount={importTransactions.length}
              receiptCount={0}
              blockerCount={monthSummary.blockers.reduce((n, b) => n + b.count, 0)}
              onReview={() => setView("review")}
              onExport={handleExport}
            />
          )}

          {view === "settings" && <SettingsScreen />}
        </div>
      </main>

      {/* the modal mounts only while open, so its state resets naturally */}
      {addFilesOpen && (
        <AddFilesModal
          onClose={() => setAddFilesOpen(false)}
          onAdd={handleAddFiles}
          mode={addFilesMode}
        />
      )}
    </div>
  );
}
