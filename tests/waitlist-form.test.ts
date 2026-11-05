import { describe, expect, it } from "vitest";
import { messages } from "@/content";
import { FIELD, readWaitlistValues, validateWaitlist } from "@/lib/waitlist-form";

describe("validateWaitlist", () => {
  it("sprejme prijavo samo z e-poštnim naslovom", () => {
    expect(validateWaitlist({ email: " Ana@Primer.si ", source: "zakljucek" })).toEqual({
      ok: true,
      data: { email: "ana@primer.si", newsletter: false, source: "zakljucek" },
    });
  });

  it("privolitev za novice je vedno »ne« (obrazec je ne ponuja)", () => {
    const result = validateWaitlist({ email: "ana@primer.si", source: "prvi_zaslon" });
    expect(result.ok && result.data.newsletter).toBe(false);
  });

  it("zavrne neveljaven naslov", () => {
    expect(validateWaitlist({ email: "x", source: "prvi_zaslon" })).toEqual({
      ok: false,
      fieldErrors: { email: messages.invalidEmail },
    });
  });

  it("neveljaven vir nadomesti z privzetim", () => {
    const result = validateWaitlist({ email: "ana@primer.si", source: "drugo" });
    expect(result.ok && result.data.source).toBe("prvi_zaslon");
  });
});

describe("readWaitlistValues", () => {
  it("prebere samo e-poštni naslov (ročno poslano polje za novice se prezre)", () => {
    const data = new FormData();
    data.set(FIELD.email, "ana@primer.si");
    data.set("novice", "da");
    expect(readWaitlistValues(data)).toEqual({ email: "ana@primer.si" });
  });

  it("omeji dolžino vrnjenega vnosa", () => {
    const data = new FormData();
    data.set(FIELD.email, "a".repeat(5000));
    expect(readWaitlistValues(data).email.length).toBe(320);
  });
});
