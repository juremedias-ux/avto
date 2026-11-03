import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/env";
import { adminCookieOptions } from "@/lib/supabase/cookies";

/**
 * Odjemalec Supabase Auth, vezan na piškotke trenutne zahteve.
 * Uporablja javni (publishable) ključ; podatkov iz baze z njim ne beremo.
 */
export async function getAuthClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient(env.url, env.publishableKey, {
    cookieOptions: adminCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Klic iz strežniške komponente: piškotke osveži proxy.ts.
        }
      },
    },
  });
}

/** Ali zahteva vsebuje piškotek seje Supabase (tudi potekle). */
export async function hasAuthCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
}
