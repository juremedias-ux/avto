import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminCookieOptions } from "@/lib/supabase/cookies";
import { cleanEnvValue, normalizeSupabaseUrl } from "@/lib/supabase/url";

/**
 * Proxy za /admin: osveži sejo Supabase (piškotke) pred izrisom strani.
 * To NI preverjanje pooblastil – to se izvede na strežniku v vsaki
 * zaščiteni strani, akciji in poti (lib/auth.ts).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const rawUrl = cleanEnvValue(process.env.SUPABASE_URL);
  const url = rawUrl ? normalizeSupabaseUrl(rawUrl) : null;
  const publishableKey = cleanEnvValue(process.env.SUPABASE_PUBLISHABLE_KEY);

  if (url && publishableKey) {
    const supabase = createServerClient(url, publishableKey, {
      cookieOptions: adminCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers ?? {})) {
            response.headers.set(key, value);
          }
        },
      },
    });

    try {
      await supabase.auth.getUser();
    } catch {
      // Strani same obravnavajo neveljavno ali potečeno sejo.
    }
  }

  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
