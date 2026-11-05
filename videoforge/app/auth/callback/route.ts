import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth";
import { getUserClient } from "@/lib/supabase/server";

/**
 * PKCE callback for Google OAuth, e-mail confirmation and password recovery:
 * exchanges ?code for a session cookie and continues to ?next.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const db = await getUserClient();
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.nextUrl.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", request.nextUrl.origin));
}
