import { CircleAlertIcon, InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Dictionary } from "@/lib/i18n/config";

export function DemoBanner({ t }: { t: Dictionary }) {
  return (
    <Alert variant="warning">
      <InfoIcon />
      <AlertTitle>{t.demo.title}</AlertTitle>
      <AlertDescription>{t.demo.body}</AlertDescription>
    </Alert>
  );
}

export function SuspendedBanner({ t }: { t: Dictionary }) {
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>{t.account.suspendedTitle}</AlertTitle>
      <AlertDescription>{t.account.suspendedBody}</AlertDescription>
    </Alert>
  );
}
