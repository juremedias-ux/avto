import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexingAllowed } from "@/lib/site";

/**
 * robots.txt: dokler indeksiranje ni vklopljeno (ALLOW_INDEXING=true),
 * iskalnikom prepovemo celotno stran. Administracija je vedno izključena.
 * Opomba: robots.txt ni varnostna zaščita.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  if (!isIndexingAllowed()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin"] }],
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.origin,
  };
}
