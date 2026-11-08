/**
 * matching.ts — matches extracted receipts to bank transactions.
 *
 * Strategy (per BUILD_PLAN step 6):
 *  - exact: same amount (±0.02), date within 0–2 days, vendor similarity ≥ 0.5
 *  - fuzzy: amount ±0.02, date within 5 days, vendor similarity ≥ 0.3
 *  - greedy assignment: highest-confidence pairs first, one transaction per
 *    receipt and one receipt per transaction
 *
 * Confidence blends vendor similarity, date proximity and amount proximity
 * into a single 0–1 score so the UI can rank and filter matches.
 */

import type { ReceiptRecord, TransactionRecord } from "./db";

export interface MatchSuggestion {
  receiptId: string;
  transactionId: string;
  matchType: "exact" | "fuzzy";
  confidence: number; // 0–1
}

const AMOUNT_TOLERANCE = 0.02;
const EXACT_DATE_WINDOW = 2;
const FUZZY_DATE_WINDOW = 5;
const EXACT_VENDOR_SIM = 0.5;
const FUZZY_VENDOR_SIM = 0.3;

function normalizeVendor(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (t) =>
        t.length > 1 &&
        !["ltd", "limited", "the", "and", "shop", "store", "uk"].includes(t),
    );
}

/** Token-overlap similarity between two vendor names, 0–1. */
export function vendorSimilarity(a: string, b: string): number {
  const ta = new Set(normalizeVendor(a));
  const tb = new Set(normalizeVendor(b));
  if (ta.size === 0 || tb.size === 0) return 0;

  // Measure how much of the receipt's (clean) vendor name appears inside the
  // (noisy) bank description — bank rows carry store numbers, branches etc.,
  // so penalising by the description length would be wrong.
  let overlap = 0;
  for (const t of ta) {
    if (tb.has(t)) overlap += 1;
    else {
      // partial token match (e.g. "tesco" vs "tescostores")
      for (const u of tb) {
        if (t.length >= 4 && u.length >= 4 && (t.startsWith(u) || u.startsWith(t))) {
          overlap += 0.5;
          break;
        }
      }
    }
  }
  return Math.min(1, overlap / ta.size);
}

function dateDiffDays(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`);
  const db = new Date(`${b}T00:00:00`);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return 999;
  return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000));
}

function isMatchableReceipt(r: ReceiptRecord): boolean {
  return (
    !r.duplicate &&
    !r.matchId &&
    (r.status === "extracted" || r.status === "needs_review") &&
    r.extracted?.total.value != null
  );
}

function isMatchableTransaction(t: TransactionRecord): boolean {
  return !t.matchId && t.direction === "out";
}

/**
 * Match extracted receipts to bank transactions.
 * Returns one suggestion per matchable receipt (at most).
 */
export function autoMatch(
  receipts: ReceiptRecord[],
  transactions: TransactionRecord[],
): MatchSuggestion[] {
  const candidates = transactions.filter(isMatchableTransaction);
  const suggestions: MatchSuggestion[] = [];

  for (const receipt of receipts.filter(isMatchableReceipt)) {
    const total = receipt.extracted!.total.value!;
    const receiptDate = receipt.extracted!.date.value ?? receipt.createdAt.slice(0, 10);

    let best: MatchSuggestion | null = null;
    for (const tx of candidates) {
      if (Math.abs(Math.abs(tx.amount) - total) > AMOUNT_TOLERANCE) continue;

      const diff = dateDiffDays(receiptDate, tx.date);
      if (diff > FUZZY_DATE_WINDOW) continue;

      const sim = vendorSimilarity(
        receipt.extracted!.vendor.value,
        tx.description,
      );

      // exact: close date + confident vendor; fuzzy: wider window, weaker vendor
      let matchType: "exact" | "fuzzy" | null = null;
      if (diff <= EXACT_DATE_WINDOW && sim >= EXACT_VENDOR_SIM) {
        matchType = "exact";
      } else if (diff <= FUZZY_DATE_WINDOW && sim >= FUZZY_VENDOR_SIM) {
        matchType = "fuzzy";
      }
      if (!matchType) continue;

      const confidence = Math.min(
        1,
        0.55 * sim +
          0.3 * (1 - diff / (FUZZY_DATE_WINDOW + 1)) +
          0.15 *
            (1 -
              Math.abs(Math.abs(tx.amount) - total) /
                Math.max(AMOUNT_TOLERANCE, total)),
      );

      if (!best || confidence > best.confidence) {
        best = {
          receiptId: receipt.id,
          transactionId: tx.id,
          matchType,
          confidence,
        };
      }
    }
    if (best) suggestions.push(best);
  }

  // greedy assignment: strongest pairs claim their transaction first
  suggestions.sort((a, b) => b.confidence - a.confidence);
  const usedTransactions = new Set<string>();
  const usedReceipts = new Set<string>();
  const accepted: MatchSuggestion[] = [];

  for (const s of suggestions) {
    if (usedTransactions.has(s.transactionId)) continue;
    if (usedReceipts.has(s.receiptId)) continue;
    usedTransactions.add(s.transactionId);
    usedReceipts.add(s.receiptId);
    accepted.push(s);
  }

  return accepted;
}
