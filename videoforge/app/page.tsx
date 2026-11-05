import Link from "next/link";
import { Suspense } from "react";
import { CoinsIcon, ImagePlayIcon, LayoutTemplateIcon } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";

export default async function LandingPage() {
  const { t } = await getI18n();
  const features = [
    { icon: ImagePlayIcon, title: t.landing.feature1Title, body: t.landing.feature1Body },
    { icon: LayoutTemplateIcon, title: t.landing.feature2Title, body: t.landing.feature2Body },
    { icon: CoinsIcon, title: t.landing.feature3Title, body: t.landing.feature3Body },
  ];
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,oklch(0.32_0.1_285/.45),transparent_55%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <Suspense>
            <LanguageSwitcher />
          </Suspense>
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t.landing.ctaSignIn}</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-4 pb-16 pt-10 sm:px-6 sm:pt-20">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{t.landing.heroTitle}</h1>
          <p className="text-pretty text-base text-muted-foreground sm:text-lg">{t.landing.heroSubtitle}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">{t.landing.ctaStart}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">{t.landing.ctaSignIn}</Link>
            </Button>
          </div>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="bg-card/70">
              <CardHeader>
                <Icon className="size-6 text-primary" aria-hidden />
                <CardTitle className="mt-2">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
            </Card>
          ))}
        </section>
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t.landing.footer}
      </footer>
    </div>
  );
}
