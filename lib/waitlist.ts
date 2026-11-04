import "server-only";

import type { AdminSession } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/service";
import type { ValidWaitlistInput, WaitlistSource } from "@/lib/waitlist-form";

/**
 * Podatkovni sloj za tabelo public.waitlist.
 * Javni obiskovalci do tabele nimajo dostopa (RLS, brez pravic za anon in
 * authenticated). Vse operacije tečejo prek strežnika s skrivnim ključem.
 * Funkcije za administracijo zahtevajo AdminSession, ki ga ustvari samo
 * preverjanje lastnika v lib/auth.ts.
 */

export type ConsentPurpose = "zagon" | "novice";

export type WaitlistRow = {
  id: string;
  email: string;
  created_at: string;
  launch_consent: boolean;
  launch_consent_at: string;
  launch_revoked_at: string | null;
  newsletter_consent: boolean;
  newsletter_consent_at: string | null;
  newsletter_revoked_at: string | null;
  consent_text_version: string;
  source: WaitlistSource;
};

const COLUMNS =
  "id,email,created_at,launch_consent,launch_consent_at,launch_revoked_at,newsletter_consent,newsletter_consent_at,newsletter_revoked_at,consent_text_version,source";

function logDbError(operation: string, code: string | undefined) {
  // Brez e-poštnih naslovov in podrobnosti poizvedb v dnevnikih.
  console.error(`[waitlist] ${operation} ni uspelo`, code ?? "unknown");
}

/**
 * Shrani prijavo. Obstoječega naslova ne spremeni in ne razkrije, da
 * obstaja (INSERT ... ON CONFLICT DO NOTHING v funkciji
 * public.waitlist_subscribe). Enolična omejitev v bazi prepreči dvojnike
 * tudi pri sočasnih zahtevah.
 */
export async function addToWaitlist(
  input: ValidWaitlistInput,
  consentTextVersion: string,
): Promise<"ok" | "error"> {
  const supabase = getServiceClient();
  if (!supabase) {
    console.error("[waitlist] Supabase ni nastavljen");
    return "error";
  }
  try {
    const { error } = await supabase.rpc("waitlist_subscribe", {
      p_email: input.email,
      p_newsletter: input.newsletter,
      p_consent_text_version: consentTextVersion,
      p_source: input.source,
    });
    if (error) {
      logDbError("shranjevanje", error.code);
      return "error";
    }
    return "ok";
  } catch {
    logDbError("shranjevanje", "network");
    return "error";
  }
}

export type WaitlistStats = {
  total: number;
  launchActive: number;
  newsletterActive: number;
};

export async function getWaitlistStats(
  _session: AdminSession,
): Promise<WaitlistStats | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  try {
    const [total, launch, newsletter] = await Promise.all([
      supabase.from("waitlist").select("id", { count: "exact", head: true }),
      supabase
        .from("waitlist")
        .select("id", { count: "exact", head: true })
        .eq("launch_consent", true),
      supabase
        .from("waitlist")
        .select("id", { count: "exact", head: true })
        .eq("newsletter_consent", true),
    ]);
    const failed = [total, launch, newsletter].find((r) => r.error);
    if (failed) {
      logDbError("štetje", failed.error?.code);
      return null;
    }
    return {
      total: total.count ?? 0,
      launchActive: launch.count ?? 0,
      newsletterActive: newsletter.count ?? 0,
    };
  } catch {
    logDbError("štetje", "network");
    return null;
  }
}

export const PAGE_SIZE = 25;
export const SEARCH_MAX_LENGTH = 100;

export type SortOrder = "najnovejse" | "najstarejse";

/** Pripravi iskalni niz za ILIKE: ubeži posebne znake vzorca. */
export function toSearchPattern(search: string): string | null {
  const cleaned = search.trim().toLowerCase().replace(/\*/g, "").slice(0, SEARCH_MAX_LENGTH);
  if (!cleaned) return null;
  const escaped = cleaned.replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}

export async function listWaitlist(
  _session: AdminSession,
  options: { search: string; page: number; sort: SortOrder },
): Promise<{ rows: WaitlistRow[]; total: number } | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const page = Math.max(1, Math.floor(options.page));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("waitlist")
    .select(COLUMNS, { count: "exact" })
    .order("created_at", { ascending: options.sort === "najstarejse" })
    .order("id", { ascending: true })
    .range(from, to);

  const pattern = toSearchPattern(options.search);
  if (pattern) query = query.ilike("email", pattern);

  try {
    const { data, error, count } = await query;
    if (error) {
      // Stran izven obsega (npr. ?stran=999) ni napaka baze.
      if (error.code === "PGRST103") return { rows: [], total: count ?? 0 };
      logDbError("branje", error.code);
      return null;
    }
    return { rows: (data ?? []) as WaitlistRow[], total: count ?? 0 };
  } catch {
    logDbError("branje", "network");
    return null;
  }
}

/** Vse aktivne privolitve za izbrani namen (za CSV-izvoz). */
export async function exportWaitlist(
  _session: AdminSession,
  purpose: ConsentPurpose,
): Promise<WaitlistRow[] | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const column = purpose === "zagon" ? "launch_consent" : "newsletter_consent";
  const batch = 1000;
  const rows: WaitlistRow[] = [];

  try {
    for (let from = 0; ; from += batch) {
      const { data, error } = await supabase
        .from("waitlist")
        .select(COLUMNS)
        .eq(column, true)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + batch - 1);
      if (error) {
        logDbError("izvoz", error.code);
        return null;
      }
      rows.push(...((data ?? []) as WaitlistRow[]));
      if (!data || data.length < batch) break;
    }
    return rows;
  } catch {
    logDbError("izvoz", "network");
    return null;
  }
}

/** Prekliče posamezno privolitev. Preklicane privolitve ni mogoče obnoviti. */
export async function revokeConsent(
  _session: AdminSession,
  id: string,
  purpose: ConsentPurpose,
): Promise<"ok" | "not_found" | "error"> {
  const supabase = getServiceClient();
  if (!supabase) return "error";

  const now = new Date().toISOString();
  try {
    const query =
      purpose === "zagon"
        ? supabase
            .from("waitlist")
            .update({ launch_revoked_at: now })
            .eq("id", id)
            .is("launch_revoked_at", null)
        : supabase
            .from("waitlist")
            .update({ newsletter_revoked_at: now })
            .eq("id", id)
            .not("newsletter_consent_at", "is", null)
            .is("newsletter_revoked_at", null);

    const { data, error } = await query.select("id");
    if (error) {
      logDbError("preklic", error.code);
      return "error";
    }
    return data && data.length > 0 ? "ok" : "not_found";
  } catch {
    logDbError("preklic", "network");
    return "error";
  }
}

/** Trajno izbriše prijavo. */
export async function deleteWaitlistEntry(
  _session: AdminSession,
  id: string,
): Promise<"ok" | "not_found" | "error"> {
  const supabase = getServiceClient();
  if (!supabase) return "error";
  try {
    const { data, error } = await supabase
      .from("waitlist")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      logDbError("izbris", error.code);
      return "error";
    }
    return data && data.length > 0 ? "ok" : "not_found";
  } catch {
    logDbError("izbris", "network");
    return "error";
  }
}
