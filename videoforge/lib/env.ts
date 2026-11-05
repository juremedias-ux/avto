import "server-only";

import { z } from "zod";

/**
 * Server-side configuration. None of these variables carry the NEXT_PUBLIC_
 * prefix, so Next.js never inlines them into browser bundles.
 */

function clean(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed === "" ? undefined : trimmed;
}

function read(name: string): string | undefined {
  return clean(process.env[name]);
}

const urlSchema = z.url({ protocol: /^https?$/ });

export type SupabaseEnv = { url: string; publishableKey: string; secretKey: string };

export function getSupabaseEnv(): SupabaseEnv | null {
  const url = read("SUPABASE_URL");
  const publishableKey = read("SUPABASE_PUBLISHABLE_KEY");
  const secretKey = read("SUPABASE_SECRET_KEY");
  if (!url || !publishableKey || !secretKey) return null;
  const parsed = urlSchema.safeParse(url);
  if (!parsed.success) return null;
  return { url: parsed.data.replace(/\/+$/, ""), publishableKey, secretKey };
}

export type KlingEnv = {
  apiKey: string;
  baseUrl: string;
  webhookSecret: string | null;
  usdPerUnit: number;
  requestTimeoutMs: number;
  taskTimeoutMinutes: number;
};

/** Kling configuration or null when KLING_API_KEY is missing (demo/staging mode). */
export function getKlingEnv(): KlingEnv | null {
  const apiKey = read("KLING_API_KEY");
  if (!apiKey) return null;
  const baseUrl = urlSchema.safeParse(read("KLING_API_BASE_URL") ?? "https://api-singapore.klingai.com");
  return {
    apiKey,
    baseUrl: (baseUrl.success ? baseUrl.data : "https://api-singapore.klingai.com").replace(/\/+$/, ""),
    webhookSecret: read("KLING_WEBHOOK_SECRET") ?? null,
    usdPerUnit: positiveNumber(read("KLING_USD_PER_UNIT"), 0.14),
    requestTimeoutMs: positiveNumber(read("KLING_REQUEST_TIMEOUT_MS"), 30_000),
    taskTimeoutMinutes: positiveNumber(read("KLING_TASK_TIMEOUT_MINUTES"), 30),
  };
}

export function isKlingConfigured(): boolean {
  return Boolean(read("KLING_API_KEY"));
}

export type StripeEnv = {
  secretKey: string;
  webhookSecret: string | null;
  subscriptionPriceId: string | null;
};

export function getStripeEnv(): StripeEnv | null {
  const secretKey = read("STRIPE_SECRET_KEY");
  if (!secretKey) return null;
  return {
    secretKey,
    webhookSecret: read("STRIPE_WEBHOOK_SECRET") ?? null,
    subscriptionPriceId: read("STRIPE_SUBSCRIPTION_PRICE_ID") ?? null,
  };
}

/** Public base URL of this deployment, used for OAuth/Stripe/Kling callbacks. */
export function getSiteUrl(): string {
  const explicit = read("APP_URL") ?? read("NEXT_PUBLIC_SITE_URL");
  if (explicit && urlSchema.safeParse(explicit).success) return explicit.replace(/\/+$/, "");
  const vercel = read("VERCEL_PROJECT_PRODUCTION_URL") ?? read("VERCEL_URL");
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return "http://localhost:3000";
}

export function getCronSecret(): string | null {
  return read("CRON_SECRET") ?? null;
}

export function getMaxConcurrentGenerations(): number {
  return Math.min(Math.max(Math.floor(positiveNumber(read("MAX_CONCURRENT_GENERATIONS"), 2)), 1), 10);
}

function positiveNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
