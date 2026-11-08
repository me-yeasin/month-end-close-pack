/**
 * POST /api/ai/extract
 *
 * Server-side proxy that sends raw OCR/text-layer output from receipts to an
 * OpenAI-compatible `/chat/completions` endpoint and returns structured
 * receipt fields with confidence scores.
 *
 * Same rationale as /api/ai/analyze: browsers block cross-origin provider
 * calls (CORS), so the request is made server-side. Each call is stateless.
 * Only the small OCR text strings leave the device — never the images.
 */

import { NextResponse } from "next/server";

type Body = {
  baseUrl?: unknown;
  apiKey?: unknown;
  model?: unknown;
  receipts?: unknown;
};

interface ReceiptItem {
  id: string;
  text: string;
}

function providerError(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const err = obj.error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      const message = (err as Record<string, unknown>).message;
      if (typeof message === "string") return message;
    }
    if (typeof obj.message === "string") return obj.message;
  }
  return `Provider returned ${status}.`;
}

function extractContent(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0] as Record<string, unknown>;
  const message = first.message as Record<string, unknown> | undefined;
  if (message && typeof message.content === "string") return message.content;
  if (typeof first.text === "string") return first.text;
  return null;
}

function extractJson(content: string): unknown {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

const ALLOWED_CURRENCIES = new Set(["GBP", "EUR", "USD", "CHF", "SEK", "DKK", "NOK", "PLN"]);

function field(value: unknown, confidence: unknown): unknown {
  return {
    value: value === undefined || value === null ? null : value,
    confidence:
      typeof confidence === "number" && confidence >= 0 && confidence <= 1
        ? confidence
        : 0.5,
  };
}

function normalizeFields(raw: unknown, validIds: Set<string>): unknown[] {
  if (!raw || typeof raw !== "object") return [];
  const list = (raw as { fields?: unknown }).fields;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const o = item as Record<string, unknown>;
    if (typeof o.id !== "string" || !validIds.has(o.id)) return [];
    return [
      {
        id: o.id,
        vendor: field(o.vendor, o.vendorConfidence),
        date: field(o.date ?? null, o.dateConfidence),
        total: field(
          typeof o.total === "number" ? o.total : o.total === null ? null : Number(o.total) || null,
          o.totalConfidence,
        ),
        currency: field(
          typeof o.currency === "string" && ALLOWED_CURRENCIES.has(o.currency)
            ? o.currency
            : null,
          o.currencyConfidence,
        ),
        vat: field(
          typeof o.vat === "number" ? o.vat : o.vat === null ? null : Number(o.vat) || null,
          o.vatConfidence,
        ),
        paymentMethod: field(o.paymentMethod ?? null, o.paymentMethodConfidence),
      },
    ];
  });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const baseUrl =
    typeof body.baseUrl === "string" ? body.baseUrl.trim().replace(/\/+$/, "") : "";
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const receipts = Array.isArray(body.receipts) ? body.receipts : [];

  if (!baseUrl) {
    return NextResponse.json({ error: "Base URL is required." }, { status: 400 });
  }
  if (!model) {
    return NextResponse.json({ error: "Model is required." }, { status: 400 });
  }
  if (receipts.length === 0) {
    return NextResponse.json({ fields: [] });
  }

  let target: URL;
  try {
    target = new URL(`${baseUrl}/chat/completions`);
  } catch {
    return NextResponse.json({ error: "Invalid base URL." }, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json(
      { error: "Base URL must use http or https." },
      { status: 400 },
    );
  }

  const items = receipts.filter(
    (r): r is ReceiptItem =>
      !!r &&
      typeof r === "object" &&
      typeof (r as Record<string, unknown>).id === "string" &&
      typeof (r as Record<string, unknown>).text === "string",
  );

  const system = `You are a bookkeeping assistant extracting structured data from the raw OCR text of receipts.

For each receipt, extract:
- "vendor": the shop or company that issued the receipt
- "date": the receipt date as YYYY-MM-DD (null if not found)
- "total": the final total amount paid, as a positive number (null if not found)
- "currency": ISO code like GBP, EUR, USD (null if unclear)
- "vat": the VAT/sales tax amount as a number (null if not shown)
- "paymentMethod": e.g. "card", "cash", "bank transfer" (null if not shown)

Also give a "confidence" for every field between 0 and 1 — how sure you are the value is correct given OCR noise. Use low confidence (< 0.6) when the text is garbled, ambiguous, or you had to guess.

Return ONLY a JSON object with this exact shape:
{"fields":[{"id":"<receipt id>","vendor":"...","vendorConfidence":0.9,"date":"YYYY-MM-DD","dateConfidence":0.8,"total":12.34,"totalConfidence":0.95,"currency":"GBP","currencyConfidence":0.9,"vat":2.06,"vatConfidence":0.7,"paymentMethod":"card","paymentMethodConfidence":0.6}]}

One entry per receipt id. Use null for values you cannot find. Do not add commentary or code fences.`;

  try {
    const res = await fetch(target.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: JSON.stringify({ receipts: items }) },
        ],
      }),
      cache: "no-store",
    });

    const text = await res.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: providerError(data, res.status) },
        { status: res.status },
      );
    }

    const content = extractContent(data);
    if (!content) return NextResponse.json({ fields: [] });

    const parsed = extractJson(content);
    const validIds = new Set(items.map((i) => i.id));
    return NextResponse.json({ fields: normalizeFields(parsed, validIds) });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the provider. Check the base URL and your network." },
      { status: 502 },
    );
  }
}
