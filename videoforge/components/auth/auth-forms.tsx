"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
  type AuthFormState,
} from "@/app/auth/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/client";

export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState<AuthFormState, FormData>(signInAction, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
            {t.auth.forgotPassword}
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FormMessage error={state?.error ?? initialError} message={state?.message} />
      <SubmitButton className="w-full">{t.auth.signIn}</SubmitButton>
    </form>
  );
}

export function SignUpForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<AuthFormState, FormData>(signUpAction, null);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="fullName">{t.auth.fullName}</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required maxLength={120} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <FormMessage error={state?.error} message={state?.message} />
      <SubmitButton className="w-full">{t.auth.signUp}</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<AuthFormState, FormData>(requestPasswordResetAction, null);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <FormMessage error={state?.error} message={state?.message} />
      <SubmitButton className="w-full">{t.auth.resetSend}</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<AuthFormState, FormData>(updatePasswordAction, null);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="password">{t.auth.newPassword}</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <FormMessage error={state?.error} message={state?.message} />
      <SubmitButton className="w-full">{t.auth.updatePassword}</SubmitButton>
    </form>
  );
}
