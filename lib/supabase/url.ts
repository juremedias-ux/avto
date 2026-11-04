/**
 * Pomožne funkcije za nastavitve Supabase (brez skrivnosti in brez
 * odvisnosti od strežniškega okolja; uporablja jih tudi proxy.ts).
 */

/** Odstrani robne presledke in morebitne narekovaje okoli vrednosti. */
export function cleanEnvValue(raw: string | undefined): string | undefined {
  const value = raw?.trim().replace(/^(["'])(.*)\1$/, "$2").trim();
  return value ? value : undefined;
}

/**
 * Uskladi naslov projekta Supabase: doda https://, če manjka, in odstrani
 * končno poševnico ali pripono /rest/v1 oziroma /auth/v1.
 */
export function normalizeSupabaseUrl(raw: string): string | null {
  let value = raw.trim().replace(/\/+$/, "").replace(/\/(rest|auth)\/v1$/i, "");
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    const parsed = new URL(value);
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.protocol !== "https:" && !local) return null;
    return parsed.origin;
  } catch {
    return null;
  }
}
