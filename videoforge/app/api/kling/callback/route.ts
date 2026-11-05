import type { NextRequest } from "next/server";
import { getKlingEnv } from "@/lib/env";
import { handleTaskCallback } from "@/lib/generation/service";
import { json, jsonError } from "@/lib/http";
import { parseCallbackTaskRef, verifyKlingWebhook } from "@/lib/kling";

export const maxDuration = 60;

const ID_RE = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Kling task-status callback. When KLING_WEBHOOK_SECRET is set, the Standard
 * Webhooks signature is required. In every case the payload only identifies
 * the task: its state is re-read from the Kling API before anything changes.
 */
export async function POST(request: NextRequest) {
  const env = getKlingEnv();
  if (!env) return jsonError("not_configured", 503);
  const raw = await request.text();
  if (raw.length > 256 * 1024) return jsonError("payload_too_large", 413);

  if (env.webhookSecret) {
    const verdict = verifyKlingWebhook(raw, {
      id: request.headers.get("webhook-id"),
      timestamp: request.headers.get("webhook-timestamp"),
      signature: request.headers.get("webhook-signature"),
    }, env.webhookSecret);
    if (!verdict.ok) return jsonError(verdict.reason, 401);
  }

  const ref = parseCallbackTaskRef(raw);
  if (!ref || !ID_RE.test(ref.taskId) || (ref.externalId !== null && !ID_RE.test(ref.externalId))) {
    return json({ ok: true, ignored: true });
  }
  const matched = await handleTaskCallback(ref);
  return json({ ok: true, matched });
}
