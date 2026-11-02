import "server-only";

import { getClientIpHeader } from "@/lib/env";

/**
 * Preverjanje izvora spreminjajočih zahtev.
 * Next.js pri strežniških akcijah že sam primerja glavi Origin in Host;
 * to je dodatna, eksplicitna kontrola v naši kodi.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin || origin === "null") return false;

  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/** IP-naslov obiskovalca iz glave, ki jo nastavi gostovanje. */
export function getClientIp(headers: Headers): string {
  const raw = headers.get(getClientIpHeader());
  const first = raw?.split(",")[0]?.trim();
  if (!first || first.length > 64) return "unknown";
  return first;
}
