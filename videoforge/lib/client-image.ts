import type { AspectRatio } from "@/lib/models";

export const MAX_SIDE = 2048;
export const MIN_SIDE = 300;
export const MAX_BYTES = 4 * 1024 * 1024;

const RATIO: Record<AspectRatio, number> = { "16:9": 16 / 9, "9:16": 9 / 16, "1:1": 1 };

export type CroppedImage = { blob: Blob; previewUrl: string; width: number; height: number };
export type CropProblem = "image_unsupported_type" | "image_too_small" | "image_too_large";

/** Centre-crops to the aspect ratio, downsizes to <= 2048 px and encodes JPEG <= 4 MB. */
export async function cropToAspect(file: File, aspect: AspectRatio): Promise<CroppedImage | CropProblem> {
  if (!["image/jpeg", "image/png"].includes(file.type)) return "image_unsupported_type";
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return "image_unsupported_type";
  }
  const target = RATIO[aspect];
  const srcRatio = bitmap.width / bitmap.height;
  let cropW = bitmap.width;
  let cropH = bitmap.height;
  if (srcRatio > target) cropW = Math.round(bitmap.height * target);
  else cropH = Math.round(bitmap.width / target);
  const sx = Math.round((bitmap.width - cropW) / 2);
  const sy = Math.round((bitmap.height - cropH) / 2);

  const scale = Math.min(1, MAX_SIDE / Math.max(cropW, cropH));
  const width = Math.round(cropW * scale);
  const height = Math.round(cropH * scale);
  if (width < MIN_SIDE || height < MIN_SIDE) {
    bitmap.close();
    return "image_too_small";
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return "image_unsupported_type";
  context.drawImage(bitmap, sx, sy, cropW, cropH, 0, 0, width, height);
  bitmap.close();

  for (const quality of [0.92, 0.85, 0.75, 0.65]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) return { blob, previewUrl: URL.createObjectURL(blob), width, height };
  }
  return "image_too_large";
}
