import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { requirePlatformAdmin } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requirePlatformAdmin();
  const { t } = await getI18n();
  const links = [
    { href: "/admin", label: t.admin.overview },
    { href: "/admin/users", label: t.admin.users },
    { href: "/admin/organizations", label: t.admin.organizations },
    { href: "/admin/transactions", label: t.admin.transactions },
    { href: "/admin/videos", label: t.admin.videos },
  ];
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Logo href="/admin" />
          <span className="rounded bg-destructive/15 px-2 py-0.5 text-xs font-medium text-destructive">{t.admin.title}</span>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="size-4" aria-hidden />
            {t.nav.dashboard}
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
