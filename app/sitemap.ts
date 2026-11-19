import type { MetadataRoute } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { isPlatformPublic } from "@/cms/access";
import { isCmsConfigured } from "@/lib/cms-env";
import { routes } from "@/lib/platform";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

/**
 * Zemljevid strani. Strani platforme so vključene samo, ko je platforma
 * javna (PLATFORM_PUBLIC=true), in samo objavljene vsebine.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const at = (path: string, extra: Partial<Entry> = {}): Entry => ({ url: new URL(path, site).toString(), ...extra });
  const base: MetadataRoute.Sitemap = [
    at("/", { changeFrequency: "weekly", priority: 1 }),
    at(routes.privacy, { changeFrequency: "yearly", priority: 0.3 }),
  ];
  if (!isPlatformPublic() || !isCmsConfigured()) return base;

  try {
    const payload = await getPayload({ config });
    const q = { overrideAccess: false, limit: 1000, depth: 1, pagination: false } as const;
    const [articles, videos, paths, categories, products, topics] = await Promise.all([
      payload.find({ collection: "clanki", ...q, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: "videi", ...q, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: "ucne-poti", ...q, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: "kategorije-izdelkov", ...q, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: "izdelki", ...q, select: { slug: true, updatedAt: true, kategorija: true } }),
      payload.find({ collection: "teme", ...q, depth: 0, select: { slug: true, updatedAt: true } }),
    ]);
    const modified = (d: { updatedAt?: string | null }) => (d.updatedAt ? new Date(d.updatedAt) : undefined);
    return [
      ...base,
      ...[routes.learn, routes.guides, routes.roadmap, routes.products, routes.about, routes.contact, routes.terms].map((p) =>
        at(p, { changeFrequency: "weekly", priority: 0.8 }),
      ),
      ...articles.docs.map((d) => at(routes.article(d.slug ?? ""), { lastModified: modified(d), priority: 0.7 })),
      ...videos.docs.map((d) => at(routes.video(d.slug ?? ""), { lastModified: modified(d), priority: 0.7 })),
      ...paths.docs.map((d) => at(routes.path(d.slug ?? ""), { lastModified: modified(d), priority: 0.7 })),
      ...topics.docs.map((d) => at(routes.topic(d.slug ?? ""), { lastModified: modified(d), priority: 0.5 })),
      ...categories.docs.map((d) => at(routes.category(d.slug ?? ""), { lastModified: modified(d), priority: 0.6 })),
      ...products.docs.flatMap((d) => {
        const category = typeof d.kategorija === "object" && d.kategorija ? d.kategorija.slug : null;
        return category ? [at(routes.product(category, d.slug ?? ""), { lastModified: modified(d), priority: 0.6 })] : [];
      }),
    ];
  } catch {
    console.error("[sitemap] branje vsebin ni uspelo");
    return base;
  }
}
