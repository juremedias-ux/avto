/**
 * Normalizacija in preverjanje e-poštnih naslovov.
 *
 * Pravila:
 * - odstranimo presledke na začetku in koncu ter vse nevidne presledke,
 * - celoten naslov pretvorimo v male črke (ASCII),
 * - pik in dodatkov za znakom "+" NE odstranjujemo,
 * - sprejemamo naslove v obliki, ki jo določa HTML-standard za
 *   <input type="email"> (samo znaki ASCII), z vsaj eno piko v domeni.
 *
 * Modul je brez odvisnosti in ga uporabljata strežnik in brskalnik.
 */

export const EMAIL_MAX_LENGTH = 254;
export const EMAIL_LOCAL_MAX_LENGTH = 64;
export const EMAIL_LABEL_MAX_LENGTH = 63;

/** Najdaljši vhod, ki ga sploh obdelamo (zaščita pred velikimi vnosi). */
export const EMAIL_INPUT_MAX_LENGTH = 320;

const LOCAL_PART = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const TOP_LEVEL = /^(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$/;

/** Odstrani robne in nevidne presledke ter pretvori v male črke. */
export function normalizeEmail(raw: string): string {
  return raw
    .replace(/[​-‍⁠﻿]/g, "")
    .trim()
    .toLowerCase();
}

/** Preveri že normaliziran naslov. */
export function isValidEmail(email: string): boolean {
  if (email.length < 6 || email.length > EMAIL_MAX_LENGTH) return false;

  const at = email.lastIndexOf("@");
  if (at <= 0 || at !== email.indexOf("@")) return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  if (local.length > EMAIL_LOCAL_MAX_LENGTH || !LOCAL_PART.test(local)) {
    return false;
  }

  const labels = domain.split(".");
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (label.length === 0 || label.length > EMAIL_LABEL_MAX_LENGTH) {
      return false;
    }
    if (!DOMAIN_LABEL.test(label)) return false;
  }

  return TOP_LEVEL.test(labels[labels.length - 1]);
}

export type ParsedEmail =
  | { ok: true; email: string }
  | { ok: false; reason: "missing" | "too_long" | "invalid" };

/** Sprejme poljuben vhod iz obrazca in vrne normaliziran naslov ali razlog. */
export function parseEmail(input: unknown): ParsedEmail {
  if (typeof input !== "string") return { ok: false, reason: "missing" };
  if (input.length > EMAIL_INPUT_MAX_LENGTH) {
    return { ok: false, reason: "too_long" };
  }
  const email = normalizeEmail(input);
  if (email.length === 0) return { ok: false, reason: "missing" };
  if (email.length > EMAIL_MAX_LENGTH) return { ok: false, reason: "too_long" };
  if (!isValidEmail(email)) return { ok: false, reason: "invalid" };
  return { ok: true, email };
}
