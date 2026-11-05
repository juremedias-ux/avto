import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const SOURCE_BUCKET = "source-images";
export const VIDEO_BUCKET = "videos";

export function sourceImagePath(organizationId: string, userId: string, fileId: string, ext: "jpg" | "png"): string {
  return `${organizationId}/${userId}/${fileId}.${ext}`;
}

export function videoPath(organizationId: string, videoId: string): string {
  return `${organizationId}/${videoId}.mp4`;
}

/** Signed URLs for many objects of one bucket; missing objects map to null. */
export async function signMany(
  service: SupabaseClient,
  bucket: string,
  paths: string[],
  expiresInSeconds: number,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return result;
  const { data } = await service.storage.from(bucket).createSignedUrls(unique, expiresInSeconds);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) result.set(item.path, item.signedUrl);
  }
  return result;
}

export async function signOne(
  service: SupabaseClient,
  bucket: string,
  path: string,
  expiresInSeconds: number,
  download?: string,
): Promise<string | null> {
  const { data, error } = await service.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds, download ? { download } : undefined);
  return error || !data ? null : data.signedUrl;
}

export async function removeObjects(service: SupabaseClient, bucket: string, paths: (string | null)[]): Promise<void> {
  const list = paths.filter((p): p is string => Boolean(p));
  if (list.length > 0) await service.storage.from(bucket).remove(list);
}
