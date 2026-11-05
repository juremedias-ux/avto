"use client";

import { useActionState } from "react";
import {
  addMemberAction,
  createOrganizationAction,
  renameOrganizationAction,
  updateProfileAction,
  type ActionState,
} from "@/app/actions/org";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useI18n } from "@/lib/i18n/client";

export function ProfileForm({ fullName, email, locale }: { fullName: string; email: string; locale: "sl" | "en" }) {
  const { t } = useI18n();
  const [state, action] = useActionState<ActionState, FormData>(updateProfileAction, null);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="fullName">{t.settings.fullName}</Label>
        <Input id="fullName" name="fullName" defaultValue={fullName} maxLength={120} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">{t.settings.email}</Label>
        <Input id="email" value={email} disabled readOnly />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="locale">{t.settings.language}</Label>
        <NativeSelect id="locale" name="locale" defaultValue={locale}>
          <option value="sl">Slovenščina</option>
          <option value="en">English</option>
        </NativeSelect>
      </div>
      <div className="flex items-end">
        <SubmitButton>{t.common.save}</SubmitButton>
      </div>
      <div className="sm:col-span-2">
        <FormMessage error={state?.error} message={state?.message} />
      </div>
    </form>
  );
}

export function CreateOrganizationForm() {
  const { t } = useI18n();
  const [state, action] = useActionState<ActionState, FormData>(createOrganizationAction, null);
  return (
    <form action={action} className="grid gap-2">
      <Label htmlFor="orgName">{t.settings.orgName}</Label>
      <div className="flex gap-2">
        <Input id="orgName" name="name" maxLength={100} required />
        <SubmitButton>{t.settings.create}</SubmitButton>
      </div>
      <FormMessage error={state?.error} message={state?.message} />
    </form>
  );
}

export function RenameOrganizationForm({ name }: { name: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState<ActionState, FormData>(renameOrganizationAction, null);
  return (
    <form action={action} className="grid gap-2">
      <Label htmlFor="renameOrg">{t.settings.orgName}</Label>
      <div className="flex gap-2">
        <Input id="renameOrg" name="name" defaultValue={name} maxLength={100} required />
        <SubmitButton variant="outline">{t.settings.rename}</SubmitButton>
      </div>
      <FormMessage error={state?.error} message={state?.message} />
    </form>
  );
}

export function AddMemberForm({ organizationId }: { organizationId: string }) {
  const { t } = useI18n();
  const [state, action] = useActionState<ActionState, FormData>(addMemberAction, null);
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <Label htmlFor="memberEmail">{t.settings.addMember}</Label>
      <div className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
        <Input id="memberEmail" name="email" type="email" placeholder="name@company.si" required />
        <NativeSelect name="role" defaultValue="member" aria-label={t.settings.role}>
          <option value="member">{t.settings.roles.member}</option>
          <option value="admin">{t.settings.roles.admin}</option>
        </NativeSelect>
        <SubmitButton>{t.settings.addMember}</SubmitButton>
      </div>
      <p className="text-xs text-muted-foreground">{t.settings.addMemberHint}</p>
      <FormMessage error={state?.error} message={state?.message} />
    </form>
  );
}
