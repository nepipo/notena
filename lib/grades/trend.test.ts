import { describe, it, expect } from "vitest";
import type { FachRow, NoteRow } from "./db";
import { berechneTrend, berechnePrognose, type TrendPunkt } from "./trend";

function fach(id: string, name = id, extra: Partial<FachRow> = {}): FachRow {
  return {
    id, user_id: "u", name, farbe: "#1da1ff", niveau: "grund",
    halbjahr: "2025/26-2", fach_gewicht: 1, gewicht_klausur: 0.5,
    gewicht_muendlich: 0.5, gewicht_sonstige: 0, gewichtung_config: null,
    ausgeschlossen: false, created_at: "", parent_fach_id: null,
    subfach_gewicht: null, ...extra,
  };
}
function note(fachId: string, punkte: number, datum: string, id = crypto.randomUUID()): NoteRow {
  return {
    id, user_id: "u", fach_id: fachId, punkte, kategorie: "klausur",
    gewicht: 1, bezeichnung: null, datum, created_at: "2026-01-01",
  };
}

describe("berechneTrend", () => {
  it("liefert leeren Trend ohne Noten", () => {
    const t = berechneTrend([fach("f1")], []);
    expect(t.gesamt).toEqual([]);
    expect(t.proFach).toEqual([]);
    expect(t.prognose).toBeNull();
  });

  it("baut einen kumulativen Punkt je Datum, sortiert", () => {
    const rows = [
      note("f1", 8, "2026-03-01"),
      note("f1", 12, "2026-02-01"), // absichtlich unsortiert
    ];
    const t = berechneTrend([fach("f1")], rows);
    expect(t.gesamt.map((p) => p.datum)).toEqual(["2026-02-01", "2026-03-01"]);
    // erster Punkt = nur die 12er-Note, zweiter = Schnitt aus 12 und 8
    expect(t.gesamt[0].schnitt).toBe(12);
    expect(t.gesamt[1].schnitt).toBe(10);
  });

  it("nutzt created_at als Datum, wenn datum fehlt", () => {
    const rows: NoteRow[] = [
      { ...note("f1", 10, "2026-04-04"), datum: null, created_at: "2026-04-04T09:00:00Z" },
    ];
    const t = berechneTrend([fach("f1")], rows);
    expect(t.gesamt[0].datum).toBe("2026-04-04");
  });

  it("legt je Fach eine eigene Serie an", () => {
    const rows = [note("f1", 10, "2026-02-01"), note("f2", 6, "2026-02-01")];
    const t = berechneTrend([fach("f1", "Mathe"), fach("f2", "Deutsch")], rows);
    expect(t.proFach.map((s) => s.name).sort()).toEqual(["Deutsch", "Mathe"]);
  });

  it("schließt ausgeschlossene Fächer aus dem Gesamtschnitt aus", () => {
    const rows = [note("f1", 15, "2026-02-01"), note("f2", 3, "2026-02-01")];
    const t = berechneTrend(
      [fach("f1"), fach("f2", "f2", { ausgeschlossen: true })],
      rows,
    );
    expect(t.gesamt[0].schnitt).toBe(15); // f2 zählt nicht mit
  });
});

describe("berechnePrognose", () => {
  it("null bei zu wenigen Punkten", () => {
    const pkt: TrendPunkt[] = [
      { datum: "2026-01-01", schnitt: 8 },
      { datum: "2026-02-01", schnitt: 9 },
    ];
    expect(berechnePrognose(pkt)).toBeNull();
  });

  it("erkennt einen steigenden Trend und schreibt fort", () => {
    const pkt: TrendPunkt[] = [
      { datum: "2026-01-01", schnitt: 8 },
      { datum: "2026-01-11", schnitt: 9 },
      { datum: "2026-01-21", schnitt: 10 },
      { datum: "2026-01-31", schnitt: 11 },
    ];
    const p = berechnePrognose(pkt)!;
    expect(p).not.toBeNull();
    expect(p.proMonat).toBeGreaterThan(0); // steigt
    expect(p.schnitt).toBeGreaterThan(11); // über dem letzten Wert
    expect(p.schnitt).toBeLessThanOrEqual(15); // auf Systembereich geklemmt
  });

  it("klemmt die Prognose auf den gültigen Bereich (kein >15)", () => {
    const pkt: TrendPunkt[] = [
      { datum: "2026-01-01", schnitt: 13 },
      { datum: "2026-01-11", schnitt: 14 },
      { datum: "2026-01-21", schnitt: 15 },
      { datum: "2026-01-31", schnitt: 15 },
    ];
    const p = berechnePrognose(pkt)!;
    expect(p.schnitt).toBeLessThanOrEqual(15);
  });
});
