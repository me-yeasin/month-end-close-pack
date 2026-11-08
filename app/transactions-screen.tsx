"use client";

import { useState, useMemo } from "react";
import {
  IconReceipt,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconX,
} from "@tabler/icons-react";
import styles from "./home.module.css";

// ---------------------------------------------------------------------------
// Smallest stand-in shape of the real types, only so the screen can render.
// The project already has the full versions in types/index.ts.
// ---------------------------------------------------------------------------

interface Tx {
  id: string;
  date: string;
  description: string;
  account?: string;
  amount: number;
  direction: "in" | "out";
  category?: string;
  categoryId?: string;
  vat?: "included" | "excluded" | "not_applicable";
  note?: string;
  personal?: boolean;
  matchStatus: "matched" | "partial" | "unmatched";
  matchMeta?: string;
  status: "matched" | "missing_receipt" | "review" | "uncategorised";
  selected?: boolean;
  flagged?: boolean;
}

interface Filters {
  search: string;
  status: string;
  category: string;
  direction: string;
}

const PAGE_SIZE = 5;

const FILTER_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "review", label: "Needs review" },
  { key: "matched", label: "Matched" },
];

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  matched: { label: "Matched", cls: styles.matched },
  missing_receipt: { label: "Missing receipt", cls: styles.missing },
  review: { label: "Needs review", cls: styles.review },
  uncategorised: { label: "Uncategorised", cls: styles.review },
};

