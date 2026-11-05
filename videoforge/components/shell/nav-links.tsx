"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCardIcon,
  FilmIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldIcon,
  SparklesIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function NavLinks({ isPlatformAdmin, onNavigate }: { isPlatformAdmin: boolean; onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboardIcon },
    { href: "/create", label: t.nav.create, icon: SparklesIcon },
    { href: "/library", label: t.nav.library, icon: FilmIcon },
    { href: "/billing", label: t.nav.billing, icon: CreditCardIcon },
    { href: "/settings", label: t.nav.settings, icon: SettingsIcon },
    ...(isPlatformAdmin ? [{ href: "/admin", label: t.nav.admin, icon: ShieldIcon }] : []),
  ];
  return (
    <nav className="grid gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
