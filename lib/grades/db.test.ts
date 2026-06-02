import { describe, it, expect } from "vitest";
import { assembleFaecher, type FachRow, type NoteRow } from "./db";

const fachRows: FachRow[] = [
  {
    id: "f1", user_id: "u", name: "Mathe", farbe: null, niveau: "erhoeht",
    halbjahr: "2025/26-2", fach_gewicht: 2, gewicht_klausur: 0.6,
    gewicht_muendlich: 0.4, gewicht_sonstige: 0, created_at: "",
  },
];
const noteRows: NoteRow[] = [
  { id: "n1", user_id: "u", fach_id: "f1", punkte: 11, kategorie: "klausur",
    gewicht: 1, bezeichnung: null, datum: null, created_at: "" },
  { id: "n2", user_id: "u", fach_id: "f1", punkte: 12, kategorie: "muendlich",
    gewicht: 1, bezeichnung: null, datum: "2026-05-01", created_at: "" },
];

describe("assembleFaecher", () => {
  it("baut Fach mit gemappter Gewichtung und Noten", () => {
    const faecher = assembleFaecher(fachRows, noteRows);
    expect(faecher).toHaveLength(1);
    const f = faecher[0];
    expect(f.id).toBe("f1");
    expect(f.name).toBe("Mathe");
    expect(f.fachGewicht).toBe(2);
    expect(f.gewichtung).toEqual({ klausur: 0.6, muendlich: 0.4, sonstige: 0 });
    expect(f.noten).toHaveLength(2);
    expect(f.noten[0]).toMatchObject({ id: "n1", punkte: 11, kategorie: "klausur" });
    expect(f.noten[1].datum).toBe("2026-05-01");
  });
  it("ordnet einem Fach ohne Noten ein leeres Array zu", () => {
    const faecher = assembleFaecher(fachRows, []);
    expect(faecher[0].noten).toEqual([]);
  });
});
