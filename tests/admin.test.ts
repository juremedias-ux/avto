import { describe, expect, it } from "vitest";
import { adminUrl, parseAdminQuery } from "@/lib/admin-params";
import { consentFingerprint } from "@/lib/consent";
import { localDateStamp, toLocalIso } from "@/lib/format";
import { rateLimitKey } from "@/lib/rate-limit";
import { toSearchPattern } from "@/lib/waitlist";

describe("parseAdminQuery / adminUrl", () => {
  it("privzete vrednosti", () => {
    expect(parseAdminQuery({})).toEqual({ search: "", page: 1, sort: "najnovejse" });
  });

  it("zavrne neveljavne strani in razvrščanja", () => {
    expect(parseAdminQuery({ stran: "-3", razvrsti: "x" })).toEqual({ search: "", page: 1, sort: "najnovejse" });
    expect(parseAdminQuery({ stran: "abc" }).page).toBe(1);
  });

  it("URL vedno ostane na /admin", () => {
    expect(adminUrl({ search: "//evil.example", page: 2, sort: "najstarejse" }, "izbrisano")).toBe(
      "/admin?iskanje=%2F%2Fevil.example&razvrsti=najstarejse&stran=2&obvestilo=izbrisano",
    );
    expect(adminUrl({})).toBe("/admin");
  });
});

describe("toSearchPattern", () => {
  it("ubeži posebne znake vzorca ILIKE", () => {
    expect(toSearchPattern("a%b_c\\d")).toBe("%a\\%b\\_c\\\\d%");
  });

  it("odstrani nadomestni znak * in prazne nize", () => {
    expect(toSearchPattern("*")).toBeNull();
    expect(toSearchPattern("   ")).toBeNull();
    expect(toSearchPattern("Ana*")).toBe("%ana%");
  });
});

describe("rateLimitKey", () => {
  it("ne vsebuje IP-naslova in je stabilen", () => {
    const key = rateLimitKey("waitlist", "203.0.113.5", "skrivnost");
    expect(key).toMatch(/^waitlist:[A-Za-z0-9_-]{32}$/);
    expect(key).not.toContain("203.0.113.5");
    expect(rateLimitKey("waitlist", "203.0.113.5", "skrivnost")).toBe(key);
    expect(rateLimitKey("waitlist", "203.0.113.5", "druga")).not.toBe(key);
  });
});

describe("consentFingerprint", () => {
  it("se spremeni ob spremembi besedila", () => {
    expect(consentFingerprint(["a", "b"])).toMatch(/^[0-9a-f]{8}$/);
    expect(consentFingerprint(["a", "b"])).not.toBe(consentFingerprint(["a", "c"]));
  });
});

describe("format", () => {
  it("lokalni ISO čas z odmikom (zimski in poletni čas)", () => {
    expect(toLocalIso("2026-01-15T10:00:00Z")).toBe("2026-01-15T11:00:00+01:00");
    expect(toLocalIso("2026-07-15T10:00:00Z")).toBe("2026-07-15T12:00:00+02:00");
    expect(toLocalIso(null)).toBe("");
  });

  it("datum za ime datoteke", () => {
    expect(localDateStamp(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });
});
