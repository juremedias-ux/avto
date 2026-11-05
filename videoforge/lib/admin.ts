import "server-only";

export const ADMIN_PAGE_SIZE = 50;

export function adminPage(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
}

/** Escapes a user search term for PostgREST ilike filters inside or(). */
export function ilikeTerm(raw: string | undefined): string | null {
  const term = (raw ?? "").trim().slice(0, 100);
  if (!term) return null;
  // Remove characters with meaning in PostgREST filter syntax and LIKE patterns.
  const cleaned = term.replace(/[,()*%_\\:"']/g, " ").trim();
  return cleaned ? `*${cleaned}*` : null;
}
