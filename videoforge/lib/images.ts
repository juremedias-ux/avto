/**
 * Reads image type and pixel dimensions from the file header (JPEG/PNG only),
 * without decoding. Used to validate uploads against Kling's input rules:
 * JPG/PNG, width and height >= 300 px, aspect ratio between 1:2.5 and 2.5:1.
 */

export type ImageInfo = { type: "jpeg" | "png"; width: number; height: number };

export const MIN_IMAGE_SIDE = 300;
export const MAX_IMAGE_RATIO = 2.5;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // below Vercel's 4.5 MB request body limit

export function readImageInfo(bytes: Uint8Array): ImageInfo | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    // PNG: signature (8) + IHDR length (4) + "IHDR" (4) + width (4) + height (4)
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const chunk = String.fromCharCode(bytes[12]!, bytes[13]!, bytes[14]!, bytes[15]!);
    if (chunk !== "IHDR") return null;
    return { type: "png", width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return null;
      const marker = bytes[offset + 1]!;
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!;
      const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSof) {
        const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!;
        const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!;
        return { type: "jpeg", width, height };
      }
      if (length < 2) return null;
      offset += 2 + length;
    }
  }
  return null;
}

export type ImageProblem = "unsupported_type" | "too_small" | "bad_ratio" | "too_large";

export function validateImage(bytes: Uint8Array): { ok: true; info: ImageInfo } | { ok: false; problem: ImageProblem } {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) return { ok: false, problem: "too_large" };
  const info = readImageInfo(bytes);
  if (!info) return { ok: false, problem: "unsupported_type" };
  if (info.width < MIN_IMAGE_SIDE || info.height < MIN_IMAGE_SIDE) return { ok: false, problem: "too_small" };
  const ratio = info.width / info.height;
  if (ratio > MAX_IMAGE_RATIO || ratio < 1 / MAX_IMAGE_RATIO) return { ok: false, problem: "bad_ratio" };
  return { ok: true, info };
}
