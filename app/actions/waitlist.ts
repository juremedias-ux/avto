"use server";

import { headers } from "next/headers";
import { messages } from "@/content";
import { CONSENT_TEXT_VERSION } from "@/lib/consent";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkPublicOrigin, getClientIp } from "@/lib/request";
import { addToWaitlist } from "@/lib/waitlist";
import {
  FIELD,
  readWaitlistValues,
  validateWaitlist,
  type WaitlistFormState,
} from "@/lib/waitlist-form";

/**
 * Strežniška akcija za oba prikaza prijavnega obrazca.
 * Za novo in že obstoječo prijavo vrne enak nevtralen odziv.
 */
export async function subscribeToWaitlist(
  previous: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const values = readWaitlistValues(formData);

  const failure = (message: string): WaitlistFormState => ({
    status: "error",
    message,
    values,
    attempt,
  });

  try {
    const requestHeaders = await headers();
    const origin = checkPublicOrigin(requestHeaders);
    if (!origin.ok) {
      console.warn("[waitlist] zahteva zavrnjena:", origin.reason);
      return failure(messages.saveFailed);
    }

    // Past za robote: izpolnjeno skrito polje. Odziv je enak uspehu,
    // podatkov pa ne shranimo.
    const trap = formData.get(FIELD.honeypot);
    if (typeof trap === "string" && trap.trim() !== "") {
      return { status: "success", message: messages.success, attempt };
    }

    const validation = validateWaitlist({
      email: values.email,
      newsletter: values.newsletter,
      source: formData.get(FIELD.source),
    });
    if (!validation.ok) {
      return {
        status: "error",
        fieldErrors: validation.fieldErrors,
        values,
        attempt,
      };
    }

    const limit = await checkRateLimit("waitlist", getClientIp(requestHeaders));
    if (limit === "limited") return failure(messages.rateLimited);
    if (limit === "error") return failure(messages.saveFailed);

    const result = await addToWaitlist(validation.data, CONSENT_TEXT_VERSION);
    if (result !== "ok") return failure(messages.saveFailed);

    return { status: "success", message: messages.success, attempt };
  } catch {
    console.error("[waitlist] nepričakovana napaka pri oddaji");
    return failure(messages.saveFailed);
  }
}
