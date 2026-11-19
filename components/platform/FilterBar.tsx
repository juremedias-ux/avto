import Link from "next/link";
import type { CSSProperties } from "react";

export type FilterOption = { value: string; label: string };
export type FilterDef = { name: string; label: string; options: FilterOption[]; value?: string };

/**
 * Filtri kot navaden obrazec GET: delujejo brez JavaScripta, rezultat ima
 * svoj URL (deljenje, nazaj v brskalniku).
 */
export function FilterBar({ action, filters, count }: { action: string; filters: FilterDef[]; count: number }) {
  const active = filters.some((f) => f.value);
  return (
    <form action={action} method="get" className="rounded-2xl border border-sand-200 bg-paper-raised p-4 sm:p-5">
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Filtri</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))_auto]" style={{ "--cols": filters.length } as CSSProperties}>
          {filters.map((filter) => (
            <div key={filter.name} className="flex flex-col gap-1">
              <label htmlFor={`filter-${filter.name}`} className="text-sm text-ink-muted">
                {filter.label}
              </label>
              <select id={`filter-${filter.name}`} name={filter.name} defaultValue={filter.value ?? ""} className="filter-select">
                <option value="">Vse</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex items-end gap-3">
            <button type="submit" className="btn-secondary h-11 px-5">
              Prikaži
            </button>
            {active ? (
              <Link href={action} className="text-link whitespace-nowrap text-sm">
                Počisti
              </Link>
            ) : null}
          </div>
        </div>
      </fieldset>
      <p role="status" className="mt-3 text-sm text-ink-muted">
        {count === 0 ? "Ni zadetkov." : `Prikazanih zadetkov: ${count}`}
      </p>
    </form>
  );
}

/** Ena vrednost iz searchParams (prezre ponovljene in predolge vrednosti). */
export function param(params: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = params[key];
  return typeof value === "string" && value.length > 0 && value.length <= 100 ? value : undefined;
}
