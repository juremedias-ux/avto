import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

/**
 * Strežniški odjemalec s skrivnim ključem. Obide RLS, zato ga uporabljamo
 * izključno na strežniku in samo v podatkovnem sloju (lib/waitlist.ts,
 * lib/rate-limit.ts). Nikoli ga ne posreduj odjemalskim komponentam.
 */
let cached: { key: string; client: SupabaseClient } | null = null;

const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

export function getServiceClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cacheKey = `${env.url}|${env.secretKey}`;
  if (cached?.key === cacheKey) return cached.client;

  const client = createClient(env.url, env.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: noStoreFetch },
  });
  cached = { key: cacheKey, client };
  return client;
}
