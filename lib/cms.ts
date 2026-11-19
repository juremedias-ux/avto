import "server-only";

import config from "@payload-config";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPayload, type DataFromCollectionSlug, type Payload, type Where } from "payload";
import { isPlatformPublic } from "@/cms/access";
import { isCmsConfigured } from "@/lib/cms-env";
import type { Clanki, Uredniki, Videi } from "@/payload-types";

export type Viewer = {
  payload: Payload;
  user: Uredniki | null;
  /** Platforma še ni javna, stran gleda prijavljen urednik. */
  preview: boolean;
};

/**
 * Kdo gleda stran. Vrne null, če urejevalnik ni nastavljen ali platforma
 * ni javna in obiskovalec ni prijavljen urednik.
 */
export const getViewer = cache(async function getViewer(): Promise<Viewer | null> {
  if (!isCmsConfigured()) return null;
  const requestHeaders = await headers();
  // Platforma ni javna in ni piškotka urednika: brez povezave z bazo.
  if (!isPlatformPublic() && !/(?:^|;\s*)payload-token=/.test(requestHeaders.get("cookie") ?? "")) {
    return null;
  }
  let payload: Payload;
  try {
    payload = await getPayload({ config });
  } catch {
    console.error("[cms] povezava z urejevalnikom ni uspela");
    return null;
  }
  let user: Uredniki | null = null;
  try {
    const result = await payload.auth({ headers: requestHeaders });
    user = (result.user as Uredniki | null) ?? null;
  } catch {
    user = null;
  }
  if (isPlatformPublic()) return { payload, user, preview: false };
  if (user) return { payload, user, preview: true };
  return null;
});

/** Za strani platforme: brez dostopa vrne 404 (stran »ne obstaja«). */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) notFound();
  return viewer;
}

/** Skupne nastavitve poizvedb: pravila dostopa zbirk veljajo tudi tu. */
export function queryOptions(viewer: Viewer) {
  return { overrideAccess: false, user: viewer.user ?? undefined } as const;
}

export function bySlug(slug: string): Where {
  return { slug: { equals: slug } };
}

export { docs, isDoc, polyDocs } from "@/lib/cms-shared";

export type ContentItem = { kind: "clanek"; doc: Clanki } | { kind: "video"; doc: Videi };

/** Članki in videi skupaj, urejeni od najnovejših. */
export async function listContent(
  viewer: Viewer,
  options: { where?: Where; limit?: number; kinds?: ("clanek" | "video")[] } = {},
): Promise<ContentItem[]> {
  const { where, limit = 60, kinds = ["clanek", "video"] } = options;
  const base = { ...queryOptions(viewer), where, limit, depth: 1, sort: "-updatedAt" } as const;
  const [articles, videos] = await Promise.all([
    kinds.includes("clanek") ? viewer.payload.find({ collection: "clanki", ...base }) : null,
    kinds.includes("video") ? viewer.payload.find({ collection: "videi", ...base }) : null,
  ]);
  const items: ContentItem[] = [
    ...(articles?.docs ?? []).map((doc) => ({ kind: "clanek" as const, doc })),
    ...(videos?.docs ?? []).map((doc) => ({ kind: "video" as const, doc })),
  ];
  return items
    .sort((a, b) => Date.parse(b.doc.updatedAt) - Date.parse(a.doc.updatedAt))
    .slice(0, limit);
}

type SlugCollection = "clanki" | "videi" | "ucne-poti" | "izdelki" | "kategorije-izdelkov" | "teme" | "faze";

/**
 * En dokument po slugu (z dostopnimi pravili). Rezultat je v predpomnilniku
 * zahteve, zato ga generateMetadata in stran preberata samo enkrat.
 */
export const findBySlug = cache(async function findBySlug<C extends SlugCollection>(
  collection: C,
  slug: string,
  depth = 2,
): Promise<DataFromCollectionSlug<C> | null> {
  const viewer = await getViewer();
  if (!viewer) return null;
  const result = await viewer.payload.find({
    collection,
    ...queryOptions(viewer),
    where: bySlug(slug),
    limit: 1,
    depth,
  });
  return (result.docs[0] as DataFromCollectionSlug<C> | undefined) ?? null;
});
