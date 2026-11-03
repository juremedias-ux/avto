import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl, isIndexingAllowed } from "@/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSiteUrl", () => {
  it("uporabi NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://gradimocamper.vercel.app");
    expect(getSiteUrl().origin).toBe("https://gradimocamper.vercel.app");
  });

  it("lokalno brez nastavitev uporabi localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("PORT", "");
    expect(getSiteUrl().origin).toBe("http://localhost:3000");
  });

  it("na predogledu Vercel uporabi naslov predogleda", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "gradimocamper-abc123.vercel.app");
    expect(getSiteUrl().origin).toBe("https://gradimocamper-abc123.vercel.app");
  });
});

describe("isIndexingAllowed", () => {
  it("privzeto izklopljeno", () => {
    vi.stubEnv("ALLOW_INDEXING", "");
    vi.stubEnv("VERCEL_ENV", "");
    expect(isIndexingAllowed()).toBe(false);
  });

  it("vklopljeno samo z ALLOW_INDEXING=true", () => {
    vi.stubEnv("ALLOW_INDEXING", "true");
    vi.stubEnv("VERCEL_ENV", "");
    expect(isIndexingAllowed()).toBe(true);
  });

  it("predogled se nikoli ne indeksira", () => {
    vi.stubEnv("ALLOW_INDEXING", "true");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isIndexingAllowed()).toBe(false);
  });
});
