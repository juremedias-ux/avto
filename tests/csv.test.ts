import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";

describe("csvCell", () => {
  it("vsako vrednost zapre v narekovaje in podvoji notranje narekovaje", () => {
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell(null)).toBe('""');
  });

  it.each(["=1+1@primer.si", "+x@primer.si", "-x@primer.si", "@x", "\tx", "\rx", "  =x"])(
    "ščiti pred formulami: %j",
    (value) => {
      expect(csvCell(value).startsWith(`"'`)).toBe(true);
    },
  );

  it("običajnih vrednosti ne spreminja", () => {
    expect(csvCell("ana@primer.si")).toBe('"ana@primer.si"');
  });
});

describe("toCsv", () => {
  it("doda BOM, uporabi podpičje in CRLF", () => {
    const csv = toCsv(["email", "vir"], [["ana@primer.si", "prvi_zaslon"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('"email";"vir"\r\n"ana@primer.si";"prvi_zaslon"\r\n');
  });

  it("ohrani šumnike", () => {
    expect(toCsv(["čšž"], [])).toContain("čšž");
  });
});
