import { en, type Dictionary } from "@/lib/i18n/en";
import { sl } from "@/lib/i18n/sl";

export const LOCALES = ["sl", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "sl";
export const LOCALE_COOKIE = "vf_locale";

export const dictionaries: Record<Locale, Dictionary> = { sl, en };

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "sl" || value === "en";
}

/** Replaces {name} placeholders. */
export function format(template: string, values: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match,
  );
}

/** Slovenian has four plural forms (one, two, few, other); English two. */
export function plural(forms: Dictionary["credits"], n: number, locale: Locale): string {
  const category = new Intl.PluralRules(locale === "sl" ? "sl-SI" : "en").select(n);
  const template = category === "one" || category === "two" || category === "few" ? forms[category] : forms.other;
  return format(template, { n: new Intl.NumberFormat(locale === "sl" ? "sl-SI" : "en-IE").format(n) });
}

export function intlLocale(locale: Locale): string {
  return locale === "sl" ? "sl-SI" : "en-IE";
}

export function formatDateTime(value: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium", timeStyle: "short" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function formatDate(value: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function formatUsd(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

/** Picks the best supported locale from an Accept-Language header. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { tag: (tag ?? "").toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export type { Dictionary };
