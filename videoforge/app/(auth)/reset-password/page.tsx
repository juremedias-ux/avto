import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getI18n } from "@/lib/i18n/server";

export default async function ResetPasswordPage() {
  const { t } = await getI18n();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t.auth.newPasswordTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
