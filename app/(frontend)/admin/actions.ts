"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminQueryFromForm, adminUrl } from "@/lib/admin-params";
import { requireAdmin } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request";
import { getAuthClient } from "@/lib/supabase/server";
import { deleteWaitlistEntry, revokeConsent, type ConsentPurpose } from "@/lib/waitlist";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readId(formData: FormData): string | null {
  const id = formData.get("id");
  return typeof id === "string" && UUID.test(id) ? id.toLowerCase() : null;
}

function readPurpose(formData: FormData): ConsentPurpose | null {
  const value = formData.get("namen");
  return value === "zagon" || value === "novice" ? value : null;
}

/** Preklic posamezne privolitve (z obvezno potrditvijo). */
export async function revokeConsentAction(formData: FormData): Promise<void> {
  const query = adminQueryFromForm(formData);
  if (!isSameOrigin(await headers())) redirect(adminUrl(query, "napaka"));

  // Identiteta in pooblastila se preverijo pri vsaki operaciji.
  const session = await requireAdmin();

  const id = readId(formData);
  const purpose = readPurpose(formData);
  if (!id || !purpose || formData.get("potrditev") !== "da") {
    redirect(adminUrl(query, "napaka"));
  }

  const result = await revokeConsent(session, id, purpose);
  const notice =
    result === "ok"
      ? purpose === "zagon"
        ? "preklicano-zagon"
        : "preklicano-novice"
      : result === "not_found"
        ? "ni-najdeno"
        : "napaka";
  redirect(adminUrl(query, notice));
}

/** Trajni izbris prijave (z obvezno potrditvijo). */
export async function deleteEntryAction(formData: FormData): Promise<void> {
  const query = adminQueryFromForm(formData);
  if (!isSameOrigin(await headers())) redirect(adminUrl(query, "napaka"));

  const session = await requireAdmin();

  const id = readId(formData);
  if (!id || formData.get("potrditev") !== "da") redirect(adminUrl(query, "napaka"));

  const result = await deleteWaitlistEntry(session, id);
  const notice = result === "ok" ? "izbrisano" : result === "not_found" ? "ni-najdeno" : "napaka";
  redirect(adminUrl(query, notice));
}

/** Odjava lastnika. */
export async function signOutAction(): Promise<void> {
  if (!isSameOrigin(await headers())) redirect("/admin");

  const supabase = await getAuthClient();
  try {
    // scope "local": prekliče osvežilni žeton te seje na strežniku Supabase.
    await supabase?.auth.signOut({ scope: "local" });
  } catch {
    // Nadaljujemo: piškotke odstranimo spodaj.
  }

  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.includes("-auth-token")) {
      cookieStore.delete({ name: cookie.name, path: "/admin" });
    }
  }
  redirect("/admin/prijava?odjava=1");
}
