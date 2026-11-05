import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";

export default async function ForgotPasswordPage() {
  const { t } = await getI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.auth.resetTitle}</CardTitle>
        <CardDescription>{t.auth.resetSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ForgotPasswordForm />
        <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-foreground">
          {t.common.back}
        </Link>
      </CardContent>
    </Card>
  );
}
