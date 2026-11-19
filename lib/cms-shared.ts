/** Pomožne funkcije za podatke iz urejevalnika (brez strežniških odvisnosti). */

/** Ali je vrednost razrešen dokument (objekt z id), ne le id. */
export function isDoc<T extends { id: number | string }>(value: unknown): value is T {
  return typeof value === "object" && value !== null && "id" in value;
}

/** Iz polja relacij vrne samo razrešene dokumente. */
export function docs<T extends { id: number | string }>(values: unknown): T[] {
  return Array.isArray(values) ? values.filter((v): v is T => isDoc<T>(v)) : [];
}

/** Razreši polimorfne relacije (članek ali video). */
export function polyDocs<T extends { id: number | string }>(
  values: unknown,
): { relationTo: string; doc: T }[] {
  if (!Array.isArray(values)) return [];
  return values.flatMap((v) => {
    if (v && typeof v === "object" && "relationTo" in v && "value" in v && isDoc<T>(v.value)) {
      return [{ relationTo: String(v.relationTo), doc: v.value as T }];
    }
    return [];
  });
}
