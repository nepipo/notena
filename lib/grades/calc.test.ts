import { describe, it, expect } from "vitest";
import {
  clampPunkte,
  runde,
  punkteZuNote,
  kategorieSchnitt,
  fachSchnitt,
  fachSchnittGerundet,
  gesamtSchnitt,
  wasWaereWenn,
  kategorieZurGruppe,
  benoetigtePunkte,
} from "./calc";
import type { Fach, Note } from "./types";

describe("benoetigtePunkte", () => {
  it("gibt 'erreicht' wenn das Ziel schon erfüllt ist", () => {
    const noten: Note[] = [{ punkte: 13, kategorie: "klausur" }];
    expect(benoetigtePunkte(noten, undefined, "klausur", 1, 10)).toBe("erreicht");
  });
  it("liefert die kleinste Punktzahl, die das Ziel erreicht", () => {
    // Eine Klausur mit 8. Zweite Klausur, gleiches Gewicht. Ziel-Schnitt 10.
    // (8 + x) / 2 >= 10  ->  x >= 12.
    const noten: Note[] = [{ punkte: 8, kategorie: "klausur" }];
    expect(benoetigtePunkte(noten, undefined, "klausur", 1, 10)).toBe(12);
  });
  it("gibt 'unmoeglich' wenn selbst 15 Punkte nicht reichen", () => {
    // Klausur 0. Ziel 10. (0 + 15)/2 = 7.5 < 10 -> unmöglich.
    const noten: Note[] = [{ punkte: 0, kategorie: "klausur" }];
    expect(benoetigtePunkte(noten, undefined, "klausur", 1, 10)).toBe("unmoeglich");
  });
  it("rechnet das erste Fach (noch keine Noten) korrekt", () => {
    // Keine Noten. Eine Klausur. Ziel 12 -> brauchst genau 12.
    expect(benoetigtePunkte([], undefined, "klausur", 1, 12)).toBe(12);
  });
});

describe("kategorieZurGruppe", () => {
  it("mappt klausur auf klausur", () => {
    expect(kategorieZurGruppe("klausur")).toBe("klausur");
  });
  it("mappt muendlich, test, referat, hausaufgabe, sonstige auf muendlich", () => {
    expect(kategorieZurGruppe("muendlich")).toBe("muendlich");
    expect(kategorieZurGruppe("test")).toBe("muendlich");
    expect(kategorieZurGruppe("referat")).toBe("muendlich");
    expect(kategorieZurGruppe("hausaufgabe")).toBe("muendlich");
    expect(kategorieZurGruppe("sonstige")).toBe("muendlich");
  });
});

describe("fachSchnitt mit neuen Kategorien", () => {
  it("Test-Noten fliessen in die muendlich-Gruppe (Test-Gewicht 0)", () => {
    const noten: Note[] = [
      { punkte: 12, kategorie: "klausur" },
      { punkte: 8, kategorie: "test" },
    ];
    const result = fachSchnitt(noten, { klausur: 0.5, muendlich: 0.5 });
    expect(result).toBeCloseTo(10, 5);
  });
  it("Referat + Mündlich kombinieren sich in der muendlich-Gruppe", () => {
    const noten: Note[] = [
      { punkte: 14, kategorie: "referat", gewicht: 2 },
      { punkte: 10, kategorie: "muendlich", gewicht: 1 },
    ];
    const result = fachSchnitt(noten);
    expect(result).toBeCloseTo(38 / 3, 5);
  });
});

