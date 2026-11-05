import { describe, expect, it } from "vitest";
import { messages } from "@/content";
import {
  CHECKED_VALUE,
  FIELD,
  readWaitlistValues,
  validateWaitlist,
} from "@/lib/waitlist-form";

describe("validateWaitlist", () => {
  it("sprejme prijavo samo z e-poštnim naslovom (brez potrditvenih polj)", () => {
    expect(
      validateWaitlist({ email: " Ana@Primer.si ", newsletter: false, source: "zakljucek" }),
    ).toEqual({ ok: true, data: { email: "ana@primer.si", newsletter: false, source: "zakljucek" } });
  });

  it("sprejme tudi neobvezno privolitev za novice", () => {
    const result = validateWaitlist({ email: "ana@primer.si", newsletter: true, source: "prvi_zaslon" });
    expect(result.ok && result.data.newsletter).toBe(true);
  });

  it("zavrne neveljaven naslov", () => {
    expect(validateWaitlist({ email: "x", newsletter: false, source: "prvi_zaslon" })).toEqual({
      ok: false,
      fieldErrors: { email: messages.invalidEmail },
    });
  });

  it("neveljaven vir nadomesti z privzetim", () => {
    const result = validateWaitlist({ email: "ana@primer.si", newsletter: false, source: "drugo" });
    expect(result.ok && result.data.source).toBe("prvi_zaslon");
  });

  it("novice niso označene, če vrednost ni točno true", () => {
    const result = validateWaitlist({ email: "ana@primer.si", newsletter: "true", source: "prvi_zaslon" });
    expect(result.ok && result.data.newsletter).toBe(false);
  });
});

describe("readWaitlistValues", () => {
  it("prebere samo pričakovano vrednost potrditvenega polja", () => {
    const data = new FormData();
    data.set(FIELD.email, "ana@primer.si");
    data.set(FIELD.newsletter, "true");
    expect(readWaitlistValues(data)).toEqual({ email: "ana@primer.si", newsletter: false });
    data.set(FIELD.newsletter, CHECKED_VALUE);
    expect(readWaitlistValues(data).newsletter).toBe(true);
  });

  it("omeji dolžino vrnjenega vnosa", () => {
    const data = new FormData();
    data.set(FIELD.email, "a".repeat(5000));
    expect(readWaitlistValues(data).email.length).toBe(320);
  });
});
