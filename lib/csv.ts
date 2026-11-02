/**
 * Varen CSV za preglednice (Excel, LibreOffice, Google Preglednice).
 * - UTF-8 z oznako BOM, da Excel pravilno prikaže šumnike,
 * - ločilo podpičje (privzeto za slovenske nastavitve Excela),
 * - vse vrednosti v narekovajih, notranji narekovaji podvojeni,
 * - zaščita pred formulami: vrednosti, ki se začnejo z =, +, -, @,
 *   tabulatorjem ali novo vrstico, dobijo predpono z enojnim narekovajem.
 */

export const CSV_SEPARATOR = ";";
const FORMULA_START = /^[\s]*[=+\-@\t\r\n]/;

export function csvCell(value: string | number | boolean | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(header: readonly string[], rows: readonly (readonly (string | null)[])[]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(CSV_SEPARATOR));
  return `﻿${lines.join("\r\n")}\r\n`;
}
