"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { submitInquiry } from "@/app/(frontend)/actions/inquiry";
import { track } from "@/lib/analytics";
import { clearInquiry, type InquiryItem } from "@/lib/inquiry-store";
import {
  INQUIRY_FIELD,
  INQUIRY_LIMITS,
  initialInquiryState,
  validateInquiry,
  type InquiryFieldErrors,
} from "@/lib/inquiry-form";
import { routes } from "@/lib/platform";

type Props = {
  id: string;
  /** "vprasanje" = splošno vprašanje; "seznam" = povpraševanje za izdelke s seznama. */
  mode: "vprasanje" | "seznam";
  /** Izdelki s seznama povpraševanja (samo za mode "seznam"). */
  items?: InquiryItem[];
  /** Vprašanje o enem izdelku (iz strani izdelka). */
  product?: { id: number; naziv: string } | null;
  submitLabel: string;
};

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="field-error">
      {children}
    </p>
  );
}

/** Obrazec za vprašanje ali povpraševanje. Deluje tudi brez JavaScripta. */
export function InquiryForm({ id, mode, items = [], product, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(submitInquiry, initialInquiryState);
  const [local, setLocal] = useState<{ attempt: number; errors: InquiryFieldErrors } | null>(null);
  const errors: InquiryFieldErrors = local && local.attempt === state.attempt ? local.errors : (state.fieldErrors ?? {});
  const [kind, setKind] = useState<"povprasevanje" | "rezervacija">("povprasevanje");
  const successRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fid = (name: string) => `${id}-${name}`;
  const vrsta = mode === "vprasanje" ? "vprasanje" : kind;

  function focusFirst(fieldErrors: InquiryFieldErrors) {
    const order = ["izdelki", "email", "ime", "sporocilo"] as const;
    const first = order.find((key) => fieldErrors[key]);
    if (!first) return;
    if (first === "izdelki") document.getElementById(fid("izdelki-napaka"))?.focus();
    else formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  }

  useEffect(() => {
    if (state.attempt === 0) return;
    if (state.status === "success") {
      successRef.current?.focus();
      track(mode === "seznam" ? "povprasevanje_oddano" : "kontakt_oddan", mode === "seznam" ? { izdelkov: items.length } : {});
      if (mode === "seznam") clearInquiry();
    } else if (state.fieldErrors) {
      focusFirst(state.fieldErrors);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- samo ob novem odzivu strežnika
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }
    const data = new FormData(event.currentTarget);
    const result = validateInquiry({
      vrsta,
      ime: data.get(INQUIRY_FIELD.name),
      email: data.get(INQUIRY_FIELD.email),
      sporocilo: data.get(INQUIRY_FIELD.message),
      izdelki: mode === "seznam" ? items.map((x) => ({ id: x.id, kolicina: x.kolicina })) : [],
    });
    if (!result.ok) {
      event.preventDefault();
      setLocal({ attempt: state.attempt, errors: result.fieldErrors });
      focusFirst(result.fieldErrors);
    } else {
      setLocal(null);
    }
  }

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-2xl bg-success-bg p-5 outline-none focus-visible:ring-2 focus-visible:ring-success sm:p-6"
      >
        <p className="text-base font-medium leading-relaxed text-ink">{state.message}</p>
      </div>
    );
  }

  const values = state.values;
  const generalError = state.status === "error" && state.message ? state.message : null;
  const describe = (field: keyof InquiryFieldErrors) => (errors[field] ? fid(`${field}-napaka`) : undefined);

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} noValidate className="relative space-y-5">
      <input type="hidden" name={INQUIRY_FIELD.kind} value={vrsta} />
      {mode === "seznam" ? (
        <input
          type="hidden"
          name={INQUIRY_FIELD.items}
          value={JSON.stringify(items.map((x) => ({ id: x.id, kolicina: x.kolicina })))}
        />
      ) : null}
      {mode === "vprasanje" && product ? <input type="hidden" name={INQUIRY_FIELD.product} value={product.id} /> : null}

      <div className="hp-field" aria-hidden="true">
        <label htmlFor={fid("spletna-stran")}>Tega polja ne izpolnjuj</label>
        <input id={fid("spletna-stran")} name={INQUIRY_FIELD.honeypot} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {mode === "seznam" && errors.izdelki ? (
        <p id={fid("izdelki-napaka")} tabIndex={-1} className="field-error outline-none">
          {errors.izdelki}
        </p>
      ) : null}

      {mode === "seznam" ? (
        <fieldset>
          <legend className="text-[0.9375rem] font-semibold">Vrsta povpraševanja</legend>
          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:gap-6">
            <label className="check-row">
              <input
                type="radio"
                name={fid("vrsta-izbira")}
                checked={kind === "povprasevanje"}
                onChange={() => setKind("povprasevanje")}
                className="mt-1 h-5 w-5 accent-[var(--color-olive)]"
              />
              <span>Prosim za ponudbo</span>
            </label>
            <label className="check-row">
              <input
                type="radio"
                name={fid("vrsta-izbira")}
                checked={kind === "rezervacija"}
                onChange={() => setKind("rezervacija")}
                className="mt-1 h-5 w-5 accent-[var(--color-olive)]"
              />
              <span>Želim rezervirati (predprodaja)</span>
            </label>
          </div>
        </fieldset>
      ) : null}

      {mode === "vprasanje" && product ? (
        <p className="rounded-xl bg-sand-100 px-4 py-3 text-[0.9375rem]">
          Vprašanje o izdelku: <strong>{product.naziv}</strong>
        </p>
      ) : null}

      <div key={`polja-${state.attempt}`} className="space-y-5">
        <div>
          <label htmlFor={fid("ime")} className="block text-[0.9375rem] font-semibold">
            Ime <span className="font-normal text-ink-muted">(neobvezno)</span>
          </label>
          <input
            id={fid("ime")}
            name={INQUIRY_FIELD.name}
            type="text"
            autoComplete="name"
            maxLength={INQUIRY_LIMITS.name}
            defaultValue={values?.ime ?? ""}
            aria-invalid={errors.ime ? true : undefined}
            aria-describedby={describe("ime")}
            className="field-input mt-2"
          />
          {errors.ime ? <ErrorText id={fid("ime-napaka")}>{errors.ime}</ErrorText> : null}
        </div>
        <div>
          <label htmlFor={fid("email")} className="block text-[0.9375rem] font-semibold">
            E-poštni naslov
          </label>
          <input
            id={fid("email")}
            name={INQUIRY_FIELD.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            defaultValue={values?.email ?? ""}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describe("email")}
            placeholder="ime@primer.si"
            className="field-input mt-2"
          />
          {errors.email ? <ErrorText id={fid("email-napaka")}>{errors.email}</ErrorText> : null}
        </div>
        <div>
          <label htmlFor={fid("sporocilo")} className="block text-[0.9375rem] font-semibold">
            {mode === "vprasanje" ? "Vprašanje" : "Sporočilo"}{" "}
            {mode === "seznam" ? <span className="font-normal text-ink-muted">(neobvezno)</span> : null}
          </label>
          <textarea
            id={fid("sporocilo")}
            name={INQUIRY_FIELD.message}
            rows={5}
            maxLength={INQUIRY_LIMITS.message}
            required={mode === "vprasanje"}
            defaultValue={values?.sporocilo ?? ""}
            aria-invalid={errors.sporocilo ? true : undefined}
            aria-describedby={describe("sporocilo")}
            placeholder={mode === "vprasanje" ? "Npr. kombi, ki ga predeluješ, in kaj te zanima." : "Npr. model kombija, rok ali dodatna vprašanja."}
            className="field-input mt-2 min-h-32"
          />
          {errors.sporocilo ? <ErrorText id={fid("sporocilo-napaka")}>{errors.sporocilo}</ErrorText> : null}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">
        Podatke uporabimo samo za odgovor na to sporočilo{mode === "seznam" ? " in pripravo ponudbe" : ""}. Oddaja ni
        naročilo in ni plačila. Več v{" "}
        <Link href={routes.privacy} className="text-link">
          politiki zasebnosti
        </Link>
        .
      </p>

      {generalError ? (
        <p role="alert" className="rounded-xl bg-error-bg px-4 py-3 text-[0.9375rem] font-medium text-error">
          {generalError}
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full sm:w-auto" aria-disabled={pending || undefined}>
        {pending ? "Pošiljam …" : submitLabel}
      </button>
    </form>
  );
}
