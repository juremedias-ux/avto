import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getAdminUserId, getSupabaseEnv } from "@/lib/env";
import { getAuthClient, hasAuthCookie } from "@/lib/supabase/server";

declare const adminSessionBrand: unique symbol;

/**
 * Dokaz, da je strežnik v tej zahtevi preveril lastnika.
 * Ustvari ga lahko samo `getAdminStatus`, zato funkcij podatkovnega sloja
 * za administracijo ni mogoče klicati brez preverjanja.
 */
export type AdminSession = {
  readonly userId: string;
  readonly email: string | null;
  readonly [adminSessionBrand]: true;
};

export type AdminStatus =
  | { status: "ok"; session: AdminSession }
  | { status: "not_configured" }
  | { status: "unauthenticated"; expired: boolean }
  | { status: "forbidden" };

/**
 * Preveri prijavo pri strežniku Supabase Auth (getUser preveri žeton pri
 * strežniku, ne samo lokalno) in primerja ID z ADMIN_USER_ID.
 * Kliče se pri vsaki zaščiteni operaciji.
 */
export async function getAdminStatus(): Promise<AdminStatus> {
  // Vedno ob zahtevi, nikoli vnaprej zgrajeno ali predpomnjeno.
  await connection();

  const adminUserId = getAdminUserId();
  if (!getSupabaseEnv() || !adminUserId) return { status: "not_configured" };

  const supabase = await getAuthClient();
  if (!supabase) return { status: "not_configured" };

  let userId: string | null = null;
  let email: string | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      userId = data.user.id.toLowerCase();
      email = data.user.email ?? null;
    }
  } catch {
    userId = null;
  }

  if (!userId) {
    return { status: "unauthenticated", expired: await hasAuthCookie() };
  }
  if (userId !== adminUserId) return { status: "forbidden" };

  return {
    status: "ok",
    session: { userId, email } as AdminSession,
  };
}

/**
 * Za strani in strežniške akcije: brez veljavne lastniške seje preusmeri
 * na prijavo. Neprijavljen uporabnik in uporabnik brez pravic ne prideta
 * do podatkov.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const result = await getAdminStatus();
  switch (result.status) {
    case "ok":
      return result.session;
    case "unauthenticated":
      redirect(result.expired ? "/admin/prijava?seja=potekla" : "/admin/prijava");
    case "forbidden":
      redirect("/admin/prijava?napaka=dostop");
    case "not_configured":
      redirect("/admin/prijava?napaka=nastavitve");
  }
}
