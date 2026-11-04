import "server-only";

import nodemailer from "nodemailer";
import { brand } from "@/content";
import { getNotifyEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import type { WaitlistSource } from "@/lib/waitlist-form";

/**
 * Obvestilo lastniku ob novi prijavi.
 *
 * Pošlje se samo za nov naslov (ne ob ponovni oddaji istega naslova),
 * po odzivu obiskovalcu, zato napaka pri pošiljanju ne vpliva na prijavo.
 * V dnevnike se zapiše samo koda napake, nikoli e-poštni naslov.
 */

export type SignupNotice = {
  email: string;
  newsletter: boolean;
  source: WaitlistSource;
  createdAt: Date;
};

const SOURCE_LABEL: Record<WaitlistSource, string> = {
  prvi_zaslon: "prvi zaslon",
  zakljucek: "zaključek strani",
};

/** Sestavi zadevo in besedilo sporočila (samo navadno besedilo). */
export function buildSignupMessage(notice: SignupNotice, adminUrl: string) {
  const subject = `Nova prijava – ${brand.name}`;
  const text = [
    `Nova prijava na obvestilo ob zagonu ${brand.name}.`,
    "",
    `E-poštni naslov: ${notice.email}`,
    `Nasveti, novice in ponudbe: ${notice.newsletter ? "da" : "ne"}`,
    `Obrazec: ${SOURCE_LABEL[notice.source]}`,
    `Čas: ${formatDateTime(notice.createdAt.toISOString())}`,
    "",
    `Vse prijave: ${adminUrl}`,
    "",
    "Lastništvo naslova ni preverjeno (prijava brez potrditvenega sporočila).",
  ].join("\n");
  return { subject, text };
}

export async function sendSignupNotification(notice: SignupNotice): Promise<"sent" | "skipped" | "failed"> {
  const env = getNotifyEnv();
  if (!env) return "skipped";

  const adminUrl = new URL("/admin", getSiteUrl()).toString();
  const { subject, text } = buildSignupMessage(notice, adminUrl);

  const transport = nodemailer.createTransport({
    host: env.host,
    port: env.port,
    secure: env.port === 465,
    requireTLS: env.port === 587,
    auth: { user: env.user, pass: env.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    await transport.sendMail({ from: env.from, to: env.to, subject, text });
    return "sent";
  } catch (error) {
    const code = (error as { code?: unknown })?.code;
    console.error("[obvestilo] pošiljanje ni uspelo", typeof code === "string" ? code : "unknown");
    return "failed";
  } finally {
    transport.close();
  }
}
