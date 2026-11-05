import { describe, expect, it } from "vitest";
import { composePrompt, generationSchema, SOURCE_IMAGE_PATH_RE, videoFiltersSchema } from "@/lib/validation";

const ORG = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";
const FILE = "33333333-3333-4333-8333-333333333333";

describe("generationSchema", () => {
  const base = { model: "kling-2.6", resolution: "720p", duration: 5, aspectRatio: "16:9", audio: false };

  it("accepts a valid text-to-video request", () => {
    const r = generationSchema.safeParse({ ...base, mode: "text_to_video", prompt: "A sunny street", negativePrompt: "blur" });
    expect(r.success).toBe(true);
  });

  it("rejects unsupported durations and aspect ratios", () => {
    expect(generationSchema.safeParse({ ...base, mode: "text_to_video", prompt: "abc", duration: 7 }).success).toBe(false);
    expect(generationSchema.safeParse({ ...base, mode: "text_to_video", prompt: "abc", aspectRatio: "4:3" }).success).toBe(false);
  });

  it("rejects combined prompt + negative prompt above the model limit", () => {
    const r = generationSchema.safeParse({ ...base, mode: "text_to_video", prompt: "a".repeat(2400), negativePrompt: "b".repeat(200) });
    expect(r.success).toBe(false);
  });

  it("rejects unknown templates", () => {
    const r = generationSchema.safeParse({ ...base, mode: "text_to_video", prompt: "abc", templateId: "nope" });
    expect(r.success).toBe(false);
  });

  it("requires a well-formed source image path for image-to-video", () => {
    const ok = generationSchema.safeParse({ ...base, mode: "image_to_video", prompt: "slow push in", sourceImagePath: `${ORG}/${USER}/${FILE}.jpg` });
    expect(ok.success).toBe(true);
    for (const bad of ["../x.jpg", `${ORG}/${USER}/${FILE}.gif`, `${ORG}/${FILE}.jpg`, `${ORG}/${USER}/${FILE}.jpg?x=1`]) {
      expect(generationSchema.safeParse({ ...base, mode: "image_to_video", prompt: "slow", sourceImagePath: bad }).success).toBe(false);
    }
  });

  it("rejects 720p native audio on Kling 2.6", () => {
    const r = generationSchema.safeParse({ ...base, mode: "text_to_video", prompt: "abc", audio: true });
    expect(r.success).toBe(false);
  });
});

describe("composePrompt", () => {
  it("appends the negative prompt as an Avoid clause", () => {
    expect(composePrompt("A cat", "blur")).toBe("A cat\n\nAvoid: blur");
    expect(composePrompt("  A cat ", "  ")).toBe("A cat");
  });
});

describe("SOURCE_IMAGE_PATH_RE", () => {
  it("captures organization and user ids", () => {
    const m = SOURCE_IMAGE_PATH_RE.exec(`${ORG}/${USER}/${FILE}.png`);
    expect(m?.[1]).toBe(ORG);
    expect(m?.[2]).toBe(USER);
  });
});

describe("videoFiltersSchema", () => {
  it("drops invalid filter values instead of failing", () => {
    const f = videoFiltersSchema.parse({ status: "bogus", model: "kling-2.6", format: "9:16", from: "2026-13-40", page: "2" });
    expect(f).toEqual({ status: undefined, model: "kling-2.6", format: "9:16", from: undefined, to: undefined, page: 2 });
  });
});
