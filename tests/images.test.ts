import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { images } from "@/content";

/** Prebere širino in višino iz glave datoteke PNG. */
function pngSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  expect(buf.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe("slike v content.ts", () => {
  for (const [name, image] of Object.entries(images)) {
    const file = join(process.cwd(), "public", image.src);
    it.skipIf(!existsSync(file) || !image.src.endsWith(".png"))(
      `${name}: mere v content.ts se ujemajo z datoteko`,
      () => {
        expect(pngSize(file)).toEqual({ width: image.width, height: image.height });
      },
    );

    it(`${name}: ima opis in barvo ozadja`, () => {
      expect(image.alt.length).toBeGreaterThan(20);
      expect(image.background).toMatch(/^#[0-9a-f]{6}$/i);
    });
  }
});
