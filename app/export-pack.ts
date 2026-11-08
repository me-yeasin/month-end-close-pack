/**
 * export-pack.ts — builds the accountant pack ZIP entirely in the browser.
 *
 * Best practices followed:
 *  - Heavy libraries (jszip, xlsx, jspdf, jspdf-autotable) are dynamically
 *    imported inside the builder so they never enter the initial bundle.
 *  - Pure data-in/data-out: takes store records + the derived summary,
 *    returns download metadata; all UI state stays in the component.
 *  - Downloads go through a temporary object URL that is always revoked.
 *  - The `receipts` input is already part of the contract — the receipt
 *    pipeline can start feeding files without touching this module.
 */

import type { ImportJobRecord, TransactionRecord } from "./db";
import type { SummaryData } from "./summary";

export type PackPreset = "accountant" | "spreadsheet" | "review";

export interface PackReceipt {
  /** Final file name inside receipts/ (date-vendor-amount naming). */
  name: string;
  data: Blob | Uint8Array | ArrayBuffer;
}

export interface PackInput {
  preset: PackPreset;
  transactions: TransactionRecord[];
  summary: SummaryData;
  job: ImportJobRecord | null;
  workspaceId: string;
  monthLabel: string;
  /** "2026-11" style id used in the file name. */
  monthId: string;
  currency: "GBP" | "EUR";
  /** Receipt files to include under receipts/ (empty until the pipeline exists). */
  receipts?: PackReceipt[];
}

export interface PackResult {
  fileName: string;
  fileCount: number;
}

const FLAG_LABELS: Record<string, string> = {
  possible_personal: "Possible personal",
  duplicate_transaction: "Duplicate transaction",
  duplicate_receipt: "Duplicate receipt",
  foreign_currency: "Foreign currency",
  uncategorised: "Uncategorised",
  missing_receipt: "Missing receipt",
  amount_mismatch: "Amount mismatch",
  low_confidence: "Low confidence",
};