export function TransactionsScreen({
  transactions,
  onEdit,
  currency = "GBP",
}: {
  transactions: Tx[];
  onEdit?: (id: string) => void;
  currency?: "GBP" | "EUR";
}) {
  const symbol = currency === "EUR" ? "€" : "£";
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    category: "all",
    direction: "all",
  });
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const q = filters.search.toLowerCase().trim();
  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (filters.status !== "all" && t.status !== filters.status) return false;
        if (filters.direction !== "all" && t.direction !== filters.direction)
          return false;
        if (q) {
          const haystack = `${t.description} ${t.account ?? ""} ${t.category ?? ""}`
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      }),
    [transactions, filters, q],
  );

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  return (
    <div className={styles.screen}>
      {/* header */}
      <div className={styles.sectionHead}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Ledger</span>
          <h2 className={styles.sectionH2}>Transactions</h2>
        </div>
        <div className={styles.sectionActions}>
          <span className={styles.tag}>{transactions.length} items</span>
          <button
            type="button"
            className={`${styles.btnSecondary} ${styles.sm}`}
          >
            <IconPlus size={14} stroke={1.8} />
            Import
          </button>
        </div>
      </div>

      {/* filters */}
      <div className={styles.section}>
        <div className={styles.filters}>
          <div className={styles.filterTabs} role="tablist">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                className={`${styles.filterTab} ${
                  filters.status === t.key ? styles.active : ""
                }`}
                onClick={() => {
                  setFilters((f) => ({ ...f, status: t.key }));
                  setPage(0);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.searchWrap}>
            <IconSearch className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search description, account…"
              value={filters.search}
              onChange={(e) => {
                setFilters((f) => ({ ...f, search: e.target.value }));
                setPage(0);
              }}
            />
          </div>

          <div className={styles.filterSpacer} />

          <select
            className={styles.sortSelect}
            value={filters.direction}
            onChange={(e) => {
              setFilters((f) => ({ ...f, direction: e.target.value }));
              setPage(0);
            }}
          >
            <option value="all">All directions</option>
            <option value="in">Money in</option>
            <option value="out">Money out</option>
          </select>

          <button
            type="button"
            className={`${styles.btnGhostSmall} ${styles.sm}`}
            onClick={() => setFilters({ search: "", status: "all", category: "all", direction: "all" })}
          >
            Clear filters
          </button>
        </div>

        {/* transaction cards */}
        <div className={styles.txList}>
          {slice.map((t) => {
            const isIn = t.direction === "in";
            return (
              <button
                key={t.id}
                type="button"
                className={`${styles.txRow} ${t.flagged ? styles.txRowFlagged : ""}`}
                onClick={() => openDetail(t.id)}
              >
                <span
                  className={`${styles.txIcon} ${isIn ? styles.txIconIn : styles.txIconOut}`}
                >
                  {isIn ? (
                    <IconArrowDownLeft size={18} stroke={2} />
                  ) : (
                    <IconArrowUpRight size={18} stroke={2} />
                  )}
                </span>

                <span className={styles.txMain}>
                  <span className={styles.txTitle}>{t.description}</span>
                  <span className={styles.txMeta}>
                    {t.date}
                    {t.account && (
                      <>
                        <i>·</i>
                        {t.account}
                      </>
                    )}
                    {t.category && (
                      <>
                        <i>·</i>
                        {t.category}
                      </>
                    )}
                  </span>
                  {t.flagged && t.matchMeta && (
                    <span className={styles.txReason}>{t.matchMeta}</span>
                  )}
                </span>

                <span className={styles.txRight}>
                  <span
                    className={`${styles.txAmount} ${isIn ? styles.txAmountIn : ""}`}
                  >
                    {isIn ? "+" : "−"}
                    {symbol}
                    {Math.abs(t.amount).toFixed(2)}
                  </span>
                  <span
                    className={`${styles.txStatus} ${t.flagged ? styles.txStatusWarn : styles.txStatusOk}`}
                  >
                    {t.flagged ? "Needs review" : "Matched"}
                  </span>
                </span>

                <IconChevronRight
                  className={styles.txChevron}
                  size={16}
                  stroke={1.8}
                />
              </button>
            );
          })}
        </div>

        {slice.length === 0 && (
          <div className={styles.empty} style={{ marginTop: 8 }}>
            <div className={styles.emptyIcon}>
              <IconSearch size={22} stroke={1.8} />
            </div>
            <div className={styles.emptyTitle}>No transactions match</div>
            <div className={styles.emptyDesc}>
              Try a different search or filter. Your imported bank files will
              appear here once they are in.
            </div>
            <div className={styles.emptyActions}>
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles.sm}`}
                onClick={() =>
                  setFilters({ search: "", status: "all", category: "all", direction: "all" })
                }
              >
                Clear filters
              </button>
              <button type="button" className={`${styles.btnPrimary} ${styles.sm}`}>
                <IconPlus size={14} stroke={1.8} />
                Import bank files
              </button>
            </div>
          </div>
        )}

        {/* footer */}
        {slice.length > 0 && (
          <div className={styles.tableFooter}>
            <span className={styles.tableCount}>
              Showing {(safePage * PAGE_SIZE) + 1}–{Math.min(
                (safePage + 1) * PAGE_SIZE,
                total,
              )}{" "}
              of {total}
            </span>
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={safePage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <IconChevronLeft size={13} stroke={2} />
              </button>
              <span className={styles.pageBtn} style={{ cursor: "default" }}>
                {safePage + 1} / {pages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={safePage >= pages - 1}
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              >
                <IconChevronRight size={13} stroke={2} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* detail panel */}
      {detailOpen && selectedId && (
        <>
          <div
            className={`${styles.detailBackdrop} open`}
            onClick={() => setDetailOpen(false)}
          />
          <TransactionDetail
            transaction={
              transactions.find((t) => t.id === selectedId) ?? {
                id: selectedId,
                date: "",
                description: "",
                amount: 0,
                direction: "out",
                status: "uncategorised",
                matchStatus: "unmatched",
              }
            }
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            onEdit={() => onEdit?.(selectedId)}
            currency={currency}
          />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transaction detail panel
// ---------------------------------------------------------------------------

function TransactionDetail({
  transaction,
  open,
  onClose,
  onEdit,
  currency = "GBP",
}: {
  transaction: Tx;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  currency?: "GBP" | "EUR";
}) {
  const symbol = currency === "EUR" ? "€" : "£";
  return (
    <div className={styles.detailPanel}>
      <div
        className={`${styles.detailBackdrop} ${open ? styles.open : ""}`}
        onClick={onClose}
      />
      <div className={`${styles.detailCard} ${open ? styles.open : ""}`}>
        <div className={styles.detailHead}>
          <div className={styles.detailTitle}>
            <span className={styles.detailEyebrow}>Transaction</span>
            <h2 className={styles.detailH2}>{transaction.description}</h2>
          </div>
          <button
            type="button"
            className={styles.detailClose}
            onClick={onClose}
            aria-label="Close detail"
          >
            <IconX size={15} stroke={2} />
          </button>
        </div>

        <div className={styles.detailBody}>
          {/* Status */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>Status</div>
            <div className={styles.detailField}>
              <span className={styles.detailFieldLabel}>Overall</span>
              <span className={styles.detailFieldValue}>
                <span
                  className={`${styles.statusPill} ${
                    transaction.status === "matched"
                      ? styles.success
                      : transaction.status === "missing_receipt"
                      ? styles.danger
                      : transaction.status === "review"
                      ? styles.warning
                      : styles.muted
                  }`}
                >
                  {STATUS_LABELS[transaction.status]?.label ?? transaction.status}
                </span>
              </span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.detailFieldLabel}>Receipt match</span>
              <span className={styles.detailFieldValue}>
                <span
                  className={`${styles.statusPill} ${
                    transaction.matchStatus === "matched"
                      ? styles.success
                      : transaction.matchStatus === "partial"
                      ? styles.warning
                      : styles.muted
                  }`}
                >
                  {transaction.matchStatus === "matched"
                    ? "Matched"
                    : transaction.matchStatus === "partial"
                    ? "Partial"
                    : "No receipt"}
                </span>
              </span>
            </div>
          </div>

          {/* Amounts */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>Amounts</div>
            <div className={styles.detailField}>
              <span className={styles.detailFieldLabel}>Amount</span>
              <span
                className={`${styles.detailFieldValue} ${
                  transaction.direction === "in" ? styles.positive : styles.negative
                }`}
              >
                {transaction.direction === "in"
                  ? `+${symbol}${Math.abs(transaction.amount).toFixed(2)}`
                  : `−${symbol}${Math.abs(transaction.amount).toFixed(2)}`}
              </span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.detailFieldLabel}>Direction</span>
              <span className={styles.detailFieldValue}>
                {transaction.direction === "in" ? "Money in" : "Money out"}
              </span>
            </div>
            {transaction.vat && (
              <div className={styles.detailField}>
                <span className={styles.detailFieldLabel}>VAT treatment</span>
                <span className={styles.detailFieldValue}>
                  <span className={`${styles.tag} ${styles.strong}`}>
                    {transaction.vat === "included"
                      ? "VAT included"
                      : transaction.vat === "excluded"
                      ? "VAT excluded"
                      : "Not applicable"}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Category */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>Category</div>
            <div className={styles.detailField}>
              <span className={styles.detailFieldLabel}>Category</span>
              <span className={`${styles.detailFieldValue} ${
                transaction.category ? "" : styles.muted
              }`}>
                {transaction.category ?? "Uncategorised"}
              </span>
            </div>
            {transaction.personal && (
              <div className={styles.detailField}>
                <span className={styles.detailFieldLabel}>Flag</span>
                <span className={styles.detailFieldValue}>
                  <span className={`${styles.tag} ${styles.amber}`}>
                    Personal / excluded
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Receipt match info */}
          {transaction.matchStatus !== "matched" && (
            <div className={styles.detailSection}>
              <div className={styles.detailSectionTitle}>What's missing</div>
              <div className={styles.callout} style={{ marginTop: 0 }}>
                <span
                  className={`${styles.calloutIcon} ${styles.exIcon} ${
                    transaction.status === "missing_receipt"
                      ? styles.red
                      : styles.amber
                  }`}
                >
                  <IconReceipt size={15} stroke={1.8} />
                </span>
                <div>
                  <strong>
                    {transaction.status === "missing_receipt"
                      ? "No receipt attached"
                      : "Receipt needs review"}
                  </strong>
                  <p style={{ margin: "5px 0 0", color: "inherit" }}>
                    {transaction.status === "missing_receipt"
                      ? "Upload a receipt or mark this as personal so it stops blocking the export."
                      : "Check the amount and date against the receipt before exporting."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.detailSection}>
            <div className={styles.detailSectionTitle}>Actions</div>
            <div className={styles.detailField}>
              <span className={styles.detailFieldLabel}></span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {onEdit && (
                  <button
                    type="button"
                    className={`${styles.btnSecondary} ${styles.sm}`}
                    onClick={onEdit}
                  >
                    <IconEdit size={13} stroke={1.8} />
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.btnGhostSmall} ${styles.sm}`}
                  onClick={() => {
                    onEdit?.();
                    onClose();
                  }}
                >
                  <IconReceipt size={13} stroke={1.8} />
                  Attach receipt
                </button>
                <button
                  type="button"
                  className={`${styles.btnDanger} ${styles.sm}`}
                  onClick={() => {
                    onEdit?.();
                    onClose();
                  }}
                >
                  <IconTrash size={13} stroke={1.8} />
                  Exclude
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


