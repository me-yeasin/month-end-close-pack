/**
 * POST /api/ai/models
 *
 * Server-side proxy for the OpenAI-compatible `GET {baseUrl}/models` endpoint.
 *
 * Why a proxy: browsers block direct cross-origin calls to most AI providers
 * (no Access-Control-Allow-Origin), so a client-side fetch fails with a CORS
 * error even when the URL and key are valid. Fetching from the Next.js server
 * (same origin as the app) avoids CORS entirely.
 *
 * The key is only forwarded to the provider the user configured and is never
 * logged. This app runs locally, so the request stays on the same machine.
 */

import { NextResponse } from "next/server";

type Body = { baseUrl?: unknown; apiKey?: unknown };

/** Pull a human-readable error message out of a provider error payload. */
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

  if (!baseUrl) {
    return NextResponse.json({ error: "Base URL is required." }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(`${baseUrl}/models`);
  } catch {
    return NextResponse.json({ error: "Invalid base URL." }, { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json(
      { error: "Base URL must use http or https." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(target.toString(), {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
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

    if (data === null) {
      return NextResponse.json(
        { error: "Provider returned a non-JSON response." },
        { status: 502 },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Could not reach the provider. Check the base URL and your network." },
      { status: 502 },
    );
  }
}
