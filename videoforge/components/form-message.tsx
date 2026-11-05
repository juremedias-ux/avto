import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FormMessage({ error, message }: { error?: string | null; message?: string | null }) {
  if (error) {
    return (
      <Alert variant="destructive" aria-live="polite">
        <CircleAlertIcon />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  if (message) {
    return (
      <Alert variant="success" aria-live="polite">
        <CircleCheckIcon />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }
  return null;
}
