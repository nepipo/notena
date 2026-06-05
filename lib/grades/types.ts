/**
 * Datenmodell für den Notenrechner (deutsche Oberstufe, 0–15-Punkte-System).
 * Reine Typen — keine Logik, kein React, keine DB.
 */

/**
 * Kategorie einer Leistung.
 * Gruppen: klausur = schriftlich, alle anderen = mündlich.
 */
export type Kategorie =
  | "klausur"
  | "muendlich"
  | "test"
  | "referat"
  | "hausaufgabe"
  | "sonstige";

/** Eine einzelne Note/Leistung. */
export interface Note {
  id?: string;
  /** Punktwert 0–15 (15 = sehr gut+, 0 = ungenügend). */
  punkte: number;
  kategorie: Kategorie;
  /** ISO-Datum, optional (für Sortierung/Verlauf). */
  datum?: string;
  /** Einzelgewicht innerhalb der Gruppe (z.B. 2 für doppelt zählende Klausur). Default 1. */
  gewicht?: number;
  /** Freitext-Bezeichnung (z.B. "1. Klausur", "Referat Klimawandel"). */
  bezeichnung?: string;
}

/** Gewichtung der zwei Gruppen für den Fach-Schnitt (wird normalisiert). */
export interface Kategoriegewichtung {
  klausur: number;
  muendlich: number;
  /** @deprecated Nicht mehr verwendet. Alle Nicht-Klausur-Kategorien zählen zur muendlich-Gruppe. */
  sonstige: number;
}

/** Ein Fach mit seinen Noten und seiner Gewichtungs-Konfiguration. */
export interface Fach {
  id: string;
  name: string;
  noten: Note[];
  /** Kategoriegewichtung; fehlende Werte fallen auf den Default (50/50). */
  gewichtung?: Partial<Kategoriegewichtung>;
  /** Gewicht des Fachs im Gesamtschnitt (LK = 2, GK = 1). Default 1. */
  fachGewicht?: number;
  /** Hex-Farbe für UI-Akzent. */
  farbe?: string | null;
  /** 'grund' = GK, 'erhoeht' = LK. */
  niveau?: string;
  /** Fach wird angezeigt, aber nicht in den Gesamtschnitt einberechnet. */
  ausgeschlossen?: boolean;
}

/** Standard-Gewichtung: 50% Klausur, 50% mündlich. */
export const DEFAULT_GEWICHTUNG: Kategoriegewichtung = {
  klausur: 0.5,
  muendlich: 0.5,
  sonstige: 0,
};
