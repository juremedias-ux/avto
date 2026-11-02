import type { AdminQuery } from "@/lib/admin-params";

type ConfirmActionProps = {
  action: (formData: FormData) => Promise<void>;
  label: string;
  confirmLabel: string;
  warning: string;
  id: string;
  query: AdminQuery;
  purpose?: "zagon" | "novice";
  danger?: boolean;
  /** Dostopno ime, ki pove, na kateri naslov se dejanje nanaša. */
  context: string;
};

/**
 * Dejanje z obvezno potrditvijo. Uporablja izvorni <details>, zato deluje
 * brez JavaScripta; strežnik dodatno zahteva polje potrditev=da.
 */
export function ConfirmAction({
  action,
  label,
  confirmLabel,
  warning,
  id,
  query,
  purpose,
  danger = false,
  context,
}: ConfirmActionProps) {
  return (
    <details className="group relative">
      <summary
        className={`inline-flex min-h-10 cursor-pointer list-none items-center rounded-full border px-3 text-sm font-semibold transition-colors [&::-webkit-details-marker]:hidden ${
          danger
            ? "border-error/40 text-error hover:bg-error-bg"
            : "border-sand-300 text-ink hover:bg-sand-50"
        }`}
        aria-label={`${label}: ${context}`}
      >
        {label}
      </summary>
      <form
        action={action}
        className="mt-2 w-64 rounded-2xl border border-sand-200 bg-paper-raised p-4 shadow-[var(--shadow-card)]"
      >
        <input type="hidden" name="id" value={id} />
        {purpose ? <input type="hidden" name="namen" value={purpose} /> : null}
        <input type="hidden" name="stran" value={query.page} />
        <input type="hidden" name="iskanje" value={query.search} />
        <input type="hidden" name="razvrsti" value={query.sort} />
        <p className="text-sm leading-relaxed text-ink">{warning}</p>
        <button
          type="submit"
          name="potrditev"
          value="da"
          className={`mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold text-white ${
            danger ? "bg-error hover:bg-[#931c13]" : "bg-ink hover:bg-black"
          }`}
        >
          {confirmLabel}
        </button>
      </form>
    </details>
  );
}
