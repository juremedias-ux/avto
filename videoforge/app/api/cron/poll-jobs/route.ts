import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getCronSecret } from "@/lib/env";
import { pollPendingJobs } from "@/lib/generation/service";
import { json, jsonError } from "@/lib/http";

export const maxDuration = 300;

/**
 * Background sweep (Vercel Cron, see vercel.json). Vercel sends
 * "Authorization: Bearer $CRON_SECRET" when CRON_SECRET is set.
 */
export async function GET(request: NextRequest) {
  const secret = getCronSecret();
  if (!secret) return jsonError("not_configured", 503);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return jsonError("unauthorized", 401);
  const result = await pollPendingJobs(240_000);
  return json(result);
}
