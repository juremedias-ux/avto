"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { subscribeToWaitlist } from "@/app/actions/waitlist";
import { consent, form as copy } from "@/content";
import {
  FIELD,
  initialWaitlistState,
  validateWaitlist,
  type WaitlistFieldErrors,
  type WaitlistSource,
} from "@/lib/waitlist-form";

type WaitlistFormProps = {
  /** Enolična predpona za HTML-identifikatorje (oba prikaza na isti strani). */
  id: string;
  source: WaitlistSource;
};

/**
 * Prijavni obrazec. Isto komponento in isto strežniško akcijo uporabljata
 * oba prikaza na strani. Deluje tudi brez JavaScripta (klasična oddaja).
 */
export function WaitlistForm({ id, source }: WaitlistFormProps) {
  const [state, formAction, pending] = useActionState(
    subscribeToWaitlist,
    initialWaitlistState,
  );

  // Napake iz odjemalskega preverjanja veljajo samo do naslednjega odziva strežnika.
  const [local, setLocal] = useState<{ attempt: number; errors: WaitlistFieldErrors } | null>(null);
  const errors: WaitlistFieldErrors =
    local && local.attempt === state.attempt ? local.errors : (state.fieldErrors ?? {});

  const emailRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const ids = {
    email: `${id}-email`,
    emailError: `${id}-email-napaka`,
    note: `${id}-opomba`,
    result: `${id}-rezultat`,
    honeypot: `${id}-spletna-stran`,
  };

  function focusFirstInvalid(fieldErrors: WaitlistFieldErrors) {
    if (fieldErrors.email) emailRef.current?.focus();
  }

  // Po odzivu strežnika premakni fokus na prvo napako ali na rezultat.
  useEffect(() => {
    if (state.attempt === 0) return;
    if (state.status === "success") {
      successRef.current?.focus();
    } else if (state.fieldErrors?.email) {
      focusFirstInvalid(state.fieldErrors);
    }
    // Splošne napake objavi območje role="alert"; fokus ostane na gumbu.
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (pending) {
      event.preventDefault();
      return;
    }
    const data = new FormData(event.currentTarget);
    const result = validateWaitlist({
      email: data.get(FIELD.email),
      source,
    });
    if (!result.ok) {
      event.preventDefault();
      setLocal({ attempt: state.attempt, errors: result.fieldErrors });
      focusFirstInvalid(result.fieldErrors);
    } else {
      setLocal(null);
    }
  }

  function clearError(field: keyof WaitlistFieldErrors) {
    if (!errors[field]) return;
    setLocal({ attempt: state.attempt, errors: { ...errors, [field]: undefined } });
  }

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="flex gap-4 rounded-2xl bg-success-bg p-5 text-success outline-none focus-visible:ring-2 focus-visible:ring-success sm:p-6"
      >
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 h-6 w-6 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9.25" />
          <path d="m8 12.4 2.7 2.6L16 9.6" />
        </svg>
        <p className="text-base font-medium leading-relaxed text-ink">{state.message}</p>
      </div>
    );
  }

  const values = state.values;
  const generalError = state.status === "error" && state.message ? state.message : null;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="relative"
    >
      <input type="hidden" name={FIELD.source} value={source} />

      {/* Past za robote: ljudje polja ne vidijo in ga ne izpolnijo. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor={ids.honeypot}>{copy.honeypotLabel}</label>
        <input
          id={ids.honeypot}
          name={FIELD.honeypot}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div key={`fields-${state.attempt}`}>
        <label htmlFor={ids.email} className="block text-[0.9375rem] font-semibold text-ink">
          {copy.emailLabel}
        </label>
        <input
          ref={emailRef}
          id={ids.email}
          name={FIELD.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={copy.emailPlaceholder}
          defaultValue={values?.email ?? ""}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? ids.emailError : undefined}
          onChange={() => clearError("email")}
          className="field-input mt-2"
        />
        {errors.email ? (
          <p id={ids.emailError} className="field-error">
            <ErrorIcon />
            {errors.email}
          </p>
        ) : null}

      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <button
          type="submit"
          className="btn-primary w-full sm:w-auto"
          aria-disabled={pending || undefined}
        >
          {pending ? copy.submitting : copy.submit}
        </button>
        <p className="text-sm text-ink-muted">{copy.note}</p>
      </div>

      <div id={ids.result} role="alert">
        {generalError ? (
          <p className="mt-4 flex gap-2 rounded-xl bg-error-bg px-4 py-3 text-[0.9375rem] font-medium text-error">
            <ErrorIcon />
            {generalError}
          </p>
        ) : null}
      </div>

      <p id={ids.note} className="mt-4 text-sm leading-relaxed text-ink-muted">
        {consent.launch} {consent.infoBeforeLink}
        <Link href="/zasebnost" className="text-link">
          {consent.infoLink}
        </Link>
        {consent.infoAfterLink}
      </p>
    </form>
  );
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-[0.2em] h-4 w-4 shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M10 1.75a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Zm0 4a.9.9 0 0 1 .9.9v3.9a.9.9 0 1 1-1.8 0V6.65a.9.9 0 0 1 .9-.9Zm0 8.75a1.05 1.05 0 1 1 0-2.1 1.05 1.05 0 0 1 0 2.1Z" />
    </svg>
  );
}
