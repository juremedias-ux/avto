import { describe, expect, it } from "vitest";
import { formatPrice, plural, routes } from "@/lib/platform";
import { SLUG_PATTERN, slugify } from "@/lib/slugify";
import { youtubeIdFromUrl } from "@/lib/youtube";

describe("slugify", () => {
  it("odstrani šumnike in posebne znake", () => {
    expect(slugify("Električni sistem 12 V")).toBe("elektricni-sistem-12-v");
    expect(slugify("Čiščenje, žaganje & šivanje")).toBe("ciscenje-zaganje-in-sivanje");
    expect(slugify("Đuro  –  kombi!")).toBe("duro-kombi");
  });

  it("vrne veljaven URL brez vezajev na robovih", () => {
    const slug = slugify("  --Prvi koraki: kako načrtovati predelavo kombija?--  ");
    expect(slug).toBe("prvi-koraki-kako-nacrtovati-predelavo-kombija");
    expect(SLUG_PATTERN.test(slug)).toBe(true);
  });

  it("omeji dolžino in ne konča z vezajem", () => {
    const slug = slugify("beseda ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(96);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("youtubeIdFromUrl", () => {
  const id = "dQw4w9WgXcQ";
  it.each([
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://m.youtube.com/watch?v=${id}&t=30s`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}`,
  ])("prepozna %s", (input) => {
    expect(youtubeIdFromUrl(input)).toBe(id);
  });

  it.each(["", "to ni povezava", "https://vimeo.com/123", `https://evil.example/watch?v=${id}`, "https://youtu.be/kratek"])(
    "zavrne %s",
    (input) => {
      expect(youtubeIdFromUrl(input)).toBeNull();
    },
  );
});

describe("plural", () => {
  it("uporabi pravilno slovensko množino", () => {
    const forms: [string, string, string, string] = ["izdelek", "izdelka", "izdelki", "izdelkov"];
    expect(plural(1, forms)).toBe("1 izdelek");
    expect(plural(2, forms)).toBe("2 izdelka");
    expect(plural(3, forms)).toBe("3 izdelki");
    expect(plural(4, forms)).toBe("4 izdelki");
    expect(plural(5, forms)).toBe("5 izdelkov");
    expect(plural(0, forms)).toBe("0 izdelkov");
    expect(plural(101, forms)).toBe("101 izdelek");
    expect(plural(111, forms)).toBe("111 izdelkov");
  });
});

describe("routes in cene", () => {
  it("sestavi poti izdelkov", () => {
    expect(routes.product("elektrika", "baterija")).toBe("/izdelki/elektrika/baterija");
  });

  it("brez cene vrne null (prikaz »Cena na povpraševanje«)", () => {
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice(undefined)).toBeNull();
    expect(formatPrice(129)).toMatch(/129,00\s€/);
  });
});