function money(symbol: string, v: number): string {
  return `${symbol}${v.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/* ------------------------------------------------------------------ */
/* Ledger (shared by XLSX and CSV)                                     */
/* ------------------------------------------------------------------ */

const LEDGER_HEAD = [
  "Date",
  "Description",
  "Amount",
  "Direction",
  "Account",
  "Category",
  "VAT",
  "Status",
  "Source file",
  "Row",
];

function ledgerRows(transactions: TransactionRecord[]): (string | number)[][] {
  const sorted = [...transactions].sort((a, b) =>
    a.date === b.date
      ? a.description.localeCompare(b.description)
      : a.date.localeCompare(b.date),
  );
  return sorted.map((t) => [
    t.date,
    t.description,
    t.amount, // signed number — accountants can compute with it
    t.direction === "in" ? "Money in" : "Money out",
    t.account || "",
    t.category || "",
    t.vatTreatment
      ? t.vatTreatment === "included"
        ? "Included"
        : t.vatTreatment === "excluded"
          ? "Excluded"
          : "Not applicable"
      : "",
    t.flag ? "Needs review" : (t.reviewState ?? "Clean"),
    t.sourceFile,
    t.originalRow,
  ]);
}

function exceptionsCsv(transactions: TransactionRecord[]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    "date,type,severity,description,reason,amount,category",
    ...transactions
      .filter((t) => t.flag)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) =>
        [
          t.date,
          FLAG_LABELS[t.flag!.type] ?? t.flag!.type,
          t.flag!.severity,
          t.description,
          t.flag!.reason,
          t.amount.toFixed(2),
          t.category ?? "",
        ]
          .map(esc)
          .join(","),
      ),
  ];
  return lines.join("\n");
}

/* ------------------------------------------------------------------ */
/* One-page summary PDF                                                */
/* ------------------------------------------------------------------ */

async function buildSummaryPdf(input: PackInput): Promise<ArrayBuffer> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const { summary } = input;
  const symbol = input.currency === "EUR" ? "€" : "£";

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;

  // header band
  doc.setFillColor(23, 63, 51); // forest
  doc.rect(0, 0, pageWidth, 86, "F");
  doc.setTextColor(243, 237, 220);
  doc.setFont("times", "italic");
  doc.setFontSize(22);
  doc.text("Month-End Pack", margin, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(240, 200, 119); // amber
  doc.text(summary.monthLabel, margin, 64);
  doc.setTextColor(243, 237, 220);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    pageWidth - margin,
    42,
    { align: "right" },
  );
  doc.text(`${input.preset} pack`, pageWidth - margin, 64, { align: "right" });

  // totals row
  let y = 130;
  doc.setTextColor(24, 36, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const cols = [
    { label: "MONEY IN", value: money(symbol, summary.totalIn), x: margin },
    { label: "MONEY OUT", value: money(symbol, summary.totalOut), x: margin + 180 },
    { label: "NET", value: money(symbol, summary.net), x: margin + 360 },
  ];
  for (const c of cols) {
    doc.setTextColor(124, 133, 125);
    doc.setFontSize(8);
    doc.text(c.label, c.x, y);
    doc.setTextColor(24, 36, 30);
    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.text(c.value, c.x, y + 20);
    doc.setFont("helvetica", "normal");
  }
  y += 48;

  // categories table
  if (summary.categories.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(24, 36, 30);
    doc.text("Where it went", margin, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      head: [["Category", "Amount", "% of spending"]],
      body: summary.categories.map((c) => [
        c.name,
        money(symbol, c.amount),
        `${c.pct}%`,
      ]),
      theme: "striped",
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [23, 63, 51], textColor: [243, 237, 220] },
      alternateRowStyles: { fillColor: [248, 245, 236] },
      styles: { fontSize: 9, cellPadding: 5 },
    });
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY;
    y = (finalY ?? y) + 28;
  }

  // blockers table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(24, 36, 30);
  doc.text("Exceptions", margin, Math.min(y, 700));
  y += 8;
  if (summary.blockers.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Issue", "Items", "Value"]],
      body: summary.blockers.map((b) => [
        b.label,
        String(b.count),
        b.value !== undefined ? money(symbol, b.value) : "",
      ]),
      theme: "striped",
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [140, 58, 40], textColor: [243, 237, 220] },
      alternateRowStyles: { fillColor: [244, 225, 219] },
      styles: { fontSize: 9, cellPadding: 5 },
    });
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(44, 114, 81);
    doc.text("No blockers — every item has been reviewed.", margin, y + 14);
  }

  // footer note
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(124, 133, 125);
  doc.text(
    "Generated locally by Month-End Pack. A simple summary to help your accountant — not a formal VAT calculation.",
    margin,
    pageHeight - 28,
  );

  return doc.output("arraybuffer");
}

/* ------------------------------------------------------------------ */
/* README + audit                                                      */
/* ------------------------------------------------------------------ */

function buildReadme(input: PackInput, files: string[]): string {
  const { summary } = input;
  const lines = [
    "MONTH-END PACK",
    "==============",
    "",
    `Month: ${summary.monthLabel}`,
    `Generated: ${new Date().toISOString()}`,
    `Preset: ${input.preset}`,
    "",
    "CONTENTS",
    "--------",
    ...files.map((f) => ` - ${f}`),
    "",
    "FIGURES",
    "-------",
    ` Transactions: ${input.transactions.length}`,
    ` Money in:     ${money(input.currency === "EUR" ? "€" : "£", summary.totalIn)}`,
    ` Money out:    ${money(input.currency === "EUR" ? "€" : "£", summary.totalOut)}`,
    ` Net:          ${money(input.currency === "EUR" ? "€" : "£", summary.net)}`,
    ` Readiness:    ${summary.readiness}%`,
    ` Open flags:   ${summary.blockers.reduce((n, b) => n + b.count, 0)}`,
  ];
  if (summary.vat.included === 0 && summary.vat.excluded === 0) {
    lines.push(
      "",
      "NOTE",
      "----",
      " VAT figures are not included yet: no VAT treatment has been",
      " assigned to the transactions in this month.",
    );
  }
  if ((input.receipts?.length ?? 0) === 0) {
    lines.push(
      "",
      " The receipts/ folder is omitted because no receipts were",
      " imported for this month.",
    );
  }
  lines.push(
    "",
    "PRIVACY",
    "-------",
    " This pack was built entirely on this device. Nothing was",
    " uploaded anywhere.",
    "",
  );
  return lines.join("\n");
}

function buildAuditJson(input: PackInput): string {
  const { job, summary } = input;
  return JSON.stringify(
    {
      app: "Month-End Pack",
      generatedAt: new Date().toISOString(),
      preset: input.preset,
      month: {
        workspaceId: input.workspaceId,
        label: input.monthLabel,
        currency: input.currency,
      },
      import: job
        ? {
            files: job.files,
            status: job.status,
            startedAt: job.createdAt,
            finishedAt: job.updatedAt,
            totalTransactions: job.totalTransactions,
            totalFlagged: job.totalFlagged,
            failedBatches: job.failedBatches ?? 0,
          }
        : null,
      summary: {
        totalIn: summary.totalIn,
        totalOut: summary.totalOut,
        net: summary.net,
        readiness: summary.readiness,
        counts: summary.counts,
        blockers: summary.blockers,
      },
      transactions: input.transactions.map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        direction: t.direction,
        account: t.account,
        sourceFile: t.sourceFile,
        originalRow: t.originalRow,
        fingerprint: t.fingerprint,
        flag: t.flag,
        review: t.reviewState ?? (t.flag ? "pending" : "clean"),
        categoryId: t.categoryId ?? null,
        category: t.category ?? null,
        vatTreatment: t.vatTreatment ?? null,
        createdAt: t.createdAt,
      })),
    },
    null,
    2,
  );
}

/* ------------------------------------------------------------------ */
/* Main builder                                                        */
/* ------------------------------------------------------------------ */

export async function buildExportPack(input: PackInput): Promise<PackResult> {
  // dynamic imports — heavy deps stay out of the initial bundle
  const [{ default: JSZip }, XLSX] = await Promise.all([
    import("jszip"),
    import("xlsx"),
  ]);

  const files: {
    name: string;
    data: string | ArrayBuffer | Uint8Array | Blob;
  }[] = [];

  if (input.preset !== "review") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([LEDGER_HEAD, ...ledgerRows(input.transactions)]);
    ws["!cols"] = [
      { wch: 11 }, // date
      { wch: 38 }, // description
      { wch: 10 }, // amount
      { wch: 10 }, // direction
      { wch: 16 }, // account
      { wch: 22 }, // category
      { wch: 12 }, // vat
      { wch: 13 }, // status
      { wch: 22 }, // source file
      { wch: 6 }, // row
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    files.push({
      name: "transactions.xlsx",
      data: XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer,
    });
    if (input.preset === "spreadsheet") {
      files.push({ name: "transactions.csv", data: XLSX.utils.sheet_to_csv(ws) });
    }
  }

  if (input.preset === "accountant") {
    files.push({ name: "summary.pdf", data: await buildSummaryPdf(input) });
  }

  if (input.preset !== "spreadsheet") {
    files.push({ name: "exceptions.csv", data: exceptionsCsv(input.transactions) });
  }

  if (input.preset === "accountant" || input.preset === "review") {
    files.push({ name: "audit.json", data: buildAuditJson(input) });
  }

  if ((input.receipts?.length ?? 0) > 0) {
    for (const r of input.receipts!) {
      files.push({ name: `receipts/${r.name}`, data: r.data });
    }
  }

  files.push({
    name: "README.txt",
    data: buildReadme(input, files.map((f) => f.name)),
  });

  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.name, f.data);
  }
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const fileName = `Month-End-Pack-${input.monthId}.zip`;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { fileName, fileCount: files.length };
}
