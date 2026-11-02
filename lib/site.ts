/**
 * Javna konfiguracija strani: osnovni URL in pravila indeksiranja.
 * Tu ni skrivnosti.
 */

/**
 * Osnovni URL strani.
 * 1. NEXT_PUBLIC_SITE_URL, če je nastavljen (priporočeno za produkcijo).
 * 2. Na Vercelu: produkcijski naslov projekta oziroma naslov predogleda.
 * 3. Lokalno: http://localhost:<PORT ali 3000>.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit);
    } catch {
      // Neveljaven naslov ne sme ustaviti strani; uporabimo naslednjo možnost.
    }
  }

  const vercelEnv = process.env.VERCEL_ENV;
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelEnv === "production" && productionHost) {
    return new URL(`https://${productionHost}`);
  }

  const deploymentHost = process.env.VERCEL_URL;
  if (deploymentHost) return new URL(`https://${deploymentHost}`);

  return new URL(`http://localhost:${process.env.PORT || "3000"}`);
}

/**
 * Indeksiranje v iskalnikih je privzeto izklopljeno.
 * Vklopi ga lastnik z ALLOW_INDEXING=true šele ob javni objavi.
 * Predogledi na Vercelu se nikoli ne indeksirajo.
 */
export function isIndexingAllowed(): boolean {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return false;
  }
  return process.env.ALLOW_INDEXING === "true";
}
