"use client";

import { useActionState, useEffect, useRef } from "react";
import { signInAction, type LoginState } from "@/app/admin/prijava/actions";

const initialState: LoginState = { attempt: 0 };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.attempt > 0 && state.error) passwordRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <label htmlFor="admin-email" className="block text-[0.9375rem] font-semibold">
          E-poštni naslov
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.email ?? ""}
          key={`email-${state.attempt}`}
          className="field-input mt-2"
          aria-describedby={state.error ? "admin-napaka" : undefined}
        />
      </div>
      <div>
        <label htmlFor="admin-geslo" className="block text-[0.9375rem] font-semibold">
          Geslo
        </label>
        <input
          ref={passwordRef}
          id="admin-geslo"
          name="geslo"
          type="password"
          autoComplete="current-password"
          required
          className="field-input mt-2"
          aria-describedby={state.error ? "admin-napaka" : undefined}
        />
      </div>
      <div role="alert">
        {state.error ? (
          <p id="admin-napaka" className="rounded-xl bg-error-bg px-4 py-3 text-[0.9375rem] font-medium text-error">
            {state.error}
          </p>
        ) : null}
      </div>
      <button type="submit" className="btn-primary w-full" aria-disabled={pending || undefined}>
        {pending ? "Prijavljam …" : "Prijava"}
      </button>
    </form>
  );
}
