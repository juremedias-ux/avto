import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { sl } from "@/lib/i18n/sl";
import { format, negotiateLocale, plural } from "@/lib/i18n/config";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => (typeof v === "object" && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe("dictionaries", () => {
  it("have identical keys", () => {
    expect(keys(sl).sort()).toEqual(keys(en).sort());
  });

  it("keep the same placeholders in both languages", () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(",");
    const flat = (obj: object, prefix = ""): [string, string][] =>
      Object.entries(obj).flatMap(([k, v]) => (typeof v === "object" ? flat(v, `${prefix}${k}.`) : [[`${prefix}${k}`, String(v)]]));
    const enMap = new Map(flat(en));
    for (const [key, value] of flat(sl)) expect(placeholders(value), key).toBe(placeholders(enMap.get(key) ?? ""));
  });
});

describe("plural", () => {
  it("uses the four Slovenian plural forms", () => {
    expect(plural(sl.credits, 1, "sl")).toBe("1 kredit");
    expect(plural(sl.credits, 2, "sl")).toBe("2 kredita");
    expect(plural(sl.credits, 3, "sl")).toBe("3 krediti");
    expect(plural(sl.credits, 5, "sl")).toBe("5 kreditov");
    expect(plural(sl.credits, 101, "sl")).toBe("101 kredit");
  });
  it("uses English forms", () => {
    expect(plural(en.credits, 1, "en")).toBe("1 credit");
    expect(plural(en.credits, 2, "en")).toBe("2 credits");
  });
});

describe("format and negotiateLocale", () => {
  it("replaces known placeholders only", () => {
    expect(format("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
  it("picks the preferred supported language", () => {
    expect(negotiateLocale("en-US,en;q=0.9,sl;q=0.8")).toBe("en");
    expect(negotiateLocale("de-DE,sl;q=0.5")).toBe("sl");
    expect(negotiateLocale("fr")).toBe("sl");
    expect(negotiateLocale(null)).toBe("sl");
  });
});
