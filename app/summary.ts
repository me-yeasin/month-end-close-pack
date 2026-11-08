/**
 * summary.ts — derives the month summary from imported transactions.
 *
 * Pure functions only: no store access, no DOM. `page.tsx` calls
 * `buildSummary` on render and passes the result to `MonthSummaryScreen`.
 *
 * Definitions (kept consistent with the overview screen):
 *  - flagged     = transactions whose AI flag is still set (unresolved)
 *  - readiness   = share of transactions without an unresolved flag
 *  - uncategorised = transactions without an assigned category
 *  - VAT totals stay zero until transactions carry a vatTreatment
 */

import type { TransactionRecord } from "./db";

export interface SummaryCategory {
  name: string;
  amount: number;
  pct: number;
  color: string;
}

export interface SummaryBlocker {
  label: string;
  count: number;
  value?: number;
}

export interface SummaryData {
  monthLabel: string;
  currency: "GBP" | "EUR";
  totalIn: number;
  totalOut: number;
  net: number;
  categories: SummaryCategory[];
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
  blockers: SummaryBlocker[];
}

const FLAG_LABELS: Record<string, string> = {
  possible_personal: "Possible personal expenses",
  duplicate_transaction: "Possible duplicates",
  duplicate_receipt: "Duplicate receipts",
  foreign_currency: "Foreign currency",
  uncategorised: "Uncategorised items",
  missing_receipt: "Missing receipts",
  amount_mismatch: "Amount mismatches",
  low_confidence: "Low confidence items",
};

const CATEGORY_COLORS = [
  "#2a6350",
  "#e7b24a",
  "#3e6b8a",
  "#8c3a28",
  "#4c8b6a",
  "#7c857d",
  "#b5893a",
];

/** Max categories shown in the "Where it went" chart; the rest collapse. */
const MAX_CATEGORIES = 6;

export function buildSummary(
  transactions: TransactionRecord[],
  monthLabel: string,
  currency: "GBP" | "EUR",
): SummaryData {
  let totalIn = 0;
  let totalOut = 0;
  for (const t of transactions) {
    if (t.amount >= 0) totalIn += t.amount;
    else totalOut += Math.abs(t.amount);
  }

  const flagged = transactions.filter((t) => t.flag);

  // group unresolved flags by type → blockers
  const byFlagType = new Map<string, { count: number; value: number }>();
  for (const t of flagged) {
    const entry = byFlagType.get(t.flag!.type) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += Math.abs(t.amount);
    byFlagType.set(t.flag!.type, entry);
  }
  const blockers: SummaryBlocker[] = [...byFlagType.entries()]
    .map(([type, { count, value }]) => ({
      label: FLAG_LABELS[type] ?? type,
      count,
      value,
    }))
    .sort((a, b) => b.count - a.count);

  // spending grouped by category (money out only — "where it went")
  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.amount >= 0 || !t.category) continue;
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  const categories: SummaryCategory[] = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORIES)
    .map(([name, amount], i) => ({
      name,
      amount,
      pct: totalOut > 0 ? Math.round((amount / totalOut) * 100) : 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  const duplicates = byFlagType.get("duplicate_transaction")?.count ?? 0;
  const uncategorised = transactions.filter((t) => !t.categoryId).length;

  return {
    monthLabel,
    currency,
    totalIn,
    totalOut,
    net: totalIn - totalOut,
    categories,
    // No VAT amounts can be derived until receipts / VAT treatment UI exists.
    vat: { included: 0, excluded: 0, rate: 0, net: 0 },
    counts: {
      missingReceipts: 0,
      unmatchedReceipts: 0,
      duplicates,
      uncategorised,
      lowConfidence: 0,
    },
    readiness:
      transactions.length > 0
        ? Math.round(((transactions.length - flagged.length) / transactions.length) * 100)
        : 0,
    blockers,
  };
}
