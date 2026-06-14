import { describe, it, expect } from "vitest";
import { DE_0_15, DE_1_6, CH_1_6, AT_1_5, IB_1_7, getNotensystem } from "./systems";

describe("DE_0_15.noteZuPunkte", () => {
  it("mappt Tendenz-Noten auf Punkte", () => {
    expect(DE_0_15.noteZuPunkte("1+")).toBe(15);
    expect(DE_0_15.noteZuPunkte("1")).toBe(14);
    expect(DE_0_15.noteZuPunkte("1-")).toBe(13);
    expect(DE_0_15.noteZuPunkte("2+")).toBe(12);
    expect(DE_0_15.noteZuPunkte("5-")).toBe(1);
    expect(DE_0_15.noteZuPunkte("6")).toBe(0);
  });
  it("ist invers zu punkteZuNote fuer alle 0-15", () => {
    for (let p = 0; p <= 15; p++) {
      expect(DE_0_15.noteZuPunkte(DE_0_15.punkteZuNote(p))).toBe(p);
    }
  });
  it("gibt null bei ungueltiger Note", () => {
    expect(DE_0_15.noteZuPunkte("7")).toBeNull();
    expect(DE_0_15.noteZuPunkte("quatsch")).toBeNull();
  });
});

describe("getNotensystem", () => {
  it("liefert DE als Default", () => {
    expect(getNotensystem("de_0_15").id).toBe("de_0_15");
    expect(getNotensystem("unbekannt").id).toBe("de_0_15");
  });
});

describe("DE_0_15 erweitert", () => {
  it("hat Bereich/Richtung/Schwellen", () => {
    expect(DE_0_15.min).toBe(0);
    expect(DE_0_15.max).toBe(15);
    expect(DE_0_15.step).toBe(1);
    expect(DE_0_15.richtung).toBe("hoeher_besser");
    expect(DE_0_15.bestehtAb).toBe(5);
  });
  it("formatNote gibt Tendenz-Note", () => {
    expect(DE_0_15.formatNote(15)).toBe("1+");
    expect(DE_0_15.formatNote(13)).toBe("1−");
    expect(DE_0_15.formatNote(0)).toBe("6");
  });
  it("formatSchnitt rundet auf 1 Nachkommastelle, de-DE", () => {
    expect(DE_0_15.formatSchnitt(11.73)).toBe("11,7");
  });
  it("parse akzeptiert Note und rohe Punkte", () => {
    expect(DE_0_15.parse("2+")).toBe(12);
    expect(DE_0_15.parse("14")).toBe(14);
    expect(DE_0_15.parse("99")).toBeNull();
  });
  it("farbe nach Schwellen", () => {
    expect(DE_0_15.farbe(11)).toBe("var(--success)");
    expect(DE_0_15.farbe(8)).toBe("#f59e0b");
    expect(DE_0_15.farbe(3)).toBe("var(--destructive)");
  });
});

describe("DE_1_6", () => {
  it("Bereich + Richtung", () => {
    expect(DE_1_6.min).toBe(1);
    expect(DE_1_6.max).toBe(6);
    expect(DE_1_6.richtung).toBe("niedriger_besser");
  });
  it("parse Tendenz -> Dezimalnote", () => {
    expect(DE_1_6.parse("2")).toBe(2);
    expect(DE_1_6.parse("2+")).toBe(1.7);
    expect(DE_1_6.parse("2-")).toBe(2.3);
    expect(DE_1_6.parse("1-")).toBe(1.3);
    expect(DE_1_6.parse("1+")).toBeNull();
    expect(DE_1_6.parse("6-")).toBeNull();
    expect(DE_1_6.parse("7")).toBeNull();
  });
  it("formatNote zurück zu Tendenz", () => {
    expect(DE_1_6.formatNote(2)).toBe("2");
    expect(DE_1_6.formatNote(1.7)).toBe("2+");
    expect(DE_1_6.formatNote(2.3)).toBe("2−");
  });
  it("farbe invertiert (klein = gut)", () => {
    expect(DE_1_6.farbe(1.5)).toBe("var(--success)");
    expect(DE_1_6.farbe(3.5)).toBe("#f59e0b");
    expect(DE_1_6.farbe(5)).toBe("var(--destructive)");
  });
});

describe("CH_1_6", () => {
  it("Bereich + Richtung + Step", () => {
    expect(CH_1_6.min).toBe(1);
    expect(CH_1_6.max).toBe(6);
    expect(CH_1_6.step).toBe(0.25);
    expect(CH_1_6.richtung).toBe("hoeher_besser");
  });
  it("parse Dezimal mit Komma und Punkt", () => {
    expect(CH_1_6.parse("4,5")).toBe(4.5);
    expect(CH_1_6.parse("5.25")).toBe(5.25);
    expect(CH_1_6.parse("6")).toBe(6);
    expect(CH_1_6.parse("4,1")).toBeNull();
    expect(CH_1_6.parse("0,5")).toBeNull();
  });
  it("formatNote mit Komma", () => {
    expect(CH_1_6.formatNote(4.5)).toBe("4,5");
    expect(CH_1_6.formatNote(5.25)).toBe("5,25");
  });
  it("farbe (>=5 gut)", () => {
    expect(CH_1_6.farbe(5)).toBe("var(--success)");
    expect(CH_1_6.farbe(4)).toBe("#f59e0b");
    expect(CH_1_6.farbe(3)).toBe("var(--destructive)");
  });
});

describe("AT_1_5", () => {
  it("Bereich + Richtung", () => {
    expect(AT_1_5.min).toBe(1);
    expect(AT_1_5.max).toBe(5);
    expect(AT_1_5.richtung).toBe("niedriger_besser");
  });
  it("parse nur Ganzzahl 1-5", () => {
    expect(AT_1_5.parse("1")).toBe(1);
    expect(AT_1_5.parse("5")).toBe(5);
    expect(AT_1_5.parse("0")).toBeNull();
    expect(AT_1_5.parse("6")).toBeNull();
    expect(AT_1_5.parse("2,5")).toBeNull();
  });
  it("formatNote", () => {
    expect(AT_1_5.formatNote(2)).toBe("2");
  });
  it("farbe invertiert", () => {
    expect(AT_1_5.farbe(1.5)).toBe("var(--success)");
    expect(AT_1_5.farbe(5)).toBe("var(--destructive)");
  });
});

describe("IB_1_7", () => {
  it("Bereich + Richtung", () => {
    expect(IB_1_7.min).toBe(1);
    expect(IB_1_7.max).toBe(7);
    expect(IB_1_7.richtung).toBe("hoeher_besser");
  });
  it("parse nur Ganzzahl 1-7", () => {
    expect(IB_1_7.parse("7")).toBe(7);
    expect(IB_1_7.parse("0")).toBeNull();
    expect(IB_1_7.parse("8")).toBeNull();
  });
  it("farbe (>=5 gut)", () => {
    expect(IB_1_7.farbe(6)).toBe("var(--success)");
    expect(IB_1_7.farbe(4)).toBe("#f59e0b");
    expect(IB_1_7.farbe(2)).toBe("var(--destructive)");
  });
});
