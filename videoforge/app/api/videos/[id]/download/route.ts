import { NextResponse, type NextRequest } from "next/server";
import { getAppContext } from "@/lib/auth";
import type { VideoRow } from "@/lib/db/types";
import { jsonError } from "@/lib/http";
import { signOne, VIDEO_BUCKET } from "@/lib/storage";
import { getServiceClient } from "@/lib/supabase/service";
import { uuidSchema } from "@/lib/validation";

/** Redirects to a short-lived signed MP4 URL after an RLS-checked access lookup. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return jsonError("video_not_found", 404);
  const ctx = await getAppContext();
  if (!ctx) return jsonError("unauthorized", 401);

  // RLS: returns the row only if the user is a member of the video's organization.
  const { data: video } = await ctx.db
    .from("videos")
    .select("id, status, video_storage_path, provider_video_url, created_at")
    .eq("id", id)
    .maybeSingle<Pick<VideoRow, "id" | "status" | "video_storage_path" | "provider_video_url" | "created_at">>();
  if (!video || video.status !== "succeeded") return jsonError("video_not_found", 404);

  const filename = `videoforge-${video.created_at.slice(0, 10)}-${video.id.slice(0, 8)}.mp4`;
  const service = getServiceClient();
  if (service && video.video_storage_path) {
    const url = await signOne(service, VIDEO_BUCKET, video.video_storage_path, 300, filename);
    if (url) return NextResponse.redirect(url, { headers: { "Cache-Control": "no-store" } });
  }
  // Not archived yet: Kling's result URL (kept by Kling for 30 days).
  if (video.provider_video_url?.startsWith("https://")) {
    return NextResponse.redirect(video.provider_video_url, { headers: { "Cache-Control": "no-store" } });
  }
  return jsonError("video_not_found", 404);
}
