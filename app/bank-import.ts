/**
 * bank-import.ts — bank statement parsing + AI analysis client.
 *
 * Everything here is deterministic until `analyzeChunk`, which sends a small
 * batch of normalized rows to our server proxy. Parsing, de-duplication and
 * chunking never touch the network.
 */

import { newId, type TransactionRecord } from "./db";

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface Flag {
  id: string;
  type: string;
  severity: "high" | "medium" | "low";
  reason: string;
}

const SHORT_MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Parse a CSV string into rows of trimmed strings, handling quotes + delimiters. */
export function parseCsv(text: string): string[][] {
  const firstBreak = text.indexOf("\n");
  const firstLine = firstBreak === -1 ? text : text.slice(0, firstBreak);
  const candidates = [",", ";", "\t", "|"];
  let delimiter = ",";
  let best = -1;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > best) {
      best = count;
      delimiter = d;
    }
  }

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.map((r) => r.map((c) => c.trim()));
}

/** Parse a date in common bank formats to ISO (YYYY-MM-DD). */
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const numeric = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/.exec(s);
  if (numeric) {
    const a = Number(numeric[1]);
    const b = Number(numeric[2]);
    let y = Number(numeric[3]);
    if (y < 100) y += 2000;
    let day: number;
    let month: number;
    if (a > 12) {
      day = a;
      month = b;
    } else if (b > 12) {
      month = a;
      day = b;
    } else {
      // Ambiguous — default to day-first (UK/Europe).
      day = a;
      month = b;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y}-${pad(month)}-${pad(day)}`;
  }

  const named = /^(\d{1,2})\s+([A-Za-z]{3,})\.?\s+(\d{2,4})$/.exec(s);
  if (named) {
    const month = SHORT_MONTHS.indexOf(named[2].slice(0, 3).toLowerCase());
    let y = Number(named[3]);
    if (y < 100) y += 2000;
    if (month >= 0) return `${y}-${pad(month + 1)}-${pad(Number(named[1]))}`;
  }

  const fallback = new Date(s);
  if (!Number.isNaN(fallback.getTime())) {
    return `${fallback.getFullYear()}-${pad(fallback.getMonth() + 1)}-${pad(fallback.getDate())}`;
  }
  return null;
}

/** Parse a money string to a number (handles £, €, commas, parentheses). */
export function parseAmount(raw: string): number | null {
  let s = raw.trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[^0-9.,\-+]/g, "");
  if (!s) return null;

  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    const parts = s.split(",");
    if (parts[parts.length - 1].length === 2) {
      s = `${parts.slice(0, -1).join("")}.${parts[parts.length - 1]}`;
    } else {
      s = s.replace(/,/g, "");
    }
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -Math.abs(n) : n;
}

interface ColumnMap {
  date: number;
  description: number;
  amount: number;
  debit: number;
  credit: number;
}

function detectColumns(headers: string[]): ColumnMap {
  const find = (re: RegExp) => headers.findIndex((h) => re.test(h));
  return {
    date: find(/date|posted|value date|when/i),
    description: find(/description|details|narrative|reference|payee|merchant|memo|particulars/i),
    amount: find(/amount|value(?!\s*date)|sum|total/i),
    debit: find(/debit|paid out|money out|withdrawal/i),
    credit: find(/credit|paid in|money in|deposit/i),
  };
}

/** Read + parse bank statement files into de-duplicated transactions. */
export async function parseBankFiles(
  files: File[],
  workspaceId: string,
  month: number,
  year: number,
): Promise<TransactionRecord[]> {
  const all: TransactionRecord[] = [];

  for (const file of files) {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) continue;

    let headerIdx = 0;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      if (rows[i].filter((c) => c !== "").length >= 2) {
        headerIdx = i;
        break;
      }
    }

    const map = detectColumns(rows[headerIdx] ?? []);
    const dateIdx = map.date >= 0 ? map.date : 0;
    const descIdx = map.description >= 0 ? map.description : 1;

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (row.every((c) => c === "")) continue;

      const date = parseDate(row[dateIdx] ?? "");
      const description = (row[descIdx] ?? "").trim();
      let amount: number | null = null;

      if (map.amount >= 0) amount = parseAmount(row[map.amount] ?? "");
      if (amount === null && map.debit >= 0 && (row[map.debit] ?? "").trim() !== "") {
        const d = parseAmount(row[map.debit] ?? "");
        if (d !== null) amount = -Math.abs(d);
      }
      if (amount === null && map.credit >= 0 && (row[map.credit] ?? "").trim() !== "") {
        const c = parseAmount(row[map.credit] ?? "");
        if (c !== null) amount = Math.abs(c);
      }

      if (!date || amount === null || !description) continue;

      const direction: "in" | "out" = amount < 0 ? "out" : "in";
      const fingerprint = `${date}|${description.toLowerCase()}|${amount.toFixed(2)}`;

      all.push({
        id: newId(),
        workspaceId,
        month,
        year,
        date,
        description,
        amount,
        direction,
        account: "",
        sourceFile: file.name,
        originalRow: r + 1,
        fingerprint,
        flag: null,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const seen = new Set<string>();
  return all.filter((t) => {
    if (seen.has(t.fingerprint)) return false;
    seen.add(t.fingerprint);
    return true;
  });
}

/** Split items into fixed-size batches. */
export function chunkTransactions<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

const ALLOWED_TYPES = new Set([
  "possible_personal",
  "duplicate_transaction",
  "foreign_currency",
  "uncategorised",
]);

function isFlag(value: unknown, validIds: Set<string>): value is Flag {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    validIds.has(o.id) &&
    typeof o.type === "string" &&
    typeof o.reason === "string"
  );
}

/** Send one batch to the server proxy and return validated flags. */
export async function analyzeChunk(
  config: AiConfig,
  transactions: TransactionRecord[],
): Promise<Flag[]> {
  const res = await fetch("/api/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        direction: t.direction,
      })),
    }),
  });

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      json &&
      typeof json === "object" &&
      typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : `AI request failed (${res.status}).`;
    throw new Error(message);
  }

  const validIds = new Set(transactions.map((t) => t.id));
  const raw =
    json && typeof json === "object" && Array.isArray((json as { flags?: unknown }).flags)
      ? ((json as { flags: unknown[] }).flags)
      : [];

  return raw.filter((f): f is Flag => isFlag(f, validIds)).map((f) => ({
    id: f.id,
    type: ALLOWED_TYPES.has(f.type) ? f.type : "uncategorised",
    severity:
      f.severity === "high" || f.severity === "medium" || f.severity === "low"
        ? f.severity
        : "medium",
    reason: f.reason,
  }));
}
