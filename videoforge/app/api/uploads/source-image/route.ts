import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { getAppContext } from "@/lib/auth";
import { isSameOrigin, json, jsonError } from "@/lib/http";
import { MAX_UPLOAD_BYTES, validateImage } from "@/lib/images";
import { signOne, SOURCE_BUCKET, sourceImagePath } from "@/lib/storage";
import { getServiceClient } from "@/lib/supabase/service";

/**
 * Receives the (client-cropped) first-frame image, validates it against
 * Kling's input rules and stores it privately under {org}/{user}/{uuid}.ext.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError("forbidden", 403);
  const ctx = await getAppContext();
  if (!ctx) return jsonError("unauthorized", 401);
  if (ctx.profile.status !== "active") return jsonError("account_suspended", 403);
  const service = getServiceClient();
  if (!service) return jsonError("not_configured", 503);

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return jsonError("image_too_large", 413);

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return jsonError("invalid_image", 422);
  const bytes = new Uint8Array(await file.arrayBuffer());

  const check = validateImage(bytes);
  if (!check.ok) return jsonError(`image_${check.problem}`, 422);

  const ext = check.info.type === "png" ? "png" : "jpg";
  const path = sourceImagePath(ctx.organization.id, ctx.profile.id, randomUUID(), ext);
  const { error } = await service.storage.from(SOURCE_BUCKET).upload(path, bytes, {
    contentType: check.info.type === "png" ? "image/png" : "image/jpeg",
    upsert: false,
  });
  if (error) return jsonError("unknown", 500);

  const previewUrl = await signOne(service, SOURCE_BUCKET, path, 3600);
  return json({ path, width: check.info.width, height: check.info.height, previewUrl }, 201);
}
