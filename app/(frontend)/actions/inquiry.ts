"use server";

import { headers } from "next/headers";
import { getViewer } from "@/lib/cms";
import {
  INQUIRY_FIELD,
  INQUIRY_LIMITS,
  INQUIRY_NOTICE_VERSION,
  inquiryMessages,
  parseInquiryItems,
  validateInquiry,
  type InquiryFormState,
} from "@/lib/inquiry-form";
import { checkRateLimit } from "@/lib/rate-limit";
import { checkPublicOrigin, getClientIp } from "@/lib/request";

function str(value: FormDataEntryValue | null, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/**
 * Oddaja povpraševanja ali vprašanja. Shrani se v urejevalnik (zbirka
 * Povpraševanja), kjer ga vidijo samo uredniki. Plačila ni.
 */
export async function submitInquiry(previous: InquiryFormState, formData: FormData): Promise<InquiryFormState> {
  const attempt = (previous?.attempt ?? 0) + 1;
  const values = {
    ime: str(formData.get(INQUIRY_FIELD.name), INQUIRY_LIMITS.name + 1),
    email: str(formData.get(INQUIRY_FIELD.email), 320),
    sporocilo: str(formData.get(INQUIRY_FIELD.message), INQUIRY_LIMITS.message + 1),
  };
  const failure = (message: string): InquiryFormState => ({ status: "error", message, values, attempt });

  try {
    const requestHeaders = await headers();
    const origin = checkPublicOrigin(requestHeaders);
    if (!origin.ok) {
      console.warn("[povprasevanje] zahteva zavrnjena:", origin.reason);
      return failure(inquiryMessages.failed);
    }

    // Past za robote: enak odziv kot uspeh, nič se ne shrani.
    const trap = formData.get(INQUIRY_FIELD.honeypot);
    if (typeof trap === "string" && trap.trim() !== "") {
      return { status: "success", message: inquiryMessages.success, attempt };
    }

    // Izdelki s seznama ali en izdelek iz obrazca za vprašanje o izdelku.
    const items = parseInquiryItems(formData.get(INQUIRY_FIELD.items));
    const single = Number(formData.get(INQUIRY_FIELD.product));
    if (items.length === 0 && Number.isSafeInteger(single) && single > 0) items.push({ id: single, kolicina: 1 });

    const validation = validateInquiry({
      vrsta: formData.get(INQUIRY_FIELD.kind),
      ime: values.ime,
      email: values.email,
      sporocilo: values.sporocilo,
      izdelki: items,
    });
    if (!validation.ok) return { status: "error", fieldErrors: validation.fieldErrors, values, attempt };

    // Obrazec deluje samo, ko je platforma javna (ali za prijavljene urednike).
    const viewer = await getViewer();
    if (!viewer) return failure(inquiryMessages.failed);

    const limit = await checkRateLimit("inquiry", getClientIp(requestHeaders));
    if (limit === "limited") return failure(inquiryMessages.rateLimited);
    if (limit === "error") return failure(inquiryMessages.failed);

    const { data } = validation;
    const ids = data.izdelki.map((item) => item.id);
    const found = ids.length
      ? await viewer.payload.find({
          collection: "izdelki",
          overrideAccess: false,
          user: viewer.user ?? undefined,
          where: { id: { in: ids } },
          limit: INQUIRY_LIMITS.items,
          depth: 0,
          select: { naziv: true },
        })
      : { docs: [] as { id: number; naziv: string }[] };
    const names = new Map(found.docs.map((doc) => [doc.id, doc.naziv]));
    const rows = data.izdelki
      .filter((item) => names.has(item.id))
      .map((item) => ({ izdelek: item.id, naziv: names.get(item.id) ?? "", kolicina: item.kolicina }));

    if (data.vrsta !== "vprasanje" && rows.length === 0) {
      return { status: "error", fieldErrors: { izdelki: inquiryMessages.itemsRequired }, values, attempt };
    }

    await viewer.payload.create({
      collection: "povprasevanja",
      overrideAccess: true,
      data: {
        vrsta: data.vrsta,
        ime: data.ime,
        email: data.email,
        sporocilo: data.sporocilo,
        izdelki: rows,
        stanje: "nova",
        besediloObvestila: INQUIRY_NOTICE_VERSION,
      },
    });

    return { status: "success", message: inquiryMessages.success, attempt };
  } catch {
    console.error("[povprasevanje] shranjevanje ni uspelo");
    return failure(inquiryMessages.failed);
  }
}
