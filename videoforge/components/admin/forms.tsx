"use client";

import { useActionState } from "react";
import { adjustCreditsAction, setUserStatusAction, type AdminActionState } from "@/app/admin/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { AccountStatus } from "@/lib/db/types";
import { useI18n } from "@/lib/i18n/client";

function Result({ state }: { state: AdminActionState }) {
  if (!state) return null;
  return <p className={state.error ? "text-xs text-destructive" : "text-xs text-success"}>{state.error ?? state.message}</p>;
}

export function AdjustCreditsForm({ organizationId }: { organizationId: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState<AdminActionState, FormData>(adjustCreditsAction, null);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <div className="flex flex-wrap gap-2">
        <Input name="amount" type="number" step={1} required className="w-24" aria-label={t.admin.amount} placeholder="±" />
        <Input name="reason" required minLength={3} maxLength={500} className="min-w-40 flex-1" aria-label={t.admin.reason} placeholder={t.admin.reason} />
        <SubmitButton size="sm">{t.admin.addCredits}</SubmitButton>
      </div>
      <Result state={state} />
    </form>
  );
}

export function UserStatusForm({ userId, status }: { userId: string; status: AccountStatus }) {
  const { t } = useI18n();
  const [state, action] = useActionState<AdminActionState, FormData>(setUserStatusAction, null);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-wrap gap-2">
        <NativeSelect name="status" defaultValue={status} className="w-40" aria-label={t.admin.statusChange}>
          {(["active", "suspended", "blocked"] as const).map((s) => (
            <option key={s} value={s}>
              {t.admin.statuses[s]}
            </option>
          ))}
        </NativeSelect>
        <Input name="reason" maxLength={500} className="min-w-32 flex-1" placeholder={t.admin.statusReason} aria-label={t.admin.statusReason} />
        <SubmitButton size="sm" variant="outline">
          {t.admin.statusChange}
        </SubmitButton>
      </div>
      <Result state={state} />
    </form>
  );
}
