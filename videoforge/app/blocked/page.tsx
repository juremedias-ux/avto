import { ShieldXIcon } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { getI18n } from "@/lib/i18n/server";

export default async function BlockedPage() {
  const { t } = await getI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldXIcon className="size-10 text-destructive" aria-hidden />
      <h1 className="text-xl font-semibold">{t.account.blockedTitle}</h1>
      <p className="text-sm text-muted-foreground">{t.account.blockedBody}</p>
      <form action={signOutAction}>
        <SubmitButton variant="outline">{t.common.signOut}</SubmitButton>
      </form>
    </main>
  );
}
