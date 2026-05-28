/**
 * Datenmodell für den Notenrechner (deutsche Oberstufe, 0–15-Punkte-System).
 * Reine Typen — keine Logik, kein React, keine DB.
 */

/** Kategorie einer Leistung. In Hamburg typ. Klausur vs. laufende Mitarbeit. */
export type Kategorie = "klausur" | "muendlich" | "sonstige";

/** Eine einzelne Note/Leistung. */
export interface Note {
  id?: string;
  /** Punktwert 0–15 (15 = sehr gut+, 0 = ungenügend). */
  punkte: number;
  kategorie: Kategorie;
  /** ISO-Datum, optional (für Sortierung/Verlauf). */
  datum?: string;
  /** Einzelgewicht innerhalb der Kategorie (z.B. doppelt zählende Klausur). Default 1. */
  gewicht?: number;
}

/** Gewichtung der Kategorien für den Fach-Schnitt (Summe muss nicht 1 ergeben — wird normalisiert). */
export interface Kategoriegewichtung {
  klausur: number;
  muendlich: number;
  sonstige: number;
}

/** Ein Fach mit seinen Noten und seiner Gewichtungs-Konfiguration. */
export interface Fach {
  id: string;
  name: string;
  noten: Note[];
  /** Kategoriegewichtung; fehlende Werte fallen auf den Default (50/50 Klausur/Mündlich). */
  gewichtung?: Partial<Kategoriegewichtung>;
  /** Gewicht des Fachs im Gesamtschnitt (z.B. erhöhtes Niveau höher). Default 1. */
  fachGewicht?: number;
}

/** Standard-Gewichtung, wenn ein Fach nichts anderes konfiguriert: 50 % Klausur, 50 % mündlich. */
export const DEFAULT_GEWICHTUNG: Kategoriegewichtung = {
  klausur: 0.5,
  muendlich: 0.5,
  sonstige: 0,
};
