import { Loader2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VideoStatus } from "@/lib/db/types";

const VARIANT: Record<VideoStatus, "secondary" | "outline" | "warning" | "success" | "destructive"> = {
  draft: "secondary",
  queued: "outline",
  processing: "warning",
  succeeded: "success",
  failed: "destructive",
};

export function StatusBadge({ status, label }: { status: VideoStatus; label: string }) {
  const spinning = status === "draft" || status === "queued" || status === "processing";
  return (
    <Badge variant={VARIANT[status]} data-status={status}>
      {spinning && <Loader2Icon className="animate-spin" aria-hidden />}
      {label}
    </Badge>
  );
}

export function isActiveStatus(status: VideoStatus): boolean {
  return status === "draft" || status === "queued" || status === "processing";
}
