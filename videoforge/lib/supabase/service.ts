import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/env";

let cached: { key: string; client: SupabaseClient } | null = null;

const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

/**
 * Service-role client. Bypasses RLS — use only in server code after the caller
 * has been authenticated and authorized, and never pass it to client components.
 */
export function getServiceClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;
  const cacheKey = `${env.url}|${env.secretKey}`;
  if (cached?.key === cacheKey) return cached.client;
  const client = createClient(env.url, env.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: noStoreFetch },
  });
  cached = { key: cacheKey, client };
  return client;
}

export function requireServiceClient(): SupabaseClient {
  const client = getServiceClient();
  if (!client) throw new Error("Supabase is not configured (SUPABASE_URL / keys missing).");
  return client;
}
