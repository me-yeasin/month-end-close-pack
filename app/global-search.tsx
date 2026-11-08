"use client";

/**
 * global-search.tsx — header search across the active month's data.
 *
 * Click the icon (or focus + Enter): an input expands in the topbar with a
 * results popover below. Follows the WAI-ARIA combobox pattern: ArrowUp/Down
 * move the active option, Enter selects it, Escape closes, click-outside
 * closes. Selecting a transaction opens the ledger with the search pre-filled;
 * selecting a receipt opens the receipt queue.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { IconSearch, IconReceipt, IconArrowUpRight, IconArrowDownLeft } from "@tabler/icons-react";
import styles from "./home.module.css";

export interface SearchableTransaction {
  id: string;
  date: string;
  description: string;
  account?: string;
  category?: string;
  amount: number;
  direction: "in" | "out";
  flagged: boolean;
}

export interface SearchableReceipt {
  id: string;
  name: string;
  vendor: string;
}

type Selection =
  | { view: "transactions"; query: string }
  | { view: "receipts" };

const MAX_PER_GROUP = 5;

export function GlobalSearch({
  transactions,
  receipts,
  currency = "GBP",
  onSelect,
}: {
  transactions: SearchableTransaction[];
  receipts: SearchableReceipt[];
  currency?: "GBP" | "EUR";
  onSelect: (target: Selection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const symbol = currency === "EUR" ? "€" : "£";

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // focus the input when the search opens (DOM-only side effect)
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const openSearch = () => {
    setQuery("");
    setActiveIdx(0);
    setOpen(true);
  };

  const txResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return transactions
      .filter((t) =>
        `${t.description} ${t.account ?? ""} ${t.category ?? ""} ${t.date}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, MAX_PER_GROUP);
  }, [query, transactions]);

  const receiptResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return receipts
      .filter((r) => `${r.name} ${r.vendor}`.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP);
  }, [query, receipts]);

  const flat = useMemo(
    () => [
      ...txResults.map((t) => ({ kind: "tx" as const, item: t })),
      ...receiptResults.map((r) => ({ kind: "receipt" as const, item: r })),
    ],
    [txResults, receiptResults],
  );

  const select = (index: number) => {
    const entry = flat[index];
    if (!entry) return;
    if (entry.kind === "tx") {
      onSelect({ view: "transactions", query: entry.item.description });
    } else {
      onSelect({ view: "receipts" });
    }
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (flat.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(activeIdx);
    }
  };

  return (
    <div className={styles.gsWrap} ref={wrapRef}>
      {!open ? (
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Search transactions and receipts"
          aria-haspopup="dialog"
          onClick={openSearch}
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
      ) : (
        <div
          className={styles.gsSearchRow}
          role="combobox"
          aria-expanded={flat.length > 0}
          aria-haspopup="listbox"
          aria-controls="global-search-results"
        >
          <IconSearch size={14} stroke={1.8} className={styles.gsSearchIcon} />
          <input
            ref={inputRef}
            type="text"
            role="searchbox"
            className={styles.gsInput}
            placeholder="Search transactions, receipts…"
            aria-label="Search transactions and receipts"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className={styles.gsClose}
            aria-label="Close search"
            onClick={() => setOpen(false)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {open && (
        <div
          className={styles.gsPopover}
          id="global-search-results"
          role="listbox"
          aria-label="Search results"
        >
          {!query.trim() ? (
            <div className={styles.gsEmpty}>
              Type to search across this month&rsquo;s transactions and
              receipts.
            </div>
          ) : flat.length === 0 ? (
            <div className={styles.gsEmpty}>No matches found.</div>
          ) : (
            <>
              {txResults.length > 0 && (
                <>
                  <div className={styles.gsGroupLabel}>Transactions</div>
                  {txResults.map((t) => {
                    const idx = flat.findIndex(
                      (f) => f.kind === "tx" && f.item.id === t.id,
                    );
                    const isIn = t.direction === "in";
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="option"
                        aria-selected={idx === activeIdx}
                        className={`${styles.gsItem} ${
                          idx === activeIdx ? styles.gsItemActive : ""
                        }`}
                        onClick={() => select(idx)}
                        onMouseEnter={() => setActiveIdx(idx)}
                      >
                        <span
                          className={`${styles.txIcon} ${
                            isIn ? styles.txIconIn : styles.txIconOut
                          }`}
                          style={{ width: 26, height: 26, borderRadius: 8 }}
                        >
                          {isIn ? (
                            <IconArrowDownLeft size={13} stroke={2} />
                          ) : (
                            <IconArrowUpRight size={13} stroke={2} />
                          )}
                        </span>
                        <span className={styles.gsItemText}>
                          <span className={styles.gsItemTitle}>{t.description}</span>
                          <span className={styles.gsItemMeta}>
                            {t.date}
                            {t.category ? ` · ${t.category}` : ""}
                            {t.flagged ? " · flagged" : ""}
                          </span>
                        </span>
                        <span className={styles.gsAmount}>
                          {isIn ? "+" : "−"}
                          {symbol}
                          {Math.abs(t.amount).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
              {receiptResults.length > 0 && (
                <>
                  <div className={styles.gsGroupLabel}>Receipts</div>
                  {receiptResults.map((r) => {
                    const idx = flat.findIndex(
                      (f) => f.kind === "receipt" && f.item.id === r.id,
                    );
                    return (
                      <button
                        key={r.id}
                        type="button"
                        role="option"
                        aria-selected={idx === activeIdx}
                        className={`${styles.gsItem} ${
                          idx === activeIdx ? styles.gsItemActive : ""
                        }`}
                        onClick={() => select(idx)}
                        onMouseEnter={() => setActiveIdx(idx)}
                      >
                        <span
                          className={`${styles.txIcon} ${styles.txIconOut}`}
                          style={{ width: 26, height: 26, borderRadius: 8 }}
                        >
                          <IconReceipt size={13} stroke={1.8} />
                        </span>
                        <span className={styles.gsItemText}>
                          <span className={styles.gsItemTitle}>{r.name}</span>
                          <span className={styles.gsItemMeta}>
                            {r.vendor || "Receipt"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
