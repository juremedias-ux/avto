import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return [
    { url: new URL("/", siteUrl).toString(), changeFrequency: "monthly", priority: 1 },
    { url: new URL("/zasebnost", siteUrl).toString(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
