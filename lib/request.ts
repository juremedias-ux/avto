import "server-only";

import { getClientIpHeader } from "@/lib/env";

function requestHost(headers: Headers): string | null {
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headers.get("host");
  return host ? host.toLowerCase() : null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Stroga kontrola izvora (administracija): zahteva mora imeti glavo
 * Origin z istim gostiteljem. Next.js pri strežniških akcijah izvor
 * preverja tudi sam.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin || origin === "null") return false;
  const host = requestHost(headers);
  return host !== null && hostOf(origin) === host;
}

export type OriginCheck = { ok: true } | { ok: false; reason: string };

/**
 * Kontrola izvora za javni prijavni obrazec.
 *
 * Zavrne samo zahteve, ki dokazljivo prihajajo z druge strani (glava
 * Origin ali Referer z drugim gostiteljem). Nekateri vgrajeni brskalniki
 * (npr. v aplikacijah Instagram ali Facebook) glave Origin ne pošljejo;
 * take zahteve sprejmemo, enako kot jih sprejme Next.js. Zaščito pred
 * zlorabami obrazca zagotavljata omejevanje zahtev in past za robote.
 */
export function checkPublicOrigin(headers: Headers): OriginCheck {
  const host = requestHost(headers);
  if (!host) return { ok: false, reason: "brez glave host" };

  const origin = headers.get("origin");
  if (origin && origin !== "null") {
    const originHost = hostOf(origin);
    if (originHost !== host) return { ok: false, reason: "origin z drugega gostitelja" };
    return { ok: true };
  }

  const referer = headers.get("referer");
  if (referer) {
    const refererHost = hostOf(referer);
    if (refererHost !== host) return { ok: false, reason: "referer z drugega gostitelja" };
  }
  return { ok: true };
}

/** IP-naslov obiskovalca iz glave, ki jo nastavi gostovanje. */
export function getClientIp(headers: Headers): string {
  const raw = headers.get(getClientIpHeader());
  const first = raw?.split(",")[0]?.trim();
  if (!first || first.length > 64) return "unknown";
  return first;
}
