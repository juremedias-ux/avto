/**
 * Proposed commercial plans (see docs/pricing.md). Prices are proposals and
 * must be confirmed by the business before launch. Credit packs are charged
 * with inline Stripe prices built from this file; the subscription uses the
 * recurring price STRIPE_SUBSCRIPTION_PRICE_ID, whose amount is read from
 * Stripe for display.
 */

export type CreditPack = {
  id: "pack-50" | "pack-200" | "pack-500";
  credits: number;
  priceCents: number;
  currency: "eur";
};

export const CREDIT_PACKS: readonly CreditPack[] = [
  { id: "pack-50", credits: 50, priceCents: 1900, currency: "eur" },
  { id: "pack-200", credits: 200, priceCents: 6500, currency: "eur" },
  { id: "pack-500", credits: 500, priceCents: 14500, currency: "eur" },
];

export const SUBSCRIPTION_PLAN = {
  id: "business-monthly",
  monthlyCredits: 150,
  /** Display fallback only when the Stripe price cannot be retrieved. */
  fallbackPriceCents: 4900,
  currency: "eur",
} as const;

export function findPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function formatMoney(cents: number, currency: string, locale: "sl" | "en"): string {
  return new Intl.NumberFormat(locale === "sl" ? "sl-SI" : "en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
