import { getStripeEnv, getSupabaseEnv, isKlingConfigured } from "@/lib/env";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Configuration status only — never returns values. */
export function GET() {
  return json({
    ok: true,
    supabase: Boolean(getSupabaseEnv()),
    kling: isKlingConfigured(),
    stripe: Boolean(getStripeEnv()),
  });
}
