/** Poti in oznake platforme (en vir resnice za URL-je in besedila oznak). */

export const routes = {
  learn: "/ucenje",
  topic: (slug: string) => `/ucenje/teme/${slug}`,
  article: (slug: string) => `/ucenje/clanki/${slug}`,
  video: (slug: string) => `/ucenje/videi/${slug}`,
  guides: "/vodici",
  roadmap: "/vodici/nacrt-gradnje",
  path: (slug: string) => `/vodici/${slug}`,
  products: "/izdelki",
  category: (slug: string) => `/izdelki/${slug}`,
  product: (category: string, slug: string) => `/izdelki/${category}/${slug}`,
  search: "/iskanje",
  inquiry: "/povprasevanje",
  about: "/o-nas",
  contact: "/kontakt",
  terms: "/pogoji",
  privacy: "/zasebnost",
} as const;

export const mainNav = [
  { href: routes.learn, label: "Učenje" },
  { href: routes.products, label: "Izdelki" },
  { href: routes.guides, label: "Vodiči gradnje" },
  { href: routes.about, label: "O nas" },
  { href: routes.contact, label: "Kontakt" },
] as const;

export const difficultyLabel: Record<string, string> = {
  zacetnik: "Začetnik",
  srednje: "Srednje zahtevno",
  napredno: "Napredno",
};

export const statusLabel: Record<string, string> = {
  "na-zalogi": "Na zalogi",
  predprodaja: "Predprodaja",
  "na-povprasevanje": "Na povpraševanje",
  kmalu: "Kmalu na voljo",
};

export const installLabel: Record<string, string> = {
  preprosta: "Preprosta vgradnja",
  srednja: "Potrebno nekaj izkušenj",
  strokovna: "Priporočena strokovna vgradnja",
};

export function minutes(value: number | null | undefined): string {
  if (!value) return "";
  return `${Math.round(value)} min`;
}

const priceFormat = new Intl.NumberFormat("sl-SI", { style: "currency", currency: "EUR" });

export function formatPrice(value: number | null | undefined): string | null {
  return typeof value === "number" ? priceFormat.format(value) : null;
}

/** Slovenska množina: plural(2, ["izdelek", "izdelka", "izdelki", "izdelkov"]) → "2 izdelka". */
export function plural(n: number, forms: [one: string, two: string, few: string, many: string]): string {
  const mod = Math.abs(n) % 100;
  const form = mod === 1 ? forms[0] : mod === 2 ? forms[1] : mod === 3 || mod === 4 ? forms[2] : forms[3];
  return `${n} ${form}`;
}
