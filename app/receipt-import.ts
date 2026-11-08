/**
 * receipt-import.ts — local receipt extraction pipeline.
 *
 * Two-stage approach (per research on real-world receipt pipelines):
 *  1. LOCAL extraction — free + private:
 *     - PDF: try the embedded text layer first (pdf.js). Pages without a text
 *       layer (scanned PDFs) are rendered to images.
 *     - Images + rendered pages: tesseract.js OCR in the browser.
 *  2. LLM structuring — the small raw text strings (never the images) are
 *     sent through /api/ai/extract to become structured fields with
 *     confidence scores.
 *
 * Heavy dependencies (pdfjs-dist, tesseract.js) are dynamically imported so
 * they stay out of the initial bundle.
 */

import type { ExtractedReceipt } from "./db";

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/** A page's text either came from the PDF text layer or from OCR. */
interface PageText {
  text: string;
  ocrConfidence: number | null; // null = came from the PDF text layer
}

export interface ExtractionResult {
  pageCount: number;
  pages: PageText[];
  text: string;
  /** Mean OCR confidence across OCR'd pages; null when none were OCR'd. */
  ocrConfidence: number | null;
}

/** SHA-256 of the file contents, hex-encoded — used for de-duplication. */
export async function hashFile(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** A page is "text-less" (scanned) below this many extracted characters. */
const TEXT_LAYER_MIN_CHARS = 20;

/** OCR a single image blob with tesseract.js. */
async function ocrBlob(
  blob: Blob,
  onProgress?: (pct: number) => void,
): Promise<{ text: string; confidence: number }> {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("eng");
  try {
    const result = await worker.recognize(blob);
    return {
      text: result.data.text ?? "",
      confidence: Math.min(1, Math.max(0, (result.data.confidence ?? 0) / 100)),
    };
  } finally {
    await worker.terminate();
  }
}

/** Render one PDF page to a PNG blob at 2× scale for better OCR. */
async function renderPageToBlob(
  page: import("pdfjs-dist").PDFPageProxy,
): Promise<Blob> {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not render PDF page."))),
      "image/png",
    );
  });
}

/** Extract raw text from a PDF: text layer first, OCR fallback per page. */
async function extractPdf(
  file: Blob,
  onProgress?: (pct: number) => void,
): Promise<ExtractionResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: PageText[] = [];
  const ocrConfidences: number[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const layerText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (layerText.length >= TEXT_LAYER_MIN_CHARS) {
      pages.push({ text: layerText, ocrConfidence: null });
    } else {
      const image = await renderPageToBlob(page);
      const { text, confidence } = await ocrBlob(image);
      pages.push({ text, ocrConfidence: confidence });
      ocrConfidences.push(confidence);
    }
    onProgress?.(Math.round((pageNum / doc.numPages) * 100));
    page.cleanup();
  }

  return {
    pageCount: doc.numPages,
    pages,
    text: pages.map((p) => p.text).filter(Boolean).join("\n\n"),
    ocrConfidence: ocrConfidences.length
      ? ocrConfidences.reduce((a, b) => a + b, 0) / ocrConfidences.length
      : null,
  };
}

/** Extract raw text from an image receipt (JPG/PNG). */
async function extractImage(
  file: Blob,
  onProgress?: (pct: number) => void,
): Promise<ExtractionResult> {
  const { text, confidence } = await ocrBlob(file, onProgress);
  return {
    pageCount: 1,
    pages: [{ text, ocrConfidence: confidence }],
    text,
    ocrConfidence: confidence,
  };
}

/** Extract raw text from any supported receipt file. */
export async function extractReceiptText(
  file: Blob,
  mimeType: string,
  onProgress?: (pct: number) => void,
): Promise<ExtractionResult> {
  if (mimeType === "application/pdf") {
    return extractPdf(file, onProgress);
  }
  return extractImage(file, onProgress);
}

/* ------------------------------------------------------------------ */
/* LLM structuring                                                     */
/* ------------------------------------------------------------------ */

export interface StructuredReceipt {
  id: string;
  fields: ExtractedReceipt;
}

interface RawField {
  value: unknown;
  confidence: unknown;
}

function coerceField(raw: unknown): { value: unknown; confidence: number } {
  const f = (raw ?? {}) as RawField;
  return {
    value: f.value === undefined ? null : f.value,
    confidence:
      typeof f.confidence === "number" && f.confidence >= 0 && f.confidence <= 1
        ? f.confidence
        : 0.5,
  };
}

/** Mean confidence across the extracted fields (0–1). */
export function meanFieldConfidence(fields: ExtractedReceipt): number {
  const values = [
    fields.vendor.confidence,
    fields.date.confidence,
    fields.total.confidence,
    fields.currency.confidence,
    fields.vat.confidence,
    fields.paymentMethod.confidence,
  ];
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Send OCR text for a batch of receipts through the server proxy. */
export async function structureReceipts(
  config: AiConfig,
  items: { id: string; text: string }[],
): Promise<StructuredReceipt[]> {
  const res = await fetch("/api/ai/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      receipts: items.map((i) => ({
        id: i.id,
        // keep the prompt small: cap each text at ~4k chars
        text: i.text.slice(0, 4000),
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

  const raw =
    json && typeof json === "object" && Array.isArray((json as { fields?: unknown }).fields)
      ? (json as { fields: unknown[] }).fields
      : [];

  const out: StructuredReceipt[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.id !== "string") continue;

    const vendor = coerceField(o.vendor);
    const date = coerceField(o.date);
    const total = coerceField(o.total);
    const currency = coerceField(o.currency);
    const vat = coerceField(o.vat);
    const paymentMethod = coerceField(o.paymentMethod);

    out.push({
      id: o.id,
      fields: {
        vendor: {
          value: typeof vendor.value === "string" ? vendor.value : "",
          confidence: vendor.confidence,
        },
        date: {
          value:
            typeof date.value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.value)
              ? date.value
              : null,
          confidence: date.confidence,
        },
        total: {
          value: typeof total.value === "number" ? total.value : null,
          confidence: total.confidence,
        },
        currency: {
          value: typeof currency.value === "string" ? currency.value : "",
          confidence: currency.confidence,
        },
        vat: {
          value: typeof vat.value === "number" ? vat.value : null,
          confidence: vat.confidence,
        },
        paymentMethod: {
          value:
            typeof paymentMethod.value === "string" ? paymentMethod.value : null,
          confidence: paymentMethod.confidence,
        },
      },
    });
  }
  return out;
}
