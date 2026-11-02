import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail, parseEmail } from "@/lib/email";

describe("normalizeEmail", () => {
  it("odstrani robne presledke in pretvori v male črke", () => {
    expect(normalizeEmail("  Ana.Novak@Primer.SI \n")).toBe("ana.novak@primer.si");
  });

  it("ne odstrani pik in dodatkov za znakom +", () => {
    expect(normalizeEmail("a.n.a+camper@gmail.com")).toBe("a.n.a+camper@gmail.com");
  });

  it("odstrani nevidne presledke", () => {
    expect(normalizeEmail("​ana@primer.si﻿")).toBe("ana@primer.si");
  });
});

describe("isValidEmail", () => {
  it.each([
    "ana@primer.si",
    "ana.novak+camper@primer.si",
    "a_b-c@sub.domena.co.uk",
    "x@xn--ola-6na.si",
    "=1+1@primer.si",
  ])("sprejme %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    "",
    "ana",
    "ana@primer",
    "ana@@primer.si",
    "ana@primer..si",
    "ana@-primer.si",
    "ana@primer-.si",
    "ana primer@primer.si",
    "ana@primer.si\nbcc:x@y.si",
    "<script>@primer.si",
    "ana@primer.s",
    "ana@primer.123",
    "šola@primer.si",
    `${"a".repeat(65)}@primer.si`,
    `ana@${"a".repeat(64)}.si`,
  ])("zavrne %j", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe("parseEmail", () => {
  it("vrne normaliziran naslov", () => {
    expect(parseEmail(" ANA@PRIMER.SI ")).toEqual({ ok: true, email: "ana@primer.si" });
  });

  it("zavrne manjkajoč, neveljaven in predolg vnos", () => {
    expect(parseEmail(null)).toEqual({ ok: false, reason: "missing" });
    expect(parseEmail("   ")).toEqual({ ok: false, reason: "missing" });
    expect(parseEmail("ni-naslov")).toEqual({ ok: false, reason: "invalid" });
    expect(parseEmail(`${"a".repeat(250)}@primer.si`)).toEqual({ ok: false, reason: "too_long" });
    expect(parseEmail("a".repeat(10_000))).toEqual({ ok: false, reason: "too_long" });
  });
});
