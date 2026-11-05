"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { LanguagesIcon } from "lucide-react";
import { setLocaleAction } from "@/app/auth/actions";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams();
  const returnTo = search.size > 0 ? `${pathname}?${search.toString()}` : pathname;
  return (
    <form action={setLocaleAction} className={cn("flex items-center gap-1", className)} aria-label={t.common.language}>
      <LanguagesIcon className="size-4 text-muted-foreground" aria-hidden />
      <input type="hidden" name="returnTo" value={returnTo} />
      {(["sl", "en"] as const).map((l) => (
        <button
          key={l}
          type="submit"
          name="locale"
          value={l}
          aria-pressed={locale === l}
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium uppercase transition-colors",
            locale === l ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </form>
  );
}
