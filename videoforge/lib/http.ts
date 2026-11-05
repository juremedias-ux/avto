import "server-only";

import { NextResponse } from "next/server";

export function json<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function jsonError(error: string, status: number, extra: Record<string, unknown> = {}) {
  return json({ error, ...extra }, status);
}

/** Rejects cross-site browser POST/DELETE requests to cookie-authenticated JSON routes. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === new URL(request.url).host || origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
