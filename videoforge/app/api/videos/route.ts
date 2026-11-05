import type { NextRequest } from "next/server";
import { getAppContext } from "@/lib/auth";
import { getMaxConcurrentGenerations } from "@/lib/env";
import { startGeneration } from "@/lib/generation/service";
import { isSameOrigin, json, jsonError } from "@/lib/http";
import { generationSchema } from "@/lib/validation";

export const maxDuration = 60;

/** Creates a generation. Body: GenerationInput (see lib/validation.ts). */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("forbidden", 403);
  const ctx = await getAppContext();
  if (!ctx) return jsonError("unauthorized", 401);

  const body: unknown = await request.json().catch(() => null);
  const parsed = generationSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return jsonError("validation", 422, { field: issue?.path.join("."), reason: issue?.message });
  }

  const result = await startGeneration(ctx, parsed.data);
  if (result.ok) return json({ videoId: result.videoId, pending: result.pending }, 201);

  const status =
    result.error === "insufficient_credits" ? 402
    : result.error === "concurrency_limit" || result.error === "rate_limited" || result.error === "concurrency_limited" ? 429
    : result.error === "account_suspended" || result.error === "not_member" ? 403
    : result.error === "not_configured" ? 503
    : result.error === "content_moderation" || result.error === "invalid_request" || result.error === "invalid_image" ? 422
    : 502;
  return jsonError(result.error, status, {
    videoId: result.videoId,
    ...(result.error === "concurrency_limit" ? { max: getMaxConcurrentGenerations() } : {}),
  });
}
