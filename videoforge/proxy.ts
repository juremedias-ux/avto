import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookies before rendering and performs an
 * optimistic redirect to /login for protected pages. This is NOT the
 * authorization check: every protected layout, route handler and server action
 * verifies the user again on the server (lib/auth.ts).
 */
const PROTECTED_PREFIXES = ["/dashboard", "/create", "/library", "/billing", "/settings", "/admin"];

function clean(value: string | undefined): string | undefined {
  const v = value?.trim().replace(/^["']|["']$/g, "");
  return v ? v : undefined;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_PUBLISHABLE_KEY);
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  const isProtected = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`));

  let signedIn = false;
  if (url && key && hasAuthCookie) {
    const supabase = createServerClient(url, key, {
      cookieOptions: { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [h, v] of Object.entries(headers ?? {})) response.headers.set(h, v);
        },
      },
    });
    try {
      const { data } = await supabase.auth.getUser();
      signedIn = Boolean(data.user);
    } catch {
      signedIn = false;
    }
  }

  if (isProtected && !signedIn) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
    const redirect = NextResponse.redirect(login);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response;
}

export const config = {
  matcher: [
    // Skip static assets and endpoints authenticated by signatures/secrets instead of cookies.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|api/stripe/webhook|api/kling/callback|api/cron|api/health).*)",
  ],
};
