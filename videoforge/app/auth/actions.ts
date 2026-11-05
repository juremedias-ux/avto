"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { dictionaries, isLocale, LOCALE_COOKIE } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { getUserClient } from "@/lib/supabase/server";
import { emailSchema, passwordSchema, signInSchema, signUpSchema } from "@/lib/validation";

export type AuthFormState = { error?: string; message?: string } | null;

function authErrorMessage(
  t: (typeof dictionaries)["en"],
  error: { code?: string; status?: number } | null,
): string {
  if (!error) return t.auth.errors.generic;
  if (error.code === "invalid_credentials") return t.auth.errors.invalidCredentials;
  if (error.code === "email_not_confirmed") return t.auth.errors.emailNotConfirmed;
  if (error.code === "weak_password") return t.auth.errors.passwordTooShort;
  if (error.status === 429 || error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit") {
    return t.auth.errors.rateLimited;
  }
  return t.auth.errors.generic;
}

export async function signInAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { t } = await getI18n();
  const parsed = signInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: t.auth.errors.invalidInput };
  const db = await getUserClient();
  if (!db) return { error: t.common.notConfigured };
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(t, error) };
  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function signUpAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { t, locale } = await getI18n();
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const tooShort = parsed.error.issues.some((i) => i.message === "password_too_short");
    return { error: tooShort ? t.auth.errors.passwordTooShort : t.auth.errors.invalidInput };
  }
  const db = await getUserClient();
  if (!db) return { error: t.common.notConfigured };
  const { data, error } = await db.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, locale },
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
    },
  });
  if (error) return { error: authErrorMessage(t, error) };
  if (data.session) redirect("/dashboard");
  // E-mail confirmation is enabled (or the address already exists — Supabase does not reveal which).
  return { message: t.auth.checkEmail };
}

export async function googleSignInAction(formData: FormData): Promise<void> {
  const db = await getUserClient();
  if (!db) redirect("/login?error=not_configured");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const { data, error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const db = await getUserClient();
  await db?.auth.signOut();
  redirect("/login");
}

export async function requestPasswordResetAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { t } = await getI18n();
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: t.auth.errors.invalidInput };
  const db = await getUserClient();
  if (!db) return { error: t.common.notConfigured };
  const { error } = await db.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error && (error.status === 429 || error.code === "over_email_send_rate_limit")) {
    return { error: t.auth.errors.rateLimited };
  }
  // Same message whether or not the account exists.
  return { message: t.auth.resetSent };
}

export async function updatePasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { t } = await getI18n();
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { error: t.auth.errors.passwordTooShort };
  const db = await getUserClient();
  if (!db) return { error: t.common.notConfigured };
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return { error: t.auth.errors.linkInvalid };
  const { error } = await db.auth.updateUser({ password: password.data });
  if (error) return { error: authErrorMessage(t, error) };
  redirect("/dashboard");
}

export async function setLocaleAction(formData: FormData): Promise<void> {
  const value = String(formData.get("locale") ?? "");
  if (!isLocale(value)) return;
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, value, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
  const db = await getUserClient();
  const { data } = (await db?.auth.getUser()) ?? { data: { user: null } };
  if (db && data.user) await db.from("users").update({ locale: value }).eq("id", data.user.id);
  redirect(safeNextPath(String(formData.get("returnTo") ?? ""), "/"));
}
