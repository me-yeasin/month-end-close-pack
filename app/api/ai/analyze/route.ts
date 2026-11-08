/**
 * POST /api/ai/analyze
 *
 * Server-side proxy that sends one small batch of bank transactions to an
 * OpenAI-compatible `/chat/completions` endpoint and returns structured flags.
 *
 * Why a proxy: browsers block cross-origin calls to most providers (CORS), so
 * the request is made server-side. Each call is stateless — no conversation
 * history is carried — which keeps every request inside the model's context
 * window.
 */

import { NextResponse } from "next/server";

type Body = {
  baseUrl?: unknown;
  apiKey?: unknown;
  model?: unknown;
  transactions?: unknown;
};

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

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const baseUrl =
    typeof body.baseUrl === "string"
      ? body.baseUrl.trim().replace(/\/+$/, "")
      : "";
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const transactions = Array.isArray(body.transactions) ? body.transactions : [];

  if (!baseUrl) {
    return NextResponse.json({ error: "Base URL is required." }, { status: 400 });
  }
  if (!model) {
    return NextResponse.json({ error: "Model is required." }, { status: 400 });
  }
  if (transactions.length === 0) {
    return NextResponse.json({ flags: [] });
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

  const system = `You are a bookkeeping assistant reviewing bank transactions for a small business. Flag transactions that a human should review.

Flag types (use exactly one per flagged transaction):
- "possible_personal": looks like a personal, non-business expense
- "duplicate_transaction": looks like a duplicate of another transaction in this batch
- "foreign_currency": the amount appears to be in a foreign currency
- "uncategorised": the vendor or description is unclear, the amount looks unusual, or it looks like a transfer between the owner's own accounts

Return ONLY a JSON object with this exact shape:
{"flags":[{"id":"<transaction id>","type":"<one of the four types>","severity":"high|medium|low","reason":"<one short sentence>"}]}

Only include transactions that should be flagged. If nothing should be flagged, return {"flags":[]}. Do not add commentary or code fences.`;

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
          { role: "user", content: JSON.stringify({ transactions }) },
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
    if (!content) return NextResponse.json({ flags: [] });

    const parsed = extractJson(content);
    const flags =
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { flags?: unknown }).flags)
        ? (parsed as { flags: unknown[] }).flags
        : [];

    return NextResponse.json({ flags });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the provider. Check the base URL and your network." },
      { status: 502 },
    );
  }
}
