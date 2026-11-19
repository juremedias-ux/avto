"use client";

import Link from "next/link";
import { InquiryForm } from "@/components/platform/inquiry/InquiryForm";
import { removeFromInquiry, setQuantity, useInquiryList } from "@/lib/inquiry-store";
import { routes } from "@/lib/platform";

/** Seznam povpraševanja (izdelki in količine) z obrazcem za oddajo. */
export function InquiryPanel() {
  const items = useInquiryList();

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <section aria-labelledby="seznam" className="lg:col-span-6">
        <h2 id="seznam" className="text-xl font-semibold">
          Izbrani izdelki
        </h2>
        {items.length ? (
          <ul className="mt-4 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-paper-raised">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <Link href={item.href} className="min-w-0 flex-1 font-semibold hover:underline">
                  {item.naziv}
                </Link>
                <label className="flex items-center gap-2 text-sm text-ink-muted">
                  Količina
                  <input
                    type="number"
                    min={1}
                    max={99}
                    inputMode="numeric"
                    value={item.kolicina}
                    onChange={(e) => setQuantity(item.id, Math.floor(Number(e.target.value) || 1))}
                    className="h-11 w-20 rounded-xl border border-field-border bg-white px-3 text-base text-ink"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeFromInquiry(item.id)}
                  className="min-h-11 rounded-lg px-3 text-sm font-semibold text-action-hover hover:bg-sand-100"
                  aria-label={`Odstrani ${item.naziv}`}
                >
                  Odstrani
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-sand-300 bg-paper-raised px-5 py-8 text-center">
            <p className="text-ink-muted">Seznam je prazen.</p>
            <Link href={routes.products} className="btn-secondary mt-4">
              Prebrskaj izdelke
            </Link>
          </div>
        )}
        <p className="mt-3 text-sm text-ink-muted">Seznam je shranjen samo v tem brskalniku, dokler ga ne pošlješ.</p>
      </section>

      <section aria-labelledby="oddaja" className="lg:col-span-6">
        <div className="form-card">
          <h2 id="oddaja" className="text-xl font-semibold">
            Pošlji povpraševanje
          </h2>
          <p className="mt-1 text-[0.9375rem] text-ink-muted">Brez plačila in brez obveznosti.</p>
          <div className="mt-5">
            <InquiryForm id="povprasevanje" mode="seznam" items={items} submitLabel="Pošlji povpraševanje" />
          </div>
        </div>
      </section>
    </div>
  );
}
