"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyIcon, DownloadIcon, ImageIcon, PlayIcon, Trash2Icon, TypeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, isActiveStatus } from "@/components/video/status-badge";
import { useElapsed, useVideoStatus, type VideoStatusPayload } from "@/components/video/use-video-status";
import { format, formatDateTime, plural } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import type { GenerationMode } from "@/lib/db/types";
import { cn } from "@/lib/utils";

export type VideoCardData = VideoStatusPayload & {
  mode: GenerationMode;
  modelLabel: string;
  durationSeconds: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  resolution: string;
  prompt: string;
  creditsCost: number;
  creditsRefunded: number;
  playbackUrl: string | null;
  posterUrl: string | null;
  creatorName: string | null;
  canDelete: boolean;
};

const ASPECT_CLASS = { "16:9": "aspect-video", "9:16": "aspect-[9/16]", "1:1": "aspect-square" } as const;

export function VideoCard({ video }: { video: VideoCardData }) {
  const { t, locale } = useI18n();
  const live = useVideoStatus(video, video.status === "succeeded" && !video.archived);
  const active = isActiveStatus(live.status);
  const elapsed = useElapsed(live.submittedAt ?? live.createdAt, active);
  const [playOpen, setPlayOpen] = useState(false);
  const playable = live.status === "succeeded" && Boolean(video.playbackUrl);

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="relative bg-muted/40">
        <div className={cn("relative mx-auto max-h-80 w-full", ASPECT_CLASS[video.aspectRatio], video.aspectRatio === "9:16" && "max-w-44")}>
          {playable ? (
            <button
              type="button"
              onClick={() => setPlayOpen(true)}
              className="group absolute inset-0"
              aria-label={t.library.play}
            >
              <video
                src={`${video.playbackUrl}#t=0.1`}
                poster={video.posterUrl ?? undefined}
                preload="metadata"
                muted
                playsInline
                className="size-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/30">
                <PlayIcon className="size-10 rounded-full bg-black/50 p-2.5 text-white opacity-90" aria-hidden />
              </span>
            </button>
          ) : active ? (
            <div className="absolute inset-0 grid place-items-center gap-3 p-4">
              <Skeleton className="absolute inset-0 rounded-none" />
              <div className="relative grid w-full max-w-48 gap-2 text-center">
                <Progress indeterminate aria-label={t.library.progressTitle} />
                <span className="text-xs text-muted-foreground">{format(t.library.elapsed, { time: elapsed })}</span>
              </div>
            </div>
          ) : video.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
            <img src={video.posterUrl} alt="" className="absolute inset-0 size-full object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              {video.mode === "image_to_video" ? <ImageIcon aria-hidden /> : <TypeIcon aria-hidden />}
            </div>
          )}
        </div>
        <div className="absolute left-2 top-2">
          <StatusBadge status={live.status} label={t.status[live.status]} />
        </div>
      </div>
      <div className="grid gap-3 p-4">
        <Link href={`/library/${video.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
          {video.prompt}
        </Link>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{video.modelLabel}</span>
          <span>{format(t.common.seconds, { n: video.durationSeconds })}</span>
          <span>{video.aspectRatio}</span>
          <span>{video.resolution}</span>
          <span>{plural(t.credits, video.creditsCost, locale)}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDateTime(video.createdAt, locale)}
          {video.creatorName ? ` · ${video.creatorName}` : ""}
        </div>
        {live.status === "succeeded" && !video.playbackUrl && (
          <p className="text-xs text-muted-foreground">{t.library.notArchived}</p>
        )}
        {live.status === "failed" && (
          <p className="text-xs text-destructive">
            {(t.errors as Record<string, string>)[live.errorCode ?? ""] ?? t.errors.generation_failed}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {live.status === "succeeded" && (
            <Button asChild size="sm" variant="secondary">
              <a href={`/api/videos/${video.id}/download`}>
                <DownloadIcon />
                MP4
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={`/create?from=${video.id}`}>
              <CopyIcon />
              {t.library.duplicate}
            </Link>
          </Button>
          {video.canDelete && !active && <DeleteVideoButton videoId={video.id} />}
        </div>
      </div>
      {playable && (
        <Dialog open={playOpen} onOpenChange={setPlayOpen}>
          <DialogContent className="max-w-3xl p-3 sm:p-4" closeLabel={t.common.close}>
            <DialogTitle className="sr-only">{t.library.play}</DialogTitle>
            <DialogDescription className="sr-only">{video.prompt}</DialogDescription>
            <video src={video.playbackUrl ?? undefined} controls autoPlay playsInline className="max-h-[75dvh] w-full rounded-lg bg-black" />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

export function DeleteVideoButton({ videoId, redirectTo }: { videoId: string; redirectTo?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError((t.errors as Record<string, string>)[body.error ?? ""] ?? t.errors.unknown);
        return;
      }
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2Icon />
        {t.library.delete}
      </Button>
      <DialogContent closeLabel={t.common.close}>
        <DialogHeader>
          <DialogTitle>{t.library.deleteTitle}</DialogTitle>
          <DialogDescription>{t.library.deleteBody}</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t.common.cancel}</Button>
          </DialogClose>
          <Button variant="destructive" onClick={confirmDelete} disabled={pending}>
            {t.common.delete}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
