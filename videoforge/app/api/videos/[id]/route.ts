import type { NextRequest } from "next/server";
import { getAppContext } from "@/lib/auth";
import { deleteVideo, refreshVideo } from "@/lib/generation/service";
import { isSameOrigin, json, jsonError } from "@/lib/http";
import { uuidSchema } from "@/lib/validation";
import { toStatusPayload } from "@/lib/video-view";

export const maxDuration = 60;

/** Current status; triggers a throttled Kling sync for active generations. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return jsonError("video_not_found", 404);
  const ctx = await getAppContext();
  if (!ctx) return jsonError("unauthorized", 401);
  const video = await refreshVideo(ctx, id);
  if (!video) return jsonError("video_not_found", 404);
  return json(toStatusPayload(video));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return jsonError("forbidden", 403);
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return jsonError("video_not_found", 404);
  const ctx = await getAppContext();
  if (!ctx) return jsonError("unauthorized", 401);
  const result = await deleteVideo(ctx, id);
  if (result.ok) return json({ ok: true });
  const status = result.error === "video_in_progress" ? 409 : result.error === "forbidden" ? 403 : result.error === "video_not_found" ? 404 : 500;
  return jsonError(result.error, status);
}
