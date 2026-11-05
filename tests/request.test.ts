import { describe, expect, it } from "vitest";
import { checkPublicOrigin, isSameOrigin } from "@/lib/request";
import { cleanEnvValue, normalizeSupabaseUrl } from "@/lib/supabase/url";

const h = (values: Record<string, string>) => new Headers(values);

describe("checkPublicOrigin (javni obrazec)", () => {
  const host = { host: "gradimocamper.vercel.app" };

  it("sprejme isti izvor", () => {
    expect(checkPublicOrigin(h({ ...host, origin: "https://gradimocamper.vercel.app" })).ok).toBe(true);
  });

  it("sprejme zahtevo brez glave Origin (vgrajeni brskalniki)", () => {
    expect(checkPublicOrigin(h(host)).ok).toBe(true);
    expect(checkPublicOrigin(h({ ...host, referer: "https://gradimocamper.vercel.app/" })).ok).toBe(true);
  });

  it("upošteva x-forwarded-host", () => {
    expect(
      checkPublicOrigin(h({ host: "interno:3000", "x-forwarded-host": "gradimocamper.vercel.app", origin: "https://gradimocamper.vercel.app" })).ok,
    ).toBe(true);
  });

  it("zavrne drug izvor", () => {
    expect(checkPublicOrigin(h({ ...host, origin: "https://napadalec.example" })).ok).toBe(false);
    expect(checkPublicOrigin(h({ ...host, referer: "https://napadalec.example/stran" })).ok).toBe(false);
  });
});

describe("isSameOrigin (administracija, strogo)", () => {
  it("zahteva glavo Origin z istim gostiteljem", () => {
    expect(isSameOrigin(h({ host: "a.si", origin: "https://a.si" }))).toBe(true);
    expect(isSameOrigin(h({ host: "a.si" }))).toBe(false);
    expect(isSameOrigin(h({ host: "a.si", origin: "null" }))).toBe(false);
    expect(isSameOrigin(h({ host: "a.si", origin: "https://b.si" }))).toBe(false);
  });
});

describe("nastavitve Supabase", () => {
  it.each([
    ["https://rplgjmogsajzzfkohxwy.supabase.co", "https://rplgjmogsajzzfkohxwy.supabase.co"],
    ["https://rplgjmogsajzzfkohxwy.supabase.co/", "https://rplgjmogsajzzfkohxwy.supabase.co"],
    ["rplgjmogsajzzfkohxwy.supabase.co", "https://rplgjmogsajzzfkohxwy.supabase.co"],
    ["https://rplgjmogsajzzfkohxwy.supabase.co/rest/v1/", "https://rplgjmogsajzzfkohxwy.supabase.co"],
    ["http://127.0.0.1:54321", "http://127.0.0.1:54321"],
  ])("uskladi %s", (input, expected) => {
    expect(normalizeSupabaseUrl(input)).toBe(expected);
  });

  it("zavrne nešifriran oddaljen naslov", () => {
    expect(normalizeSupabaseUrl("http://primer.supabase.co")).toBeNull();
  });

  it("odstrani narekovaje in presledke", () => {
    expect(cleanEnvValue('  "sb_secret_abc"  ')).toBe("sb_secret_abc");
    expect(cleanEnvValue("'abc'")).toBe("abc");
    expect(cleanEnvValue("   ")).toBeUndefined();
  });
});
