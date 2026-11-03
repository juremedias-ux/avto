import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Nastavitve piškotkov za lastniško sejo.
 * - httpOnly: JavaScript v brskalniku do seje nima dostopa,
 * - path /admin: piškotek se pošilja samo administraciji,
 * - secure v produkciji, sameSite=lax.
 */
export const adminCookieOptions: CookieOptionsWithName = {
  path: "/admin",
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};
