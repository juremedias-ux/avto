import type { ReactNode } from "react";
import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,oklch(0.3_0.08_285/.35),transparent_60%)]">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <Suspense>
          <LanguageSwitcher />
        </Suspense>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 sm:items-center sm:pt-0">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
