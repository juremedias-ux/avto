import "server-only";

import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppContext } from "@/lib/auth";
import type { SubscriptionStatus } from "@/lib/db/types";
import { getSiteUrl, getStripeEnv } from "@/lib/env";
import type { Locale } from "@/lib/i18n/config";
import { findPack, SUBSCRIPTION_PLAN, type CreditPack } from "@/lib/billing/plans";
import { getServiceClient } from "@/lib/supabase/service";

let cachedStripe: { key: string; client: Stripe } | null = null;

/** Stripe client with the SDK's pinned API version, or null when not configured. */
export function getStripe(): Stripe | null {
  const env = getStripeEnv();
  if (!env) return null;
  if (cachedStripe?.key === env.secretKey) return cachedStripe.client;
  const client = new Stripe(env.secretKey, { appInfo: { name: "VideoForge AI" } });
  cachedStripe = { key: env.secretKey, client };
  return client;
}

export type CheckoutError = "not_configured" | "forbidden" | "suspended" | "already_subscribed" | "unknown";
export type CheckoutResult = { ok: true; url: string } | { ok: false; error: CheckoutError };

function guard(ctx: AppContext): CheckoutError | null {
  if (ctx.role !== "admin") return "forbidden";
  if (ctx.profile.status !== "active") return "suspended";
  return null;
}

async function ensureCustomer(stripe: Stripe, service: SupabaseClient, ctx: AppContext): Promise<string> {
  if (ctx.organization.stripe_customer_id) return ctx.organization.stripe_customer_id;
  const customer = await stripe.customers.create(
    {
      email: ctx.profile.email,
      name: ctx.organization.name,
      metadata: { organization_id: ctx.organization.id },
    },
    { idempotencyKey: `customer:${ctx.organization.id}` },
  );
  const { data } = await service
    .from("organizations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", ctx.organization.id)
    .is("stripe_customer_id", null)
    .select("stripe_customer_id")
    .maybeSingle<{ stripe_customer_id: string }>();
  if (data?.stripe_customer_id) return data.stripe_customer_id;
  // Another request set it first; use the stored one.
  const { data: org } = await service
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", ctx.organization.id)
    .single<{ stripe_customer_id: string | null }>();
  return org?.stripe_customer_id ?? customer.id;
}

export async function createPackCheckout(ctx: AppContext, packId: CreditPack["id"], locale: Locale): Promise<CheckoutResult> {
  const stripe = getStripe();
  const service = getServiceClient();
  if (!stripe || !service) return { ok: false, error: "not_configured" };
  const denied = guard(ctx);
  if (denied) return { ok: false, error: denied };
  const pack = findPack(packId);
  if (!pack) return { ok: false, error: "unknown" };

  const customer = await ensureCustomer(stripe, service, ctx);
  const metadata = {
    organization_id: ctx.organization.id,
    user_id: ctx.profile.id,
    pack_id: pack.id,
    credits: String(pack.credits),
  };
  const site = getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer,
    client_reference_id: ctx.organization.id,
    locale,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: pack.currency,
          unit_amount: pack.priceCents,
          product_data: { name: `VideoForge AI — ${pack.credits} credits` },
        },
      },
    ],
    metadata,
    payment_intent_data: { metadata },
    success_url: `${site}/billing?checkout=success`,
    cancel_url: `${site}/billing?checkout=canceled`,
  });
  return session.url ? { ok: true, url: session.url } : { ok: false, error: "unknown" };
}

export async function createSubscriptionCheckout(ctx: AppContext, locale: Locale): Promise<CheckoutResult> {
  const stripe = getStripe();
  const service = getServiceClient();
  const priceId = getStripeEnv()?.subscriptionPriceId;
  if (!stripe || !service || !priceId) return { ok: false, error: "not_configured" };
  const denied = guard(ctx);
  if (denied) return { ok: false, error: denied };

  const { data: existing } = await service
    .from("subscriptions")
    .select("id")
    .eq("organization_id", ctx.organization.id)
    .in("status", ["active", "trialing", "past_due", "incomplete"])
    .limit(1);
  if (existing && existing.length > 0) return { ok: false, error: "already_subscribed" };

  const customer = await ensureCustomer(stripe, service, ctx);
  const metadata = { organization_id: ctx.organization.id, user_id: ctx.profile.id, plan_id: SUBSCRIPTION_PLAN.id };
  const site = getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: ctx.organization.id,
    locale,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata,
    subscription_data: { metadata },
    success_url: `${site}/billing?checkout=success`,
    cancel_url: `${site}/billing?checkout=canceled`,
  });
  return session.url ? { ok: true, url: session.url } : { ok: false, error: "unknown" };
}

export async function createPortalSession(ctx: AppContext): Promise<CheckoutResult> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "not_configured" };
  if (ctx.role !== "admin") return { ok: false, error: "forbidden" };
  if (!ctx.organization.stripe_customer_id) return { ok: false, error: "unknown" };
  const session = await stripe.billingPortal.sessions.create({
    customer: ctx.organization.stripe_customer_id,
    return_url: `${getSiteUrl()}/billing`,
  });
  return { ok: true, url: session.url };
}

