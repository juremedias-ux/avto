"use client";

import Link from "next/link";
import { CopyIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DeleteVideoButton, type VideoCardData } from "@/components/video/video-card";
import { StatusBadge, isActiveStatus } from "@/components/video/status-badge";
import { useElapsed, useVideoStatus } from "@/components/video/use-video-status";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import type { VideoStatus } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const STEPS: VideoStatus[] = ["draft", "queued", "processing", "succeeded"];

export function VideoDetailPlayer({ video }: { video: VideoCardData }) {
  const { t } = useI18n();
  const live = useVideoStatus(video, video.status === "succeeded" && !video.archived);
  const active = isActiveStatus(live.status);
  const elapsed = useElapsed(live.submittedAt ?? live.createdAt, active);
  const stepIndex = STEPS.indexOf(live.status);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="grid min-h-64 place-items-center bg-black/60">
        {live.status === "succeeded" && video.playbackUrl ? (
          <video
            src={video.playbackUrl}
            poster={video.posterUrl ?? undefined}
            controls
            playsInline
            className={cn("max-h-[70dvh] w-full bg-black", video.aspectRatio === "9:16" && "max-w-sm")}
          />
        ) : active ? (
          <div className="grid w-full max-w-md gap-4 p-8 text-center">
            <StatusBadge status={live.status} label={t.status[live.status]} />
            <Progress indeterminate aria-label={t.library.progressTitle} />
            <ol className="grid grid-cols-4 gap-2 text-xs">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className={cn("rounded-md border px-2 py-1", i <= stepIndex ? "border-primary text-foreground" : "text-muted-foreground")}
                >
                  {t.status[s]}
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">{t.statusHint[live.status]}</p>
            <p className="text-xs text-muted-foreground">{format(t.library.elapsed, { time: elapsed })}</p>
          </div>
        ) : live.status === "failed" ? (
          <div className="grid max-w-md gap-2 p-8 text-center">
            <StatusBadge status="failed" label={t.status.failed} />
            <p className="text-sm text-destructive">
              {(t.errors as Record<string, string>)[live.errorCode ?? ""] ?? t.errors.generation_failed}
            </p>
            {live.errorMessage && <p className="text-xs text-muted-foreground">{live.errorMessage}</p>}
          </div>
        ) : (
          <p className="p-8 text-sm text-muted-foreground">{t.library.notArchived}</p>
        )}
      </div>
      <CardContent className="flex flex-wrap gap-2 p-4">
        {live.status === "succeeded" && (
          <Button asChild variant="secondary">
            <a href={`/api/videos/${video.id}/download`}>
              <DownloadIcon />
              {t.library.download}
            </a>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href={`/create?from=${video.id}`}>
            <CopyIcon />
            {t.library.duplicate}
          </Link>
        </Button>
        {video.canDelete && !active && <DeleteVideoButton videoId={video.id} redirectTo="/library" />}
      </CardContent>
    </Card>
  );
}
