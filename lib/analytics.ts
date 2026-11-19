/**
 * Enoten vmesnik za merjenje dogodkov (pripravljen za analitiko).
 *
 * Trenutno ni povezan z nobenim orodjem in ne nastavlja piškotkov.
 * Dogodki se pošljejo kot DOM-dogodek »gc:dogodek« in v window.dataLayer,
 * če ga stran kdaj doda. Ko izbereš orodje (npr. analitiko brez piškotkov),
 * ga priklopiš tu, na enem mestu.
 */

export type AnalyticsEvent =
  | "video_predvajanje"
  | "vodic_prebran"
  | "korak_poti_opravljen"
  | "izdelek_ogled"
  | "klik_izdelka_iz_vodica"
  | "dodano_v_povprasevanje"
  | "povprasevanje_oddano"
  | "prijava_obvestilo"
  | "kontakt_oddan"
  | "iskanje";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("gc:dogodek", { detail: { event, ...props } }));
    window.dataLayer?.push({ event, ...props });
  } catch {
    // Merjenje nikoli ne sme pokvariti strani.
  }
}
