import type { Metadata } from "next";
import { brand } from "@/content";
import { isDoc } from "@/lib/cms-shared";
import type { Mediji } from "@/payload-types";

type PageMeta = {
  title: string;
  description?: string | null;
  path: string;
  /** Slika iz urejevalnika (za deljenje na omrežjih). */
  image?: unknown;
  type?: "website" | "article";
  /** Strani, ki jih iskalniki ne smejo indeksirati (npr. iskanje). */
  noindex?: boolean;
};

/** Enotni metapodatki strani platforme (naslov, opis, kanonični URL, OG). */
export function pageMetadata({ title, description, path, image, type = "website", noindex }: PageMeta): Metadata {
  const desc = description?.trim() || brand.description;
  const img = isDoc<Mediji>(image) && image.url ? [{ url: image.url, alt: image.alt ?? "" }] : undefined;
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { type, locale: "sl_SI", siteName: brand.name, title, description: desc, url: path, images: img },
    twitter: { card: img ? "summary_large_image" : "summary", title, description: desc },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Naslov in opis iz skupine SEO z rezervo na običajna polja. */
export function seoOf(doc: { seo?: { naslov?: string | null; opis?: string | null } | null }, fallbackTitle: string, fallbackDescription?: string | null) {
  return {
    title: doc.seo?.naslov?.trim() || fallbackTitle,
    description: doc.seo?.opis?.trim() || fallbackDescription || undefined,
  };
}
