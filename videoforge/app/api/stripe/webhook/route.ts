import type { NextRequest } from "next/server";
import { getStripe, handleStripeEvent } from "@/lib/billing/service";
import { getStripeEnv } from "@/lib/env";
import { json, jsonError } from "@/lib/http";

export const maxDuration = 60;

/** Stripe webhook: signature-verified with STRIPE_WEBHOOK_SECRET; handlers are idempotent. */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = getStripeEnv()?.webhookSecret;
  if (!stripe || !secret) return jsonError("not_configured", 503);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError("missing_signature", 400);
  const raw = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return jsonError("bad_signature", 400);
  }

  try {
    const outcome = await handleStripeEvent(event);
    return json({ received: true, outcome });
  } catch (error) {
    console.error("stripe webhook failed", event.type, event.id, error instanceof Error ? error.message : error);
    return jsonError("handler_failed", 500);
  }
}
