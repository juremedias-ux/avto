/**
 * Preverjanje povpraševanj in vprašanj (brez strežniških odvisnosti).
 * Uporabljata ga strežniška akcija in testi.
 */

import { parseEmail } from "@/lib/email";

export const INQUIRY_KINDS = ["povprasevanje", "vprasanje", "rezervacija"] as const;
export type InquiryKind = (typeof INQUIRY_KINDS)[number];

export const INQUIRY_FIELD = {
  kind: "vrsta",
  name: "ime",
  email: "email",
  message: "sporocilo",
  items: "izdelki",
  product: "izdelek",
  honeypot: "spletna_stran",
} as const;

export const INQUIRY_LIMITS = {
  name: 100,
  message: 3000,
  items: 30,
  quantity: 99,
} as const;

export const inquiryMessages = {
  success: "Hvala! Sporočilo smo prejeli. Odgovor pošljemo na vpisani e-poštni naslov.",
  invalidEmail: "Vpiši veljaven e-poštni naslov.",
  nameTooLong: `Ime je predolgo (največ ${INQUIRY_LIMITS.name} znakov).`,
  messageRequired: "Napiši vprašanje.",
  messageTooLong: `Sporočilo je predolgo (največ ${INQUIRY_LIMITS.message} znakov).`,
  itemsRequired: "Seznam povpraševanja je prazen. Dodaj vsaj en izdelek.",
  rateLimited: "Poslal si več sporočil v kratkem času. Počakaj nekaj minut in poskusi znova.",
  failed: "Sporočila trenutno ni bilo mogoče poslati. Poskusi znova ali piši na e-pošto.",
} as const;

export type InquiryItemInput = { id: number; kolicina: number };

export type InquiryFieldErrors = Partial<Record<"email" | "ime" | "sporocilo" | "izdelki", string>>;

export type InquiryFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: InquiryFieldErrors;
  values?: { ime: string; email: string; sporocilo: string };
  attempt: number;
};

export const initialInquiryState: InquiryFormState = { status: "idle", attempt: 0 };

export type ValidInquiry = {
  vrsta: InquiryKind;
  ime: string | null;
  email: string;
  sporocilo: string | null;
  izdelki: InquiryItemInput[];
};

export type InquiryValidation = { ok: true; data: ValidInquiry } | { ok: false; fieldErrors: InquiryFieldErrors };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, max + 1) : "";
}

/** Seznam izdelkov iz skritega polja (JSON). Neveljavne vnose izpusti. */
export function parseInquiryItems(raw: unknown): InquiryItemInput[] {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 5000) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<number>();
  const items: InquiryItemInput[] = [];
  for (const entry of parsed) {
    if (items.length >= INQUIRY_LIMITS.items) break;
    const id = Number((entry as { id?: unknown })?.id);
    const qty = Math.floor(Number((entry as { kolicina?: unknown })?.kolicina));
    if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    items.push({ id, kolicina: Number.isFinite(qty) ? Math.min(INQUIRY_LIMITS.quantity, Math.max(1, qty)) : 1 });
  }
  return items;
}

export function validateInquiry(input: {
  vrsta: unknown;
  ime: unknown;
  email: unknown;
  sporocilo: unknown;
  izdelki: unknown;
}): InquiryValidation {
  const vrsta: InquiryKind = INQUIRY_KINDS.includes(input.vrsta as InquiryKind) ? (input.vrsta as InquiryKind) : "vprasanje";
  const fieldErrors: InquiryFieldErrors = {};

  const ime = text(input.ime, INQUIRY_LIMITS.name);
  if (ime.length > INQUIRY_LIMITS.name) fieldErrors.ime = inquiryMessages.nameTooLong;

  const parsed = parseEmail(input.email);
  if (!parsed.ok) fieldErrors.email = inquiryMessages.invalidEmail;

  const sporocilo = text(input.sporocilo, INQUIRY_LIMITS.message);
  if (sporocilo.length > INQUIRY_LIMITS.message) fieldErrors.sporocilo = inquiryMessages.messageTooLong;
  else if (vrsta === "vprasanje" && sporocilo.length < 2) fieldErrors.sporocilo = inquiryMessages.messageRequired;

  const izdelki = Array.isArray(input.izdelki) ? (input.izdelki as InquiryItemInput[]) : parseInquiryItems(input.izdelki);
  if (vrsta !== "vprasanje" && izdelki.length === 0) fieldErrors.izdelki = inquiryMessages.itemsRequired;

  if (Object.keys(fieldErrors).length > 0 || !parsed.ok) return { ok: false, fieldErrors };

  return {
    ok: true,
    data: { vrsta, ime: ime || null, email: parsed.email, sporocilo: sporocilo || null, izdelki },
  };
}

/** Različica obvestila o obdelavi podatkov ob obrazcu (shrani se ob oddaji). */
export const INQUIRY_NOTICE_VERSION = "povprasevanje-v1";
