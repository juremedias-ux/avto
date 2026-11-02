import "server-only";

import { createHash } from "node:crypto";
import { consent } from "@/content";

/**
 * Različica besedila privolitev, ki se shrani ob vsaki prijavi.
 * Oblika: "<ročna različica>+<prvih 8 znakov SHA-256 besedila>", npr. "v1+1a2b3c4d".
 * Tako je vsaka sprememba besedila v bazi ločljiva, tudi če ročne
 * različice pozabiš povečati.
 */
export function consentFingerprint(texts: readonly string[]): string {
  return createHash("sha256").update(texts.join("\n")).digest("hex").slice(0, 8);
}

export const CONSENT_TEXT_VERSION = `${consent.version}+${consentFingerprint([
  consent.launch,
  consent.newsletter,
  `${consent.infoBeforeLink}${consent.infoLink}${consent.infoAfterLink}`,
])}`;
