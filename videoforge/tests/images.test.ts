import { describe, expect, it } from "vitest";
import { readImageInfo, validateImage } from "@/lib/images";

function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

function jpeg(width: number, height: number): Uint8Array {
  // SOI, APP0 (length 16), SOF0 (length 17)
  const app0 = [0xff, 0xe0, 0x00, 0x10, ...new Array(14).fill(0)];
  const sof0 = [0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 0xff, width >> 8, width & 0xff, 3, ...new Array(9).fill(0)];
  return new Uint8Array([0xff, 0xd8, ...app0, ...sof0, 0xff, 0xd9]);
}

describe("image header parsing", () => {
  it("reads PNG dimensions", () => {
    expect(readImageInfo(png(1280, 720))).toEqual({ type: "png", width: 1280, height: 720 });
  });

  it("reads JPEG dimensions after APP segments", () => {
    expect(readImageInfo(jpeg(1080, 1920))).toEqual({ type: "jpeg", width: 1080, height: 1920 });
  });

  it("rejects other formats", () => {
    expect(readImageInfo(new TextEncoder().encode("GIF89a........................"))).toBeNull();
  });
});

describe("validateImage (Kling input rules)", () => {
  it("accepts images within limits", () => {
    expect(validateImage(png(1024, 1024)).ok).toBe(true);
  });
  it("rejects images smaller than 300 px", () => {
    expect(validateImage(png(299, 600))).toEqual({ ok: false, problem: "too_small" });
  });
  it("rejects aspect ratios outside 1:2.5 – 2.5:1", () => {
    expect(validateImage(png(2600, 1000))).toEqual({ ok: false, problem: "bad_ratio" });
    expect(validateImage(png(2500, 1000)).ok).toBe(true);
  });
});
