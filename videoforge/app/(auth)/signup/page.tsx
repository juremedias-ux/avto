import Link from "next/link";
import type { Metadata } from "next";
import { GoogleButton } from "@/components/auth/google-button";
import { SignUpForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.signUpTitle };
}

export default async function SignUpPage() {
  const { t } = await getI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.auth.signUpTitle}</CardTitle>
        <CardDescription>{t.auth.signUpSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <GoogleButton label={t.auth.google} />
        <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t.auth.or}
          <span className="h-px flex-1 bg-border" />
        </div>
        <SignUpForm />
        <p className="text-center text-sm text-muted-foreground">
          {t.auth.haveAccount}{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            {t.auth.signIn}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
