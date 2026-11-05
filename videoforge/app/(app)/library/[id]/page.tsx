import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VideoDetailPlayer } from "@/components/video/video-detail";
import { requireAppContext } from "@/lib/auth";
import type { VideoRow } from "@/lib/db/types";
import { format, formatDateTime, plural } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";
import { uuidSchema } from "@/lib/validation";
import { modelLabel, toVideoCards } from "@/lib/video-view";

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const ctx = await requireAppContext(`/library/${id}`);
  const { t, locale } = await getI18n();

  // RLS restricts the row to members of the video's organization.
  const { data: video } = await ctx.db.from("videos").select("*").eq("id", id).maybeSingle<VideoRow>();
  if (!video) notFound();
  const [card] = await toVideoCards(ctx, [video]);
  if (!card) notFound();

  const rows: [string, string][] = [
    [t.library.mode, video.mode === "text_to_video" ? t.library.modeText : t.library.modeImage],
    [t.create.model, modelLabel(video.model)],
    [t.create.duration, format(t.common.seconds, { n: video.duration_seconds })],
    [t.create.aspectRatio, video.aspect_ratio],
    [t.create.resolution, video.resolution],
    [t.create.audio, video.audio ? t.common.yes : t.common.no],
    [
      t.library.cost,
      plural(t.credits, video.credits_cost, locale) +
        (video.credits_refunded > 0 ? ` (${plural(t.credits, video.credits_refunded, locale)} ${t.library.refunded})` : ""),
    ],
    [t.library.createdAt, formatDateTime(video.created_at, locale)],
  ];
  if (card.creatorName) rows.push([t.library.createdBy, card.creatorName]);

  return (
    <div className="grid gap-6">
      <Link href="/library" className="flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" aria-hidden />
        {t.library.title}
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <VideoDetailPlayer video={card} />
        <Card>
          <CardHeader>
            <CardTitle>{t.library.details}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="grid gap-1">
              <span className="text-muted-foreground">{t.library.prompt}</span>
              <p className="whitespace-pre-wrap break-words">{video.prompt}</p>
            </div>
            {video.negative_prompt && (
              <div className="grid gap-1">
                <span className="text-muted-foreground">{t.library.negativePrompt}</span>
                <p className="whitespace-pre-wrap break-words">{video.negative_prompt}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
