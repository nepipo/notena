/**
 * Mapping zwischen Supabase-Rows und den reinen calc.ts-Typen.
 * Reine Funktionen, keine DB-Aufrufe — dadurch testbar.
 */
import type { Fach, Kategorie, Note } from "./types";

export interface FachRow {
  id: string;
  user_id: string;
  name: string;
  farbe: string | null;
  niveau: string;
  halbjahr: string | null;
  fach_gewicht: number;
  gewicht_klausur: number;
  gewicht_muendlich: number;
  gewicht_sonstige: number;
  created_at: string;
}

export interface NoteRow {
  id: string;
  user_id: string;
  fach_id: string;
  punkte: number;
  kategorie: string;
  gewicht: number;
  bezeichnung: string | null;
  datum: string | null;
  created_at: string;
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    punkte: row.punkte,
    kategorie: row.kategorie as Kategorie,
    gewicht: row.gewicht,
    datum: row.datum ?? undefined,
  };
}

/** Gruppiert Noten nach Fach und baut die calc-Fach-Objekte. */
export function assembleFaecher(
  fachRows: FachRow[],
  noteRows: NoteRow[],
): Fach[] {
  const notenProFach = new Map<string, Note[]>();
  for (const n of noteRows) {
    const list = notenProFach.get(n.fach_id) ?? [];
    list.push(mapNote(n));
    notenProFach.set(n.fach_id, list);
  }
  return fachRows.map((f) => ({
    id: f.id,
    name: f.name,
    noten: notenProFach.get(f.id) ?? [],
    gewichtung: {
      klausur: f.gewicht_klausur,
      muendlich: f.gewicht_muendlich,
      sonstige: f.gewicht_sonstige,
    },
    fachGewicht: f.fach_gewicht,
  }));
}
