import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { CoinsIcon, LogOutIcon } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { DemoBanner, SuspendedBanner } from "@/components/shell/banners";
import { MobileNav } from "@/components/shell/mobile-nav";
import { NavLinks } from "@/components/shell/nav-links";
import { OrgSwitcher } from "@/components/shell/org-switcher";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/auth";
import { isKlingConfigured } from "@/lib/env";
import { plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const ctx = await requireAppContext();
  const { t, locale } = await getI18n();
  const orgOptions = ctx.memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    isPersonal: m.organization.is_personal,
  }));
  const switcher = <OrgSwitcher options={orgOptions} activeId={ctx.organization.id} />;
  const footer = (
    <div className="grid gap-3 border-t pt-4">
      <div className="truncate text-xs text-muted-foreground" title={ctx.profile.email}>
        {ctx.profile.full_name ?? ctx.profile.email}
      </div>
      <div className="flex items-center justify-between">
        <Suspense>
          <LanguageSwitcher />
        </Suspense>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOutIcon />
            {t.common.signOut}
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r bg-card/40 p-4 lg:flex">
        <Logo href="/dashboard" />
        {switcher}
        <NavLinks isPlatformAdmin={ctx.profile.is_platform_admin} />
        <div className="mt-auto">{footer}</div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav
              isPlatformAdmin={ctx.profile.is_platform_admin}
              header={
                <div className="grid gap-4 pr-8">
                  <Logo href="/dashboard" />
                  {switcher}
                </div>
              }
              footer={footer}
            />
            <span className="truncate text-sm font-medium lg:hidden">{ctx.organization.name}</span>
          </div>
          <Link
            href="/billing"
            className="flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium hover:bg-accent"
            aria-label={t.nav.balance}
          >
            <CoinsIcon className="size-4 text-warning" aria-hidden />
            {plural(t.credits, ctx.organization.credit_balance, locale)}
          </Link>
        </header>
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6">
          {!isKlingConfigured() && <DemoBanner t={t} />}
          {ctx.profile.status === "suspended" && <SuspendedBanner t={t} />}
          {children}
        </main>
      </div>
    </div>
  );
}
