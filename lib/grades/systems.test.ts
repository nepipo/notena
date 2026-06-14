import { describe, it, expect } from "vitest";
import { DE_0_15, getNotensystem } from "./systems";

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