describe("fachSchnitt mit eigenen Kategorie-Gewichten", () => {
  it("respektiert ein eigenes Test-Gewicht (Klausur 50 / Test 20 / Mündlich 30)", () => {
    const noten: Note[] = [
      { punkte: 12, kategorie: "klausur" },
      { punkte: 6, kategorie: "test" },
      { punkte: 9, kategorie: "muendlich" },
    ];
    // 12*0.5 + 6*0.2 + 9*0.3 = 6 + 1.2 + 2.7 = 9.9
    expect(fachSchnitt(noten, { klausur: 0.5, test: 0.2, muendlich: 0.3 })).toBeCloseTo(9.9, 5);
  });
  it("renormalisiert, wenn eine gewichtete Kategorie keine Noten hat", () => {
    const noten: Note[] = [
      { punkte: 12, kategorie: "klausur" },
      { punkte: 6, kategorie: "test" },
    ];
    // Mündlich (30 %) fehlt -> Klausur 50/70, Test 20/70
    expect(fachSchnitt(noten, { klausur: 0.5, test: 0.2, muendlich: 0.3 })).toBeCloseTo(
      (12 * 0.5 + 6 * 0.2) / 0.7,
      5,
    );
  });
  it("Hausaufgaben mit eigenem Gewicht bilden einen eigenen Bucket", () => {
    const noten: Note[] = [
      { punkte: 15, kategorie: "hausaufgabe" },
      { punkte: 5, kategorie: "muendlich" },
    ];
    // HA 10 %, Mündlich 40 % -> renormalisiert 0.2 / 0.8
    expect(fachSchnitt(noten, { klausur: 0.5, muendlich: 0.4, hausaufgabe: 0.1 })).toBeCloseTo(
      15 * 0.2 + 5 * 0.8,
      5,
    );
  });
  it("Kategorie mit 0 % zählt wie mündlich (fällt nicht raus)", () => {
    const noten: Note[] = [
      { punkte: 12, kategorie: "muendlich" },
      { punkte: 6, kategorie: "hausaufgabe" },
    ];
    // HA 0 % -> beide im Mündlich-Bucket, gleichgewichtet -> 9
    expect(fachSchnitt(noten, { klausur: 0.5, muendlich: 0.5, hausaufgabe: 0 })).toBeCloseTo(9, 5);
  });
  it("Custom-Kategorien zählen wie mündliche Noten", () => {
    const noten: Note[] = [
      { punkte: 12, kategorie: "klausur" },
      { punkte: 8, kategorie: "custom_abc123def456" },
    ];
    expect(fachSchnitt(noten, { klausur: 0.5, muendlich: 0.5 })).toBeCloseTo(10, 5);
  });
});

describe("clampPunkte", () => {
  it("begrenzt auf 0–15", () => {
    expect(clampPunkte(-3)).toBe(0);
    expect(clampPunkte(20)).toBe(15);
    expect(clampPunkte(9)).toBe(9);
  });
  it("behandelt NaN als 0", () => {
    expect(clampPunkte(NaN)).toBe(0);
  });
});

describe("runde", () => {
  it("rundet auf 1 Dezimalstelle", () => {
    expect(runde(10.799999999999999)).toBe(10.8);
    expect(runde(11.04)).toBe(11);
    expect(runde(11.05)).toBe(11.1);
  });
});

describe("punkteZuNote", () => {
  it("bildet alle Punktwerte korrekt ab", () => {
    const erwartet: Record<number, string> = {
      15: "1+", 14: "1", 13: "1−",
      12: "2+", 11: "2", 10: "2−",
      9: "3+", 8: "3", 7: "3−",
      6: "4+", 5: "4", 4: "4−",
      3: "5+", 2: "5", 1: "5−",
      0: "6",
    };
    for (let p = 0; p <= 15; p++) {
      expect(punkteZuNote(p)).toBe(erwartet[p]);
    }
  });
});

describe("kategorieSchnitt", () => {
  const noten: Note[] = [
    { punkte: 8, kategorie: "klausur" },
    { punkte: 10, kategorie: "klausur" },
    { punkte: 12, kategorie: "muendlich" },
  ];
  it("mittelt innerhalb einer Kategorie", () => {
    expect(kategorieSchnitt(noten, "klausur")).toBe(9);
    expect(kategorieSchnitt(noten, "muendlich")).toBe(12);
  });
  it("gibt null bei leerer Kategorie", () => {
    expect(kategorieSchnitt(noten, "sonstige")).toBeNull();
  });
  it("berücksichtigt Einzelgewichte", () => {
    // 10 (x2) und 4 (x1) -> (20+4)/3 = 8
    const g: Note[] = [
      { punkte: 10, kategorie: "klausur", gewicht: 2 },
      { punkte: 4, kategorie: "klausur", gewicht: 1 },
    ];
    expect(kategorieSchnitt(g, "klausur")).toBe(8);
  });
});

