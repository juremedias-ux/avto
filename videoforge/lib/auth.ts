import "server-only";

import { redirect, notFound } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getUserClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import type { OrganizationRow, OrgRole, UserRow } from "@/lib/db/types";

export type Membership = {
  organization: Pick<OrganizationRow, "id" | "name" | "is_personal" | "credit_balance">;
  role: OrgRole;
};

export type AppContext = {
  authUser: User;
  profile: UserRow;
  organization: OrganizationRow;
  role: OrgRole;
  memberships: Membership[];
  /** Supabase client acting as this user (RLS enforced). */
  db: SupabaseClient;
};

export type SessionResult =
  | { kind: "not_configured" }
  | { kind: "anonymous" }
  | { kind: "blocked"; profile: UserRow }
  | { kind: "ok"; context: AppContext };

/**
 * Resolves the verified user (supabase.auth.getUser() validates the JWT with
 * Supabase Auth), their profile, memberships and active organization.
 */
export async function resolveSession(): Promise<SessionResult> {
  const db = await getUserClient();
  if (!db) return { kind: "not_configured" };

  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) return { kind: "anonymous" };

  const { data: profile } = await db.from("users").select("*").eq("id", auth.user.id).maybeSingle<UserRow>();
  if (!profile) return { kind: "anonymous" };
  if (profile.status === "blocked") return { kind: "blocked", profile };

  const { data: memberRows } = await db
    .from("organization_members")
    .select("role, organization:organizations(id, name, is_personal, credit_balance)")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true })
    .overrideTypes<{ role: OrgRole; organization: Membership["organization"] | null }[], { merge: false }>();

  const memberships: Membership[] = (memberRows ?? [])
    .filter((m): m is { role: OrgRole; organization: Membership["organization"] } => m.organization !== null)
    .map((m) => ({ role: m.role, organization: m.organization }));

  const active =
    memberships.find((m) => m.organization.id === profile.active_organization_id) ?? memberships[0];
  if (!active) return { kind: "anonymous" };

  if (active.organization.id !== profile.active_organization_id) {
    await db.from("users").update({ active_organization_id: active.organization.id }).eq("id", profile.id);
  }

  const { data: organization } = await db
    .from("organizations")
    .select("*")
    .eq("id", active.organization.id)
    .single<OrganizationRow>();
  if (!organization) return { kind: "anonymous" };

  return {
    kind: "ok",
    context: { authUser: auth.user, profile, organization, role: active.role, memberships, db },
  };
}

/** For pages: redirects anonymous users to /login and blocked users to /blocked. */
export async function requireAppContext(nextPath = "/dashboard"): Promise<AppContext> {
  const session = await resolveSession();
  switch (session.kind) {
    case "ok":
      return session.context;
    case "blocked":
      redirect("/blocked");
    case "not_configured":
      redirect("/login?error=not_configured");
    case "anonymous":
      redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
}

/** For route handlers and server actions: returns null instead of redirecting. */
export async function getAppContext(): Promise<AppContext | null> {
  const session = await resolveSession();
  return session.kind === "ok" ? session.context : null;
}

/** Platform admin pages: non-admins get a 404 so the panel is not discoverable. */
export async function requirePlatformAdmin(): Promise<AppContext & { service: SupabaseClient }> {
  const context = await requireAppContext("/admin");
  const service = getServiceClient();
  if (!context.profile.is_platform_admin || context.profile.status !== "active" || !service) notFound();
  return { ...context, service };
}

export function isOrgAdmin(context: AppContext): boolean {
  return context.role === "admin";
}

/** Only relative, same-site paths are accepted as post-login redirect targets. */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
