import { describe, expect, it } from "vitest";
import { INQUIRY_LIMITS, inquiryMessages, parseInquiryItems, validateInquiry } from "@/lib/inquiry-form";

const base = { vrsta: "povprasevanje", ime: "", email: "ana@primer.si", sporocilo: "", izdelki: [{ id: 1, kolicina: 2 }] };

describe("parseInquiryItems", () => {
  it("prebere veljaven seznam", () => {
    expect(parseInquiryItems(JSON.stringify([{ id: 3, kolicina: 2 }, { id: 5, kolicina: 1 }]))).toEqual([
      { id: 3, kolicina: 2 },
      { id: 5, kolicina: 1 },
    ]);
  });

  it("izpusti neveljavne in podvojene vnose ter omeji količino", () => {
    const raw = JSON.stringify([{ id: "x" }, { id: -1 }, { id: 2, kolicina: 500 }, { id: 2, kolicina: 1 }, { id: 4, kolicina: 0 }, null]);
    expect(parseInquiryItems(raw)).toEqual([
      { id: 2, kolicina: INQUIRY_LIMITS.quantity },
      { id: 4, kolicina: 1 },
    ]);
  });

  it("omeji število izdelkov in zavrne neveljaven JSON", () => {
    const many = JSON.stringify(Array.from({ length: 50 }, (_, i) => ({ id: i + 1, kolicina: 1 })));
    expect(parseInquiryItems(many)).toHaveLength(INQUIRY_LIMITS.items);
    expect(parseInquiryItems("{ni json")).toEqual([]);
    expect(parseInquiryItems(null)).toEqual([]);
    expect(parseInquiryItems("x".repeat(6000))).toEqual([]);
  });
});

describe("validateInquiry", () => {
  it("sprejme povpraševanje z izdelki in normalizira e-naslov", () => {
    const result = validateInquiry({ ...base, email: " Ana@Primer.SI ", ime: " Ana " });
    expect(result).toEqual({
      ok: true,
      data: { vrsta: "povprasevanje", ime: "Ana", email: "ana@primer.si", sporocilo: null, izdelki: [{ id: 1, kolicina: 2 }] },
    });
  });

  it("povpraševanje brez izdelkov ni veljavno", () => {
    expect(validateInquiry({ ...base, izdelki: [] })).toEqual({
      ok: false,
      fieldErrors: { izdelki: inquiryMessages.itemsRequired },
    });
  });

  it("vprašanje zahteva besedilo, izdelki niso obvezni", () => {
    expect(validateInquiry({ ...base, vrsta: "vprasanje", izdelki: [] })).toEqual({
      ok: false,
      fieldErrors: { sporocilo: inquiryMessages.messageRequired },
    });
    const ok = validateInquiry({ ...base, vrsta: "vprasanje", izdelki: [], sporocilo: "Ali ustreza?" });
    expect(ok.ok).toBe(true);
  });

  it("neznana vrsta postane vprašanje", () => {
    const result = validateInquiry({ ...base, vrsta: "placilo", sporocilo: "Živjo" });
    expect(result.ok && result.data.vrsta).toBe("vprasanje");
  });

  it("zavrne neveljaven e-naslov ter predolgo ime in sporočilo", () => {
    const result = validateInquiry({
      ...base,
      email: "ni-naslov",
      ime: "a".repeat(INQUIRY_LIMITS.name + 1),
      sporocilo: "b".repeat(INQUIRY_LIMITS.message + 1),
    });
    expect(result).toEqual({
      ok: false,
      fieldErrors: {
        email: inquiryMessages.invalidEmail,
        ime: inquiryMessages.nameTooLong,
        sporocilo: inquiryMessages.messageTooLong,
      },
    });
  });
});
