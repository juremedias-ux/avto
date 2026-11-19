import { getAdminStatus } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { localDateStamp, toLocalIso } from "@/lib/format";
import { exportWaitlist, type ConsentPurpose } from "@/lib/waitlist";

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};

function textResponse(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { ...PRIVATE_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * CSV-izvoz aktivnih privolitev za izbrani namen.
 * /admin/izvoz/zagon  – obvestilo ob zagonu
 * /admin/izvoz/novice – nasveti, novice in ponudbe
 * Preklicane privolitve niso vključene.
 */
export async function GET(_request: Request, context: { params: Promise<{ namen: string }> }) {
  const status = await getAdminStatus();
  if (status.status === "unauthenticated") return textResponse("Prijava je potrebna.", 401);
  if (status.status !== "ok") return textResponse("Ni dostopa.", 403);

  const { namen } = await context.params;
  if (namen !== "zagon" && namen !== "novice") return textResponse("Neznan izvoz.", 404);
  const purpose: ConsentPurpose = namen;

  const rows = await exportWaitlist(status.session, purpose);
  if (!rows) return textResponse("Izvoza trenutno ni bilo mogoče pripraviti.", 503);

  const header =
    purpose === "zagon"
      ? ["email", "prijava", "privolitev_zagon", "razlicica_besedila", "vir"]
      : ["email", "prijava", "privolitev_novice", "razlicica_besedila", "vir"];

  const body = toCsv(
    header,
    rows.map((row) => [
      row.email,
      toLocalIso(row.created_at),
      toLocalIso(purpose === "zagon" ? row.launch_consent_at : row.newsletter_consent_at),
      row.consent_text_version,
      row.source,
    ]),
  );

  const filename = `gradimocamper-${purpose}-${localDateStamp()}.csv`;
  return new Response(body, {
    status: 200,
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
