/** Oblikovanje datumov za slovenski prikaz (časovni pas Europe/Ljubljana). */

export const TIME_ZONE = "Europe/Ljubljana";

const dateTime = new Intl.DateTimeFormat("sl-SI", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("sl-SI", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

const isoParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZoneName: "longOffset",
});

/** ISO 8601 v lokalnem času z odmikom, npr. 2026-11-02T21:05:13+01:00. */
export function toLocalIso(iso: string | null): string {
  if (!iso) return "";
  const parts = Object.fromEntries(
    isoParts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  const offset = (parts.timeZoneName ?? "GMT").replace("GMT", "") || "+00:00";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

/** Datum za ime datoteke (YYYY-MM-DD v lokalnem času). */
export function localDateStamp(date = new Date()): string {
  return toLocalIso(date.toISOString()).slice(0, 10);
}
