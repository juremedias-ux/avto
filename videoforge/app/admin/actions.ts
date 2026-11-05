"use server";

import { revalidatePath } from "next/cache";
import { getAppContext } from "@/lib/auth";
import { parseDbErrorCode } from "@/lib/db/errors";
import { getI18n } from "@/lib/i18n/server";
import { getServiceClient } from "@/lib/supabase/service";
import { adminCreditsSchema, adminStatusSchema } from "@/lib/validation";

export type AdminActionState = { error?: string; message?: string } | null;

async function requireAdmin() {
  const ctx = await getAppContext();
  const service = getServiceClient();
  if (!ctx || !service || !ctx.profile.is_platform_admin || ctx.profile.status !== "active") return null;
  return { ctx, service };
}

async function adminError(error: { message?: string }): Promise<string> {
  const { t } = await getI18n();
  const code = parseDbErrorCode(error);
  return (code && (t.admin.errors as Record<string, string>)[code]) || t.common.unknownError;
}

export async function adjustCreditsAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { t } = await getI18n();
  const admin = await requireAdmin();
  if (!admin) return { error: t.admin.errors.VF_FORBIDDEN };
  const parsed = adminCreditsSchema.safeParse({
    organizationId: formData.get("organizationId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: t.errors.validation };
  // assert_platform_admin is re-checked inside the SQL function.
  const { error } = await admin.service.rpc("admin_adjust_credits", {
    p_admin_id: admin.ctx.profile.id,
    p_organization_id: parsed.data.organizationId,
    p_amount: parsed.data.amount,
    p_reason: parsed.data.reason,
  });
  if (error) return { error: await adminError(error) };
  revalidatePath("/admin", "layout");
  return { message: t.admin.done };
}

export async function setUserStatusAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const { t } = await getI18n();
  const admin = await requireAdmin();
  if (!admin) return { error: t.admin.errors.VF_FORBIDDEN };
  const parsed = adminStatusSchema.safeParse({
    userId: formData.get("userId"),
    status: formData.get("status"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) return { error: t.errors.validation };

  const { error } = await admin.service.rpc("admin_set_user_status", {
    p_admin_id: admin.ctx.profile.id,
    p_user_id: parsed.data.userId,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason ?? null,
  });
  if (error) return { error: await adminError(error) };

  // Blocked users are also banned in Supabase Auth, so existing sessions cannot be refreshed.
  const { error: banError } = await admin.service.auth.admin.updateUserById(parsed.data.userId, {
    ban_duration: parsed.data.status === "blocked" ? "876000h" : "none",
  });
  revalidatePath("/admin", "layout");
  if (banError) return { error: `${t.admin.done} (Auth ban: ${banError.message})` };
  return { message: t.admin.done };
}
