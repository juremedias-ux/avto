"use server";

import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/auth";
import { createPackCheckout, createPortalSession, createSubscriptionCheckout } from "@/lib/billing/service";
import { getI18n } from "@/lib/i18n/server";
import { checkoutSchema } from "@/lib/validation";

export async function checkoutAction(formData: FormData): Promise<void> {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login?next=/billing");
  const { locale } = await getI18n();
  const parsed = checkoutSchema.safeParse({ kind: formData.get("kind"), packId: formData.get("packId") ?? undefined });
  if (!parsed.success) redirect("/billing?error=unknown");
  const result =
    parsed.data.kind === "pack"
      ? await createPackCheckout(ctx, parsed.data.packId, locale)
      : await createSubscriptionCheckout(ctx, locale);
  if (!result.ok) {
    if (result.error === "already_subscribed") {
      const portal = await createPortalSession(ctx);
      if (portal.ok) redirect(portal.url);
    }
    redirect(`/billing?error=${result.error}`);
  }
  redirect(result.url);
}

export async function portalAction(): Promise<void> {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login?next=/billing");
  const result = await createPortalSession(ctx);
  redirect(result.ok ? result.url : `/billing?error=${result.error}`);
}
