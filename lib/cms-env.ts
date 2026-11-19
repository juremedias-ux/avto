import type { PoolConfig } from "pg";
import { cleanEnvValue } from "@/lib/supabase/url";

/**
 * Nastavitve povezave urejevalnika (Payload) z bazo Supabase.
 * DATABASE_URL je niz »Session pooler« iz Supabase (Connect → Direct).
 */
export function getDatabaseUrl(): string | undefined {
  return cleanEnvValue(process.env.DATABASE_URL);
}

/** Ali sta nastavljena baza in skrivnost urejevalnika. */
export function isCmsConfigured(): boolean {
  const secret = cleanEnvValue(process.env.PAYLOAD_SECRET);
  return Boolean(getDatabaseUrl() && secret && secret.length >= 32);
}

/**
 * Pool za node-postgres. Supabase pooler uporablja potrdilo lastnega
 * overitelja, zato je povezava šifrirana brez preverjanja verige
 * (rejectUnauthorized: false). Za lokalni Postgres SSL ni potreben.
 * Majhen pool je primeren za strežniške funkcije (Vercel).
 */
export function databasePoolConfig(): PoolConfig {
  const connectionString = getDatabaseUrl() ?? "";
  let ssl: PoolConfig["ssl"] = undefined;
  try {
    const host = new URL(connectionString).hostname;
    if (host.endsWith(".supabase.com") || host.endsWith(".supabase.co")) ssl = { rejectUnauthorized: false };
  } catch {
    // Neveljaven niz: povezava ne bo uspela; to javi isCmsConfigured()/dnevnik.
  }
  return { connectionString, ssl, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 10_000 };
}
