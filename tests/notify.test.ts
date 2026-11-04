import { afterEach, describe, expect, it, vi } from "vitest";
import { getNotifyEnv } from "@/lib/env";
import { buildSignupMessage } from "@/lib/notify";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildSignupMessage", () => {
  it("vsebuje naslov, privolitev, vir, čas in povezavo do administracije", () => {
    const { subject, text } = buildSignupMessage(
      {
        email: "ana.novak+camper@primer.si",
        newsletter: true,
        source: "zakljucek",
        createdAt: new Date("2026-11-04T20:05:00Z"),
      },
      "https://gradimocamper.vercel.app/admin",
    );
    expect(subject).toBe("Nova prijava – GradimoCamper");
    expect(text).toContain("E-poštni naslov: ana.novak+camper@primer.si");
    expect(text).toContain("Nasveti, novice in ponudbe: da");
    expect(text).toContain("Obrazec: zaključek strani");
    expect(text).toContain("Čas: 4. 11. 2026, 21:05");
    expect(text).toContain("Vse prijave: https://gradimocamper.vercel.app/admin");
  });

  it("brez privolitve za novice izpiše »ne«", () => {
    const { text } = buildSignupMessage(
      { email: "a@primer.si", newsletter: false, source: "prvi_zaslon", createdAt: new Date() },
      "https://example.com/admin",
    );
    expect(text).toContain("Nasveti, novice in ponudbe: ne");
    expect(text).toContain("Obrazec: prvi zaslon");
  });
});

describe("getNotifyEnv", () => {
  it("brez nastavitev je obveščanje izklopljeno", () => {
    vi.stubEnv("NOTIFY_EMAIL_TO", "");
    vi.stubEnv("SMTP_USER", "");
    vi.stubEnv("SMTP_PASSWORD", "");
    expect(getNotifyEnv()).toBeNull();
  });

  it("privzeto uporabi Gmail SMTP (465) in pošiljatelja SMTP_USER", () => {
    vi.stubEnv("NOTIFY_EMAIL_TO", "gradimo.camper@gmail.com");
    vi.stubEnv("SMTP_USER", "gradimo.camper@gmail.com");
    vi.stubEnv("SMTP_PASSWORD", "geslo-aplikacije");
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("SMTP_PORT", "");
    vi.stubEnv("NOTIFY_EMAIL_FROM", "");
    expect(getNotifyEnv()).toEqual({
      to: "gradimo.camper@gmail.com",
      from: "gradimo.camper@gmail.com",
      host: "smtp.gmail.com",
      port: 465,
      user: "gradimo.camper@gmail.com",
      password: "geslo-aplikacije",
    });
  });
});
