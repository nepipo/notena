import { describe, it, expect } from "vitest";
import {
  assembleFaecher,
  assembleKlausuren,
  type FachRow,
  type NoteRow,
  type KlausurRow,
} from "./db";

const fachRows: FachRow[] = [
  {
    id: "f1", user_id: "u", name: "Mathe", farbe: "#1da1ff", niveau: "erhoeht",
    halbjahr: "2025/26-2", fach_gewicht: 2, gewicht_klausur: 0.6,
    gewicht_muendlich: 0.4, gewicht_sonstige: 0, gewichtung_config: null,
    ausgeschlossen: false, created_at: "", parent_fach_id: null, subfach_gewicht: null,
  },
];
const noteRows: NoteRow[] = [
  {
    id: "n1", user_id: "u", fach_id: "f1", punkte: 11, kategorie: "klausur",
    gewicht: 1.5, bezeichnung: "1. Klausur", datum: null, created_at: "",
  },
  {
    id: "n2", user_id: "u", fach_id: "f1", punkte: 8, kategorie: "test",
    gewicht: 1, bezeichnung: null, datum: "2026-05-01", created_at: "",
  },
];

describe("assembleFaecher", () => {
  it("mappt farbe und niveau", () => {
    const faecher = assembleFaecher(fachRows, noteRows);
    expect(faecher[0].farbe).toBe("#1da1ff");
    expect(faecher[0].niveau).toBe("erhoeht");
  });
  it("mappt bezeichnung und gewicht auf Noten", () => {
    const faecher = assembleFaecher(fachRows, noteRows);
    const n = faecher[0].noten[0];
    expect(n.bezeichnung).toBe("1. Klausur");
    expect(n.gewicht).toBe(1.5);
  });
  it("akzeptiert neue Kategorien (test)", () => {
    const faecher = assembleFaecher(fachRows, noteRows);
    expect(faecher[0].noten[1].kategorie).toBe("test");
  });
});

describe("assembleKlausuren", () => {
  const klausurRows: KlausurRow[] = [
    {
      id: "k1", user_id: "u", fach_id: "f1", titel: "Mathe-Klausur",
      datum: "2026-06-15T08:00:00+00:00", vorbereitung_prozent: 30,
      notiz: null, created_at: "",
    },
  ];
  it("gibt Map fach_id -> naechste Klausur zurück", () => {
    const map = assembleKlausuren(klausurRows);
    expect(map.get("f1")?.titel).toBe("Mathe-Klausur");
  });
  it("gibt leere Map zurück bei leerer Liste", () => {
    expect(assembleKlausuren([]).size).toBe(0);
  });
});
