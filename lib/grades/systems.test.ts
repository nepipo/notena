import { describe, it, expect } from "vitest";
import {
  DE_0_15,
  DE_1_6,
  CH_1_6,
  AT_1_5,
  IB_1_7,
  getNotensystem,
  noteEingabeProps,
} from "./systems";

// Im kanonischen Modell ist der gespeicherte Wert IMMER 0–15 Punkte.
// parse() liefert Punkte, formatNote()/formatSchnitt() rechnen Punkte -> System.

describe("DE_0_15.noteZuPunkte (Note -> Punkte)", () => {
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

describe("Kanonisch: alle Systeme arbeiten auf 0–15 Punkten", () => {
  for (const sys of [DE_0_15, DE_1_6, CH_1_6, AT_1_5, IB_1_7]) {
    it(`${sys.id}: min=0, max=15`, () => {
      expect(sys.min).toBe(0);
      expect(sys.max).toBe(15);
    });
  }
});

describe("DE_0_15 — Anzeige = Punkte", () => {
  it("formatNote zeigt Punkte", () => {
    expect(DE_0_15.formatNote(14)).toBe("14");
    expect(DE_0_15.formatNote(0)).toBe("0");
  });
  it("formatSchnitt: 1 Nachkommastelle de-DE", () => {
    expect(DE_0_15.formatSchnitt(11.73)).toBe("11,7");
  });
  it("parse akzeptiert Punkte und Note", () => {
    expect(DE_0_15.parse("14")).toBe(14);
    expect(DE_0_15.parse("2+")).toBe(12);
    expect(DE_0_15.parse("99")).toBeNull();
  });
  it("exakt", () => {
    expect(DE_0_15.exakt).toBe(true);
  });
});

describe("noteEingabeProps — Eingabefeld-Konfiguration pro System", () => {
  it("DE-Systeme (Tendenz +/−) brauchen ein Textfeld", () => {
    expect(noteEingabeProps(DE_0_15).type).toBe("text");
    expect(noteEingabeProps(DE_1_6).type).toBe("text");
    expect(noteEingabeProps(DE_0_15).inputMode).toBe("text");
    expect(noteEingabeProps(DE_1_6).inputMode).toBe("text");
  });
  it("Zahl-Systeme bleiben number mit passender Mobile-Tastatur", () => {
    expect(noteEingabeProps(CH_1_6).type).toBe("number");
    expect(noteEingabeProps(CH_1_6).inputMode).toBe("decimal");
    expect(noteEingabeProps(AT_1_5).inputMode).toBe("numeric");
    expect(noteEingabeProps(IB_1_7).inputMode).toBe("numeric");
  });
  it("Placeholder ist der System-Eingabehinweis", () => {
    expect(noteEingabeProps(DE_1_6).placeholder).toBe(DE_1_6.eingabeHinweis);
  });
});

describe("DE_1_6 — Eingabe von +/− Tendenz-Noten", () => {
  it("parst +/− inkl. Unicode-Minus (−) und ASCII-Minus (-)", () => {
    expect(DE_1_6.parse("2+")).toBe(12);
    expect(DE_1_6.parse("2-")).toBe(10);
    expect(DE_1_6.parse("2−")).toBe(10);
    expect(DE_1_6.parse("1−")).toBe(13);
  });
  it("formatNote(z) läuft für alle Presets verlustfrei durch parse zurück", () => {
    // Preset-Buttons setzen formatNote(z); das Feld muss z wieder herstellen.
    for (const sys of [DE_0_15, DE_1_6]) {
      for (let z = 0; z <= 15; z++) {
        expect(sys.parse(sys.formatNote(z))).toBe(z);
      }
    }
  });
});

describe("DE_1_6 — EXAKTE Umrechnung Punkte <-> Note (KMK)", () => {
  it("formatNote: Punkte -> Note", () => {
    expect(DE_1_6.formatNote(15)).toBe("1+");
    expect(DE_1_6.formatNote(14)).toBe("1");
    expect(DE_1_6.formatNote(13)).toBe("1−");
    expect(DE_1_6.formatNote(12)).toBe("2+");
    expect(DE_1_6.formatNote(0)).toBe("6");
  });
  it("parse: Note -> Punkte", () => {
    expect(DE_1_6.parse("1")).toBe(14);
    expect(DE_1_6.parse("2+")).toBe(12);
    expect(DE_1_6.parse("6")).toBe(0);
    expect(DE_1_6.parse("7")).toBeNull();
  });
  it("Roundtrip Punkte -> Note -> Punkte ist verlustfrei (exakt!)", () => {
    for (let p = 0; p <= 15; p++) {
      expect(DE_1_6.parse(DE_1_6.formatNote(p))).toBe(p);
    }
  });
  it("exakt = true", () => {
    expect(DE_1_6.exakt).toBe(true);
  });
});

describe("CH_1_6 — Näherung", () => {
  it("Endpunkte: 15 Punkte -> beste, 0 -> schlechteste", () => {
    expect(CH_1_6.formatNote(15)).toBe("6,00");
    expect(CH_1_6.formatNote(0)).toBe("1,00");
  });
  it("parse: CH-Note -> Punkte", () => {
    expect(CH_1_6.parse("6")).toBe(15);
    expect(CH_1_6.parse("1")).toBe(0);
    expect(CH_1_6.parse("0,5")).toBeNull();
    expect(CH_1_6.parse("6,5")).toBeNull();
  });
  it("exakt = false (Näherung)", () => {
    expect(CH_1_6.exakt).toBe(false);
  });
});

describe("AT_1_5 — Näherung, 1 = beste", () => {
  it("Endpunkte invertiert", () => {
    expect(AT_1_5.formatNote(15)).toBe("1");
    expect(AT_1_5.formatNote(0)).toBe("5");
  });
  it("parse 1-5 -> Punkte", () => {
    expect(AT_1_5.parse("1")).toBe(15);
    expect(AT_1_5.parse("5")).toBe(0);
    expect(AT_1_5.parse("0")).toBeNull();
    expect(AT_1_5.parse("6")).toBeNull();
  });
  it("exakt = false", () => {
    expect(AT_1_5.exakt).toBe(false);
  });
});

describe("IB_1_7 — Näherung", () => {
  it("Endpunkte: 15 -> 7, 0 -> 1", () => {
    expect(IB_1_7.formatNote(15)).toBe("7");
    expect(IB_1_7.formatNote(0)).toBe("1");
  });
  it("parse 1-7 -> Punkte", () => {
    expect(IB_1_7.parse("7")).toBe(15);
    expect(IB_1_7.parse("1")).toBe(0);
    expect(IB_1_7.parse("0")).toBeNull();
    expect(IB_1_7.parse("8")).toBeNull();
  });
  it("exakt = false", () => {
    expect(IB_1_7.exakt).toBe(false);
  });
});
