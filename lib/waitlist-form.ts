/**
 * Skupna logika prijavnega obrazca (brez odvisnosti od strežnika).
 * Uporabljata jo strežniška akcija in odjemalska komponenta obrazca.
 */

import { messages } from "@/content";
import { parseEmail } from "@/lib/email";

export const WAITLIST_SOURCES = ["prvi_zaslon", "zakljucek"] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

export const FIELD = {
  email: "email",
  source: "vir",
  honeypot: "spletna_stran",
} as const;

export type WaitlistValues = {
  email: string;
};

export type WaitlistFieldErrors = {
  email?: string;
};

export type WaitlistFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: WaitlistFieldErrors;
  /** Ob napaki vrnemo vnos, da ga uporabnik ne izgubi. */
  values?: WaitlistValues;
  /** Narašča ob vsaki oddaji, da odjemalec ve, kdaj premakniti fokus. */
  attempt: number;
};

export const initialWaitlistState: WaitlistFormState = {
  status: "idle",
  attempt: 0,
};

export type ValidWaitlistInput = {
  email: string;
  newsletter: boolean;
  source: WaitlistSource;
};

export type WaitlistValidation =
  | { ok: true; data: ValidWaitlistInput }
  | { ok: false; fieldErrors: WaitlistFieldErrors };

function isSource(value: unknown): value is WaitlistSource {
  return (
    typeof value === "string" &&
    (WAITLIST_SOURCES as readonly string[]).includes(value)
  );
}

/** Prebere surove vrednosti iz FormData (brez preverjanja). */
export function readWaitlistValues(formData: FormData): WaitlistValues {
  const email = formData.get(FIELD.email);
  return {
    email: typeof email === "string" ? email.slice(0, 320) : "",
  };
}

/**
 * Strežniško in odjemalsko preverjanje vnosa.
 * Privolitev za obvestilo ob zagonu je dana z oddajo obrazca (klik na
 * gumb »Obvesti me ob zagonu«). Obrazec privolitve za novice ne ponuja,
 * zato se ta vedno shrani kot »ne«, ne glede na poslane podatke.
 */
export function validateWaitlist(input: { email: unknown; source: unknown }): WaitlistValidation {
  const parsed = parseEmail(input.email);
  if (!parsed.ok) return { ok: false, fieldErrors: { email: messages.invalidEmail } };

  return {
    ok: true,
    data: {
      email: parsed.email,
      newsletter: false,
      source: isSource(input.source) ? input.source : "prvi_zaslon",
    },
  };
}
