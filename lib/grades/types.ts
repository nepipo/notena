/**
 * Datenmodell für den Notenrechner (deutsche Oberstufe, 0–15-Punkte-System).
 * Reine Typen — keine Logik, kein React, keine DB.
 */

export type Kategorie =
  | "klausur"
  | "muendlich"
  | "test"
  | "referat"
  | "hausaufgabe"
  | "sonstige";

export interface Note {
  id?: string;
  punkte: number;
  kategorie: Kategorie;
  datum?: string;
  /** Einzelgewicht innerhalb der Kategorie (z.B. 2 für doppelt zählende Klausur). Default 1. */
  gewicht?: number;
  bezeichnung?: string;
}

/**
 * Vollständige Gewichtungskonfiguration eines Fachs.
 * Alle 6 Kategorien haben eigene Anteile (0–1).
 * Kategorien ohne Noten werden ignoriert und die verbleibenden renormalisiert.
 */
export interface GewichtungConfig {
  klausur: number;
  test: number;
  muendlich: number;
  referat: number;
  hausaufgabe: number;
  sonstige: number;
  /** Wenn true: jede Klausur zählt klausurPro, max klausurMax Klausuren. */
  klausurDynamisch: boolean;
  /** Anteil pro Klausur im dynamischen Modus (z.B. 0.2 = 20%). */
  klausurPro: number;
  /** Maximale Anzahl Klausuren die zählen (cap für dynamischen Modus). */
  klausurMax: number;
}

export const DEFAULT_GEWICHTUNG_CONFIG: GewichtungConfig = {
  klausur: 0.5,
  test: 0,
  muendlich: 0.5,
  referat: 0,
  hausaufgabe: 0,
  sonstige: 0,
  klausurDynamisch: false,
  klausurPro: 0.2,
  klausurMax: 2,
};

/** Ein Fach mit seinen Noten und seiner Gewichtungs-Konfiguration. */
export interface Fach {
  id: string;
  name: string;
  noten: Note[];
  gewichtungConfig?: GewichtungConfig;
  /** Gewicht des Fachs im Gesamtschnitt (LK = 2, GK = 1). Default 1. */
  fachGewicht?: number;
  farbe?: string | null;
  niveau?: string;
  ausgeschlossen?: boolean;
}

/** @deprecated Nur noch für Backward-Compat. Benutze GewichtungConfig. */
export interface Kategoriegewichtung {
  klausur: number;
  muendlich: number;
  sonstige: number;
}
