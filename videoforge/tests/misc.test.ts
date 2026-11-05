import { describe, expect, it } from "vitest";
import { ilikeTerm } from "@/lib/admin";
import { safeNextPath } from "@/lib/auth";
import { parseDbErrorCode } from "@/lib/db/errors";
import { PROMPT_TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";

describe("safeNextPath", () => {
  it("allows only same-site relative paths", () => {
    expect(safeNextPath("/library?x=1")).toBe("/library?x=1");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
  });
});

describe("parseDbErrorCode", () => {
  it("extracts VF_ codes from PostgREST messages", () => {
    expect(parseDbErrorCode({ message: "VF_INSUFFICIENT_CREDITS" })).toBe("VF_INSUFFICIENT_CREDITS");
    expect(parseDbErrorCode({ message: "duplicate key" })).toBeNull();
  });
});

describe("ilikeTerm", () => {
  it("strips PostgREST filter syntax characters", () => {
    expect(ilikeTerm("ana,status.eq.active")).toBe("*ana status.eq.active*");
    expect(ilikeTerm("a)b(c*d%")).toBe("*a b c d*");
    expect(ilikeTerm("  ")).toBeNull();
  });
});

describe("prompt templates", () => {
  it("cover every category with unique ids", () => {
    for (const category of TEMPLATE_CATEGORIES) {
      expect(PROMPT_TEMPLATES.some((t) => t.category === category)).toBe(true);
    }
    expect(new Set(PROMPT_TEMPLATES.map((t) => t.id)).size).toBe(PROMPT_TEMPLATES.length);
  });
});
