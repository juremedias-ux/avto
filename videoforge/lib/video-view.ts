import "server-only";

import type { AppContext } from "@/lib/auth";
import type { VideoRow } from "@/lib/db/types";
import { isModelId, MODELS } from "@/lib/models";
import { getServiceClient } from "@/lib/supabase/service";
import { signMany, SOURCE_BUCKET, VIDEO_BUCKET } from "@/lib/storage";
import type { VideoCardData } from "@/components/video/video-card";
import type { VideoStatusPayload } from "@/components/video/use-video-status";

export const PLAYBACK_URL_TTL_SECONDS = 3600;

export function toStatusPayload(video: VideoRow): VideoStatusPayload {
  return {
    id: video.id,
    status: video.status,
    errorCode: video.error_code,
    errorMessage: video.error_message,
    submittedAt: video.submitted_at,
    createdAt: video.created_at,
    completedAt: video.completed_at,
    archived: Boolean(video.video_storage_path),
  };
}

export function modelLabel(model: string): string {
  return isModelId(model) ? MODELS[model].label : model;
}

/** Builds card props: signed playback/poster URLs (1 h) and creator names. */
export async function toVideoCards(ctx: AppContext, videos: VideoRow[]): Promise<VideoCardData[]> {
  const service = getServiceClient();
  const [playback, posters] = service
    ? await Promise.all([
        signMany(service, VIDEO_BUCKET, videos.map((v) => v.video_storage_path ?? ""), PLAYBACK_URL_TTL_SECONDS),
        signMany(service, SOURCE_BUCKET, videos.map((v) => v.source_image_path ?? ""), PLAYBACK_URL_TTL_SECONDS),
      ])
    : [new Map<string, string>(), new Map<string, string>()];

  const creatorIds = [...new Set(videos.map((v) => v.user_id))];
  const { data: creators } = creatorIds.length
    ? await ctx.db.from("users").select("id, full_name, email").in("id", creatorIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };
  const names = new Map((creators ?? []).map((u: { id: string; full_name: string | null; email: string }) => [u.id, u.full_name ?? u.email]));

  return videos.map((v) => ({
    ...toStatusPayload(v),
    mode: v.mode,
    modelLabel: modelLabel(v.model),
    durationSeconds: v.duration_seconds,
    aspectRatio: v.aspect_ratio,
    resolution: v.resolution,
    prompt: v.prompt,
    creditsCost: v.credits_cost,
    creditsRefunded: v.credits_refunded,
    // Only the archived copy is played in the browser (CSP allows media from Supabase only).
    // Until archiving succeeds, the download route falls back to Kling's result URL.
    playbackUrl: (v.video_storage_path && playback.get(v.video_storage_path)) || null,
    posterUrl: (v.source_image_path && posters.get(v.source_image_path)) || null,
    creatorName: v.user_id === ctx.profile.id ? null : (names.get(v.user_id) ?? null),
    canDelete: v.user_id === ctx.profile.id || ctx.role === "admin",
  }));
}
