/**
 * Mapping zwischen Supabase-Rows und den reinen calc.ts-Typen.
 * Reine Funktionen, keine DB-Aufrufe — dadurch testbar.
 */
import type { Fach, GewichtungConfig, Kategorie, Note } from "./types";
import { DEFAULT_GEWICHTUNG_CONFIG } from "./types";

export interface FachRow {
  id: string;
  user_id: string;
  name: string;
  farbe: string | null;
  niveau: string;
  halbjahr: string | null;
  fach_gewicht: number;
  // Legacy-Spalten (bleiben erhalten für Backward-Compat)
  gewicht_klausur: number;
  gewicht_muendlich: number;
  gewicht_sonstige: number;
  // Neue vollständige Config (nullable — alt Rows haben null)
  gewichtung_config: GewichtungConfig | null;
  ausgeschlossen: boolean;
  parent_fach_id: string | null;
  subfach_gewicht: number | null;
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

export interface KlausurRow {
  id: string;
  user_id: string;
  fach_id: string | null;
  titel: string;
  datum: string;
  vorbereitung_prozent: number;
  notiz: string | null;
  created_at: string;
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    punkte: row.punkte,
    kategorie: row.kategorie as Kategorie,
    gewicht: row.gewicht,
    datum: row.datum ?? undefined,
    bezeichnung: row.bezeichnung ?? undefined,
  };
}

function mapGewichtungConfig(row: FachRow): GewichtungConfig {
  if (row.gewichtung_config) {
    return { ...DEFAULT_GEWICHTUNG_CONFIG, ...row.gewichtung_config };
  }
  // Alte Rows: aus Legacy-Spalten rekonstruieren
  return {
    ...DEFAULT_GEWICHTUNG_CONFIG,
    klausur: row.gewicht_klausur,
    muendlich: row.gewicht_muendlich,
    sonstige: row.gewicht_sonstige,
  };
}

export function assembleFaecher(fachRows: FachRow[], noteRows: NoteRow[]): Fach[] {
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
    gewichtungConfig: mapGewichtungConfig(f),
    fachGewicht: f.fach_gewicht,
    farbe: f.farbe,
    niveau: f.niveau,
    ausgeschlossen: f.ausgeschlossen,
    parentFachId: f.parent_fach_id,
    subfachGewicht: f.subfach_gewicht,
  }));
}

export function assembleKlausuren(rows: KlausurRow[]): Map<string, KlausurRow> {
  const map = new Map<string, KlausurRow>();
  for (const k of rows) {
    if (k.fach_id && !map.has(k.fach_id)) {
      map.set(k.fach_id, k);
    }
  }
  return map;
}
