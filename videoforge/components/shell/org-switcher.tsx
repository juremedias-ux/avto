"use client";

import { useTransition } from "react";
import { switchOrganizationAction } from "@/app/actions/org";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/client";

export type OrgOption = { id: string; name: string; isPersonal: boolean };

export function OrgSwitcher({ options, activeId }: { options: OrgOption[]; activeId: string }) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  return (
    <div className="grid gap-1.5">
      <span className="px-1 text-xs font-medium uppercase text-muted-foreground">{t.nav.organization}</span>
      <Select
        value={activeId}
        disabled={pending || options.length < 2}
        onValueChange={(value) => {
          const fd = new FormData();
          fd.set("organizationId", value);
          startTransition(() => switchOrganizationAction(fd));
        }}
      >
        <SelectTrigger aria-label={t.nav.organization}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
              {o.isPersonal ? ` · ${t.settings.personal}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
