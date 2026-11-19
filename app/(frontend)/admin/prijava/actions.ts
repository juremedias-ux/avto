"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminUserId } from "@/lib/env";
import { parseEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp, isSameOrigin } from "@/lib/request";
import { getAuthClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; email?: string; attempt: number };

const GENERIC_ERROR = "Prijava ni uspela. Preveri e-poštni naslov in geslo.";

export async function signInAction(previous: LoginState, formData: FormData): Promise<LoginState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const rawEmail = formData.get("email");
  const password = formData.get("geslo");
  const email = typeof rawEmail === "string" ? rawEmail.slice(0, 320) : "";

  const fail = (error: string): LoginState => ({ error, email, attempt });

  const requestHeaders = await headers();
  if (!isSameOrigin(requestHeaders)) return fail(GENERIC_ERROR);

  const adminUserId = getAdminUserId();
  const supabase = await getAuthClient();
  if (!supabase || !adminUserId) {
    return fail("Administracija še ni nastavljena. Glej navodila v README.");
  }

  const parsed = parseEmail(email);
  if (!parsed.ok || typeof password !== "string" || password.length === 0 || password.length > 256) {
    return fail(GENERIC_ERROR);
  }

  const limit = await checkRateLimit("adminLogin", getClientIp(requestHeaders));
  if (limit === "limited") return fail("Preveč poskusov. Počakaj nekaj minut in poskusi znova.");
  if (limit === "error") return fail("Prijava trenutno ni mogoča. Poskusi znova.");

  let userId: string | null = null;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password,
    });
    if (!error && data.user) userId = data.user.id.toLowerCase();
  } catch {
    return fail("Prijava trenutno ni mogoča. Poskusi znova.");
  }

  if (!userId) return fail(GENERIC_ERROR);

  if (userId !== adminUserId) {
    // Navaden prijavljen uporabnik nima dostopa: sejo takoj zapremo.
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Brez nadaljnjih ukrepov; dostop se preverja pri vsaki zahtevi.
    }
    return fail("Ta račun nima dostopa do administracije.");
  }

  redirect("/admin");
}
