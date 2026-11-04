import "server-only";

import { createHmac } from "node:crypto";
import { getRateLimitSecret } from "@/lib/env";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Omejevanje zahtev, ki deluje tudi pri več hkratnih strežniških
 * instancah: števec je v bazi (funkcija public.check_rate_limit), ne v
 * pomnilniku procesa.
 *
 * IP-naslova ne shranjujemo. V bazo gre samo HMAC-SHA256 povzetek
 * (psevdonim), ki ga brez strežniške skrivnosti ni mogoče povezati z
 * naslovom. Zapisi se samodejno brišejo, ko okno poteče.
 */

export const RATE_LIMITS = {
  waitlist: { limit: 5, windowSeconds: 10 * 60 },
  adminLogin: { limit: 8, windowSeconds: 15 * 60 },
} as const;

export type RateLimitScope = keyof typeof RATE_LIMITS;
export type RateLimitResult = "allowed" | "limited" | "error";

export function rateLimitKey(scope: RateLimitScope, ip: string, secret: string): string {
  const digest = createHmac("sha256", `rate-limit:${secret}`)
    .update(ip)
    .digest("base64url")
    .slice(0, 32);
  return `${scope}:${digest}`;
}

export async function checkRateLimit(
  scope: RateLimitScope,
  ip: string,
): Promise<RateLimitResult> {
  const supabase = getServiceClient();
  const secret = getRateLimitSecret();
  if (!supabase || !secret) {
    console.error("[rate-limit] manjkajo nastavitve SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY ali SUPABASE_SECRET_KEY");
    return "error";
  }

  const { limit, windowSeconds } = RATE_LIMITS[scope];
  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: rateLimitKey(scope, ip, secret),
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error || typeof data !== "boolean") {
      // Sporočila napak tu ne vsebujejo osebnih podatkov (ključ je psevdonim).
      console.error(
        "[rate-limit] preverjanje ni uspelo",
        error?.code ?? "brez kode",
        error?.message ?? "nepričakovan odgovor baze",
      );
      return "error";
    }
    return data ? "allowed" : "limited";
  } catch (error) {
    console.error("[rate-limit] povezava z bazo ni uspela", (error as Error)?.name ?? "napaka");
    return "error";
  }
}
