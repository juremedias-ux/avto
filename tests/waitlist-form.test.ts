import { describe, expect, it } from "vitest";
import { messages } from "@/content";
import {
  CHECKED_VALUE,
  FIELD,
  readWaitlistValues,
  validateWaitlist,
} from "@/lib/waitlist-form";

describe("validateWaitlist", () => {
  it("sprejme veljavno prijavo brez novic", () => {
    expect(
      validateWaitlist({ email: " Ana@Primer.si ", launch: true, newsletter: false, source: "zakljucek" }),
    ).toEqual({ ok: true, data: { email: "ana@primer.si", newsletter: false, source: "zakljucek" } });
  });

  it("sprejme obe privolitvi", () => {
    const result = validateWaitlist({ email: "ana@primer.si", launch: true, newsletter: true, source: "prvi_zaslon" });
    expect(result.ok && result.data.newsletter).toBe(true);
  });

  it("zahteva obvezno privolitev za zagon", () => {
    expect(
      validateWaitlist({ email: "ana@primer.si", launch: false, newsletter: true, source: "prvi_zaslon" }),
    ).toEqual({ ok: false, fieldErrors: { launch: messages.missingLaunchConsent } });
  });

  it("vrne obe napaki hkrati", () => {
    expect(validateWaitlist({ email: "x", launch: false, newsletter: false, source: "prvi_zaslon" })).toEqual({
      ok: false,
      fieldErrors: { email: messages.invalidEmail, launch: messages.missingLaunchConsent },
    });
  });

  it("neveljaven vir nadomesti z privzetim", () => {
    const result = validateWaitlist({ email: "ana@primer.si", launch: true, newsletter: false, source: "drugo" });
    expect(result.ok && result.data.source).toBe("prvi_zaslon");
  });

  it("privolitev za novice ni pogoj za prijavo", () => {
    expect(validateWaitlist({ email: "ana@primer.si", launch: true, newsletter: false, source: "prvi_zaslon" }).ok).toBe(true);
  });
});

describe("readWaitlistValues", () => {
  it("prebere samo pričakovane vrednosti potrditvenih polj", () => {
    const data = new FormData();
    data.set(FIELD.email, "ana@primer.si");
    data.set(FIELD.launch, CHECKED_VALUE);
    data.set(FIELD.newsletter, "true");
    expect(readWaitlistValues(data)).toEqual({ email: "ana@primer.si", launch: true, newsletter: false });
  });

  it("omeji dolžino vrnjenega vnosa", () => {
    const data = new FormData();
    data.set(FIELD.email, "a".repeat(5000));
    expect(readWaitlistValues(data).email.length).toBe(320);
  });
});
