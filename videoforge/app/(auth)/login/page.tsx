import Link from "next/link";
import type { Metadata } from "next";
import { GoogleButton } from "@/components/auth/google-button";
import { SignInForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeNextPath } from "@/lib/auth";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signInTitle };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { t } = await getI18n();
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const errorKey = params.error;
  const initialError =
    errorKey === "not_configured"
      ? t.common.notConfigured
      : errorKey === "oauth"
        ? t.auth.errors.oauthFailed
        : errorKey === "link"
          ? t.auth.errors.linkInvalid
          : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.auth.signInTitle}</CardTitle>
        <CardDescription>{t.auth.signInSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <GoogleButton label={t.auth.google} next={next} />
        <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t.auth.or}
          <span className="h-px flex-1 bg-border" />
        </div>
        <SignInForm next={next} initialError={initialError} />
        <p className="text-center text-sm text-muted-foreground">
          {t.auth.noAccount}{" "}
          <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t.auth.signUp}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
