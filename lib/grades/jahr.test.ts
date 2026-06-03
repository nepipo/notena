import { describe, it, expect } from "vitest";
import { berechneJahresUebersicht } from "./jahr";
import type { Fach } from "./types";

const hj1: Fach[] = [
  {
    id: "m1", name: "Mathe",
    noten: [
      { punkte: 12, kategorie: "klausur" },
      { punkte: 8, kategorie: "klausur" },
    ],
  },
  { id: "d1", name: "Deutsch", noten: [{ punkte: 8, kategorie: "klausur" }] },
];

const hj2: Fach[] = [
  { id: "m2", name: "Mathe", noten: [{ punkte: 12, kategorie: "klausur" }] },
  { id: "e2", name: "Englisch", noten: [{ punkte: 14, kategorie: "klausur" }] },
];

describe("berechneJahresUebersicht", () => {
  it("gruppiert Fächer per Name über beide Halbjahre", () => {
    const u = berechneJahresUebersicht(hj1, hj2);
    expect(u.zeilen.map((z) => z.name)).toEqual(["Deutsch", "Englisch", "Mathe"]);
  });

  it("berechnet Halbjahres- und Jahresschnitt pro Fach", () => {
    const u = berechneJahresUebersicht(hj1, hj2);
    const mathe = u.zeilen.find((z) => z.name === "Mathe")!;
    expect(mathe.hj1).toBe(10);
    expect(mathe.hj2).toBe(12);
    expect(mathe.jahr).toBe(11);
  });

  it("nutzt den einzigen vorhandenen Wert, wenn ein HJ fehlt", () => {
    const u = berechneJahresUebersicht(hj1, hj2);
    const deutsch = u.zeilen.find((z) => z.name === "Deutsch")!;
    expect(deutsch.hj1).toBe(8);
    expect(deutsch.hj2).toBeNull();
    expect(deutsch.jahr).toBe(8);

    const englisch = u.zeilen.find((z) => z.name === "Englisch")!;
    expect(englisch.hj1).toBeNull();
    expect(englisch.hj2).toBe(14);
    expect(englisch.jahr).toBe(14);
  });

  it("berechnet Gesamtschnitte je HJ und fürs Jahr", () => {
    const u = berechneJahresUebersicht(hj1, hj2);
    expect(u.gesamtHj1).toBe(9); // (10 + 8) / 2
    expect(u.gesamtHj2).toBe(13); // (12 + 14) / 2
    expect(u.gesamtJahr).toBe(11); // (9 + 13) / 2
  });

  it("liefert leere Übersicht bei keinen Fächern", () => {
    const u = berechneJahresUebersicht([], []);
    expect(u.zeilen).toEqual([]);
    expect(u.gesamtJahr).toBeNull();
  });
});
