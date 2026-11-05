import "server-only";

import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, dictionaries, isLocale, LOCALE_COOKIE, negotiateLocale, type Locale } from "@/lib/i18n/config";

/** Locale from the vf_locale cookie, else Accept-Language, else Slovenian. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const headerStore = await headers();
  return negotiateLocale(headerStore.get("accept-language")) ?? DEFAULT_LOCALE;
}

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
