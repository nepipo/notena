/**
 * Notenrechner-Kernlogik (0–15-Punkte-System, deutsche Oberstufe).
 *
 * Reine Funktionen, vollständig ohne Seiteneffekte — leicht testbar.
 * Regeln:
 *  - Innerhalb einer Kategorie: gewichteter Durchschnitt der Einzelnoten.
 *  - Fach-Schnitt: gewichtete Kombination der Kategorien. Kategorien OHNE Noten
 *    werden ignoriert und die Gewichte der verbleibenden Kategorien renormalisiert.
 *  - Gesamt-Schnitt: über die Fächer, gewichtet mit `fachGewicht`.
 */

import {
  type Fach,
  type Kategorie,
  type Kategoriegewichtung,
  type Note,
  DEFAULT_GEWICHTUNG,
} from "./types";

const KATEGORIEN: Kategorie[] = ["klausur", "muendlich", "sonstige"];

/** Begrenzt einen Punktwert auf den gültigen Bereich 0–15. */
export function clampPunkte(punkte: number): number {
  if (Number.isNaN(punkte)) return 0;
  return Math.min(15, Math.max(0, punkte));
}

/** Rundet einen Wert auf n Dezimalstellen (Standard: 1, wie im UI „10,2"). */
export function runde(wert: number, dezimal = 1): number {
  const f = 10 ** dezimal;
  return Math.round(wert * f) / f;
}

/**
 * Wandelt Punkte (0–15) in die klassische Notendarstellung um (z.B. 13 → "1−").
 * Nutzt das offizielle Mapping der gymnasialen Oberstufe.
 */
export function punkteZuNote(punkte: number): string {
  const p = Math.round(clampPunkte(punkte));
  if (p === 0) return "6";
  // Grundnote 1–5: je 3 Punkte eine Notenstufe (13–15→1, 10–12→2, …, 1–3→5).
  const grundnote = 6 - Math.ceil(p / 3);
  // Tendenz innerhalb der 3er-Gruppe: höchster Punktwert "+", mittlerer "", niedrigster "−".
  const rest = (p - 1) % 3; // 0 = "−", 1 = "", 2 = "+"
  const tendenz = rest === 2 ? "+" : rest === 0 ? "−" : "";
  return `${grundnote}${tendenz}`;
}

/**
 * Gewichteter Durchschnitt der Noten EINER Kategorie.
 * @returns Schnitt (0–15) oder null, wenn keine Noten in der Kategorie.
 */
export function kategorieSchnitt(
  noten: Note[],
  kategorie: Kategorie,
): number | null {
  const relevant = noten.filter((n) => n.kategorie === kategorie);
  if (relevant.length === 0) return null;

  let summe = 0;
  let gewichtSumme = 0;
  for (const n of relevant) {
    const g = n.gewicht ?? 1;
    summe += clampPunkte(n.punkte) * g;
    gewichtSumme += g;
  }
  if (gewichtSumme === 0) return null;
  return summe / gewichtSumme;
}

/** Führt die konfigurierte Gewichtung mit dem Default zusammen. */
function aufloesenGewichtung(
  gewichtung?: Partial<Kategoriegewichtung>,
): Kategoriegewichtung {
  return { ...DEFAULT_GEWICHTUNG, ...gewichtung };
}

/**
 * Schnitt eines Fachs: gewichtete Kombination der Kategorien.
 * Kategorien ohne Noten werden ignoriert, die übrigen Gewichte renormalisiert.
 * @returns Schnitt (0–15) oder null, wenn das Fach keine Noten hat.
 */
export function fachSchnitt(
  noten: Note[],
  gewichtung?: Partial<Kategoriegewichtung>,
): number | null {
  const g = aufloesenGewichtung(gewichtung);

  let summe = 0;
  let gewichtSumme = 0;
  for (const kat of KATEGORIEN) {
    const schnitt = kategorieSchnitt(noten, kat);
    if (schnitt === null) continue;
    const katGewicht = g[kat];
    if (katGewicht <= 0) continue;
    summe += schnitt * katGewicht;
    gewichtSumme += katGewicht;
  }

  if (gewichtSumme === 0) return null;
  return summe / gewichtSumme;
}

/** Wie `fachSchnitt`, aber gerundet auf 1 Dezimalstelle (für die Anzeige). */
export function fachSchnittGerundet(
  noten: Note[],
  gewichtung?: Partial<Kategoriegewichtung>,
): number | null {
  const s = fachSchnitt(noten, gewichtung);
  return s === null ? null : runde(s);
}

/**
 * Gesamt-Schnitt über mehrere Fächer, gewichtet mit `fachGewicht`.
 * Fächer ohne Noten werden ignoriert.
 * @returns Schnitt (0–15) oder null, wenn kein Fach Noten hat.
 */
export function gesamtSchnitt(faecher: Fach[]): number | null {
  let summe = 0;
  let gewichtSumme = 0;
  for (const fach of faecher) {
    const schnitt = fachSchnitt(fach.noten, fach.gewichtung);
    if (schnitt === null) continue;
    const fg = fach.fachGewicht ?? 1;
    if (fg <= 0) continue;
    summe += schnitt * fg;
    gewichtSumme += fg;
  }
  if (gewichtSumme === 0) return null;
  return summe / gewichtSumme;
}

/** Gesamt-Schnitt gerundet auf 1 Dezimalstelle. */
export function gesamtSchnittGerundet(faecher: Fach[]): number | null {
  const s = gesamtSchnitt(faecher);
  return s === null ? null : runde(s);
}

/**
 * „Was-wäre-wenn": Fach-Schnitt, wenn eine hypothetische Note hinzukäme.
 * Verändert die Eingabedaten nicht.
 */
export function wasWaereWenn(
  noten: Note[],
  hypothese: Note,
  gewichtung?: Partial<Kategoriegewichtung>,
): number | null {
  return fachSchnitt([...noten, hypothese], gewichtung);
}
