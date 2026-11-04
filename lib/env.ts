import "server-only";

/**
 * Strežniške nastavitve. Nobena od teh vrednosti ne sme imeti predpone
 * NEXT_PUBLIC_, ker bi sicer končala v kodi, ki jo prejme brskalnik.
 */

export type SupabaseEnv = {
  url: string;
  publishableKey: string;
  secretKey: string;
};

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Vrne nastavitve Supabase ali null, če niso popolne. */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = read("SUPABASE_URL");
  const publishableKey = read("SUPABASE_PUBLISHABLE_KEY");
  const secretKey = read("SUPABASE_SECRET_KEY");
  if (!url || !publishableKey || !secretKey) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return null;
    }
  } catch {
    return null;
  }
  return { url, publishableKey, secretKey };
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ID lastniškega računa v Supabase Auth (UUID) ali null. */
export function getAdminUserId(): string | null {
  const id = read("ADMIN_USER_ID");
  return id && UUID.test(id) ? id.toLowerCase() : null;
}

/**
 * Skrivnost za psevdonimizacijo IP-naslovov pri omejevanju zahtev.
 * Če RATE_LIMIT_SECRET ni nastavljen, jo izpeljemo iz skrivnega ključa
 * Supabase (z ločeno oznako namena), da lastniku ni treba upravljati še
 * ene skrivnosti.
 */
export function getRateLimitSecret(): string | null {
  return read("RATE_LIMIT_SECRET") ?? read("SUPABASE_SECRET_KEY") ?? null;
}

/**
 * Glava, iz katere beremo IP-naslov obiskovalca. Na Vercelu je
 * x-forwarded-for zanesljiv, ker ga platforma prepiše. Na drugem
 * gostovanju nastavi glavo, ki jo nastavi platforma sama.
 */
export function getClientIpHeader(): string {
  return (read("CLIENT_IP_HEADER") ?? "x-forwarded-for").toLowerCase();
}
