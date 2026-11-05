"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/auth";
import { parseDbErrorCode } from "@/lib/db/errors";
import { getI18n } from "@/lib/i18n/server";
import { getServiceClient } from "@/lib/supabase/service";
import {
  addMemberSchema,
  memberRoleSchema,
  organizationNameSchema,
  profileSchema,
  removeMemberSchema,
  uuidSchema,
} from "@/lib/validation";

export type ActionState = { error?: string; message?: string } | null;

async function orgError(error: { message?: string }): Promise<string> {
  const { t } = await getI18n();
  const code = parseDbErrorCode(error);
  const map = t.settings.errors as Record<string, string>;
  return (code && map[code]) || t.common.unknownError;
}

export async function switchOrganizationAction(formData: FormData): Promise<void> {
  const ctx = await getAppContext();
  if (!ctx) redirect("/login");
  const id = uuidSchema.safeParse(formData.get("organizationId"));
  if (id.success && ctx.memberships.some((m) => m.organization.id === id.data)) {
    // RLS (users_update_self) re-checks membership of the target organization.
    await ctx.db.from("users").update({ active_organization_id: id.data }).eq("id", ctx.profile.id);
  }
  revalidatePath("/", "layout");
}

export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getAppContext();
  const { t } = await getI18n();
  if (!ctx) return { error: t.errors.unauthorized };
  const parsed = profileSchema.safeParse({ fullName: formData.get("fullName"), locale: formData.get("locale") });
  if (!parsed.success) return { error: t.errors.validation };
  const { error } = await ctx.db
    .from("users")
    .update({ full_name: parsed.data.fullName, locale: parsed.data.locale })
    .eq("id", ctx.profile.id);
  if (error) return { error: t.common.unknownError };
  revalidatePath("/", "layout");
  return { message: t.common.saved };
}

export async function createOrganizationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getAppContext();
  const { t } = await getI18n();
  const service = getServiceClient();
  if (!ctx || !service) return { error: t.errors.unauthorized };
  const name = organizationNameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: t.errors.validation };
  const { error } = await service.rpc("create_organization", { p_user_id: ctx.profile.id, p_name: name.data });
  if (error) return { error: await orgError(error) };
  revalidatePath("/", "layout");
  return { message: t.common.saved };
}

export async function renameOrganizationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getAppContext();
  const { t } = await getI18n();
  if (!ctx) return { error: t.errors.unauthorized };
  const name = organizationNameSchema.safeParse(formData.get("name"));
  if (!name.success) return { error: t.errors.validation };
  if (ctx.role !== "admin") return { error: t.settings.errors.VF_FORBIDDEN };
  // Column grant allows only "name"; RLS allows only organization admins.
  const { error } = await ctx.db.from("organizations").update({ name: name.data }).eq("id", ctx.organization.id);
  if (error) return { error: t.common.unknownError };
  revalidatePath("/", "layout");
  return { message: t.common.saved };
}

export async function addMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await getAppContext();
  const { t } = await getI18n();
  const service = getServiceClient();
  if (!ctx || !service) return { error: t.errors.unauthorized };
  const parsed = addMemberSchema.safeParse({
    organizationId: formData.get("organizationId"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: t.errors.validation };
  const { error } = await service.rpc("add_organization_member", {
    p_actor_id: ctx.profile.id,
    p_organization_id: parsed.data.organizationId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (error) return { error: await orgError(error) };
  revalidatePath("/settings");
  return { message: t.common.saved };
}

export async function updateMemberRoleAction(formData: FormData): Promise<void> {
  const ctx = await getAppContext();
  const service = getServiceClient();
  if (!ctx || !service) return;
  const parsed = memberRoleSchema.safeParse({
    organizationId: formData.get("organizationId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;
  const { error } = await service.rpc("update_organization_member_role", {
    p_actor_id: ctx.profile.id,
    p_organization_id: parsed.data.organizationId,
    p_user_id: parsed.data.userId,
    p_role: parsed.data.role,
  });
  revalidatePath("/settings");
  if (error) redirect(`/settings?error=${encodeURIComponent(parseDbErrorCode(error) ?? "VF_UNKNOWN")}`);
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const ctx = await getAppContext();
  const service = getServiceClient();
  if (!ctx || !service) return;
  const parsed = removeMemberSchema.safeParse({
    organizationId: formData.get("organizationId"),
    userId: formData.get("userId"),
  });
  if (!parsed.success) return;
  const { error } = await service.rpc("remove_organization_member", {
    p_actor_id: ctx.profile.id,
    p_organization_id: parsed.data.organizationId,
    p_user_id: parsed.data.userId,
  });
  revalidatePath("/", "layout");
  if (error) redirect(`/settings?error=${encodeURIComponent(parseDbErrorCode(error) ?? "VF_UNKNOWN")}`);
}
