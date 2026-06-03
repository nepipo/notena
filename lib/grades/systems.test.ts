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
