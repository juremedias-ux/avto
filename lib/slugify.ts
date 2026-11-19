/**
 * Pretvori naslov v URL (slug): male črke, brez šumnikov in posebnih
 * znakov, besede ločene z vezajem. Primer: »Električni sistem 12 V« →
 * »elektricni-sistem-12-v«.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/đ/gi, "d")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " in ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