describe("fachSchnitt", () => {
  it("kombiniert Kategorien 50/50", () => {
    const noten: Note[] = [
      { punkte: 12, kategorie: "klausur" },
      { punkte: 10, kategorie: "muendlich" },
    ];
    expect(fachSchnitt(noten)).toBe(11);
  });
  it("renormalisiert, wenn eine Kategorie fehlt", () => {
    // Nur Klausur trotz 40/60 -> Klausur zählt 100 %
    const noten: Note[] = [{ punkte: 13, kategorie: "klausur" }];
    expect(fachSchnitt(noten, { klausur: 0.4, muendlich: 0.6 })).toBe(13);
  });
  it("rechnet gewichtete Kombination korrekt", () => {
    const noten: Note[] = [
      { punkte: 8, kategorie: "klausur" },
      { punkte: 10, kategorie: "klausur" },
      { punkte: 12, kategorie: "muendlich" },
    ];
    // klausur avg 9 * 0.4 + muendlich 12 * 0.6 = 10.8
    expect(fachSchnitt(noten, { klausur: 0.4, muendlich: 0.6 })).toBeCloseTo(
      10.8,
      5,
    );
  });
  it("gibt null ohne Noten", () => {
    expect(fachSchnitt([])).toBeNull();
  });
  it("fachSchnittGerundet rundet auf 1 Dezimalstelle", () => {
    const noten: Note[] = [
      { punkte: 8, kategorie: "klausur" },
      { punkte: 10, kategorie: "klausur" },
      { punkte: 12, kategorie: "muendlich" },
    ];
    expect(fachSchnittGerundet(noten, { klausur: 0.4, muendlich: 0.6 })).toBe(
      10.8,
    );
  });
});

describe("gesamtSchnitt", () => {
  const faecher: Fach[] = [
    {
      id: "ma",
      name: "Mathe",
      noten: [
        { punkte: 12, kategorie: "klausur" },
        { punkte: 10, kategorie: "muendlich" },
      ],
    }, // 11
    {
      id: "de",
      name: "Deutsch",
      noten: [
        { punkte: 14, kategorie: "klausur" },
        { punkte: 12, kategorie: "muendlich" },
      ],
    }, // 13
  ];
  it("mittelt über Fächer gleich gewichtet", () => {
    expect(gesamtSchnitt(faecher)).toBe(12);
  });
  it("berücksichtigt fachGewicht", () => {
    // Mathe (11) doppelt, Deutsch (13) einfach -> (22+13)/3 = 11.666…
    const gew: Fach[] = [
      { ...faecher[0], fachGewicht: 2 },
      { ...faecher[1], fachGewicht: 1 },
    ];
    expect(gesamtSchnitt(gew)).toBeCloseTo(11.6667, 3);
  });
  it("ignoriert Fächer ohne Noten", () => {
    const mitLeer: Fach[] = [...faecher, { id: "bio", name: "Bio", noten: [] }];
    expect(gesamtSchnitt(mitLeer)).toBe(12);
  });
  it("gibt null, wenn kein Fach Noten hat", () => {
    expect(gesamtSchnitt([{ id: "x", name: "X", noten: [] }])).toBeNull();
  });
});

describe("wasWaereWenn", () => {
  it("berechnet Schnitt mit hypothetischer Note, ohne Original zu ändern", () => {
    const noten: Note[] = [{ punkte: 10, kategorie: "klausur" }];
    const ergebnis = wasWaereWenn(
      noten,
      { punkte: 14, kategorie: "klausur" },
      { klausur: 1, muendlich: 0, sonstige: 0 },
    );
    expect(ergebnis).toBe(12); // (10+14)/2
    expect(noten).toHaveLength(1); // unverändert
  });
});