/** Recurring price amount for display (null when Stripe or the price is unavailable). */
export async function getSubscriptionPrice(): Promise<{ cents: number; currency: string } | null> {
  const stripe = getStripe();
  const priceId = getStripeEnv()?.subscriptionPriceId;
  if (!stripe || !priceId) return null;
  try {
    const price = await stripe.prices.retrieve(priceId);
    return price.unit_amount !== null ? { cents: price.unit_amount, currency: price.currency } : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Webhook handling (idempotent: every grant has a unique idempotency key)
// ---------------------------------------------------------------------------

const SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = [
  "incomplete",
  "incomplete_expired",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
  "paused",
];

function toIso(seconds: number | null | undefined): string | null {
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

async function grantCredits(
  service: SupabaseClient,
  args: {
    organizationId: string;
    amount: number;
    type: "purchase" | "subscription_grant";
    idempotencyKey: string;
    description: string;
    userId: string | null;
    amountPaidCents: number | null;
    currency: string | null;
    stripeReference: string;
  },
): Promise<void> {
  const { error } = await service.rpc("apply_credit_change", {
    p_organization_id: args.organizationId,
    p_amount: args.amount,
    p_type: args.type,
    p_user_id: args.userId,
    p_video_id: null,
    p_idempotency_key: args.idempotencyKey,
    p_description: args.description,
    p_created_by: null,
    p_metadata: {},
    p_amount_paid_cents: args.amountPaidCents,
    p_currency: args.currency,
    p_stripe_reference: args.stripeReference,
  });
  // Throwing makes the webhook return 500 so Stripe retries; the key prevents double grants.
  if (error) throw new Error(`apply_credit_change failed: ${error.message}`);
}

async function syncSubscription(stripe: Stripe, service: SupabaseClient, subscriptionId: string): Promise<Stripe.Subscription | null> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const organizationId = sub.metadata?.organization_id;
  if (!organizationId) return null;
  const item = sub.items.data[0];
  const status = (SUBSCRIPTION_STATUSES as readonly string[]).includes(sub.status)
    ? (sub.status as SubscriptionStatus)
    : "incomplete";
  const { error } = await service.from("subscriptions").upsert(
    {
      organization_id: organizationId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_price_id: item?.price.id ?? null,
      plan_id: sub.metadata?.plan_id ?? SUBSCRIPTION_PLAN.id,
      status,
      monthly_credits: SUBSCRIPTION_PLAN.monthlyCredits,
      current_period_start: toIso(item?.current_period_start),
      current_period_end: toIso(item?.current_period_end),
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: toIso(sub.canceled_at),
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) throw new Error(`subscription upsert failed: ${error.message}`);
  return sub;
}

export async function handleStripeEvent(event: Stripe.Event): Promise<"handled" | "ignored"> {
  const stripe = getStripe();
  const service = getServiceClient();
  if (!stripe || !service) throw new Error("Stripe or Supabase not configured");

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.mode === "payment") {
        if (session.payment_status !== "paid") return "ignored";
        const organizationId = session.metadata?.organization_id;
        const pack = findPack(session.metadata?.pack_id ?? "");
        if (!organizationId || !pack) return "ignored";
        await grantCredits(service, {
          organizationId,
          amount: pack.credits,
          type: "purchase",
          idempotencyKey: `stripe:checkout:${session.id}`,
          description: `Credit pack ${pack.credits}`,
          userId: session.metadata?.user_id ?? null,
          amountPaidCents: session.amount_total,
          currency: session.currency,
          stripeReference: session.id,
        });
        return "handled";
      }
      if (session.mode === "subscription" && session.subscription) {
        const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await syncSubscription(stripe, service, id);
        return "handled";
      }
      return "ignored";
    }

    case "invoice.paid": {
      const invoice = event.data.object;
      const ref = invoice.parent?.subscription_details?.subscription;
      if (!ref || !invoice.id) return "ignored";
      const subscriptionId = typeof ref === "string" ? ref : ref.id;
      const sub = await syncSubscription(stripe, service, subscriptionId);
      if (!sub) return "ignored";
      if (invoice.billing_reason !== "subscription_create" && invoice.billing_reason !== "subscription_cycle") {
        return "handled";
      }
      await grantCredits(service, {
        organizationId: sub.metadata.organization_id as string,
        amount: SUBSCRIPTION_PLAN.monthlyCredits,
        type: "subscription_grant",
        idempotencyKey: `stripe:invoice:${invoice.id}`,
        description: "Monthly subscription credits",
        userId: sub.metadata.user_id ?? null,
        amountPaidCents: invoice.amount_paid,
        currency: invoice.currency,
        stripeReference: invoice.id,
      });
      return "handled";
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(stripe, service, event.data.object.id);
      return "handled";
    }

    default:
      return "ignored";
  }
}
