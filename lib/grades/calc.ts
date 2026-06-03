/**
 * Notenrechner-Kernlogik (0–15-Punkte-System, deutsche Oberstufe).
 *
 * Reine Funktionen, vollständig ohne Seiteneffekte — leicht testbar.
 * Regeln:
 *  - Alle Kategorien außer 'klausur' zählen zur muendlich-Gruppe.
 *  - Innerhalb einer Gruppe: gewichteter Durchschnitt (Note.gewicht).
 *  - Fach-Schnitt: gewichtete Kombination der zwei Gruppen. Gruppen OHNE Noten
 *    werden ignoriert und die Gewichte der verbleibenden renormalisiert.
 *  - Gesamt-Schnitt: über die Fächer, gewichtet mit fachGewicht.
 */

import {
  type Fach,
  type Kategorie,
  type Kategoriegewichtung,
  type Note,
  DEFAULT_GEWICHTUNG,
} from "./types";

/** Begrenzt einen Punktwert auf den gültigen Bereich 0–15. */
export function clampPunkte(punkte: number): number {
  if (Number.isNaN(punkte)) return 0;
  return Math.min(15, Math.max(0, punkte));
}

/** Rundet einen Wert auf n Dezimalstellen (Standard: 1). */
export function runde(wert: number, dezimal = 1): number {
  const f = 10 ** dezimal;
  return Math.round(wert * f) / f;
}

/**
 * Wandelt Punkte (0–15) in die klassische Notendarstellung um (z.B. 13 → "1−").
 */
export function punkteZuNote(punkte: number): string {
  const p = Math.round(clampPunkte(punkte));
  if (p === 0) return "6";
  const grundnote = 6 - Math.ceil(p / 3);
  const rest = (p - 1) % 3;
  const tendenz = rest === 2 ? "+" : rest === 0 ? "−" : "";
  return `${grundnote}${tendenz}`;
}

/**
 * Ordnet eine Kategorie einer der zwei Gruppen zu.
 * Nur 'klausur' ist schriftlich — alles andere ist mündlich.
 */
export function kategorieZurGruppe(k: Kategorie): "klausur" | "muendlich" {
  return k === "klausur" ? "klausur" : "muendlich";
}

/**
 * Gewichteter Durchschnitt der Noten EINER exakten Kategorie.
 * Wird für Detailansichten verwendet; fachSchnitt nutzt Gruppen.
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
 * Schnitt eines Fachs über zwei Gruppen (klausur / muendlich).
 * Alle Noten werden per kategorieZurGruppe einer Gruppe zugeordnet.
 * Gruppen ohne Noten werden ignoriert, die übrigen Gewichte renormalisiert.
 */
export function fachSchnitt(
  noten: Note[],
  gewichtung?: Partial<Kategoriegewichtung>,
): number | null {
  const g = aufloesenGewichtung(gewichtung);
  const gruppen = ["klausur", "muendlich"] as const;

  let summe = 0;
  let gewichtSumme = 0;

  for (const gruppe of gruppen) {
    const gruppenNoten = noten.filter(
      (n) => kategorieZurGruppe(n.kategorie) === gruppe,
    );
    if (gruppenNoten.length === 0) continue;

    let gruppeSumme = 0;
    let gruppeGewicht = 0;
    for (const n of gruppenNoten) {
      const gew = n.gewicht ?? 1;
      gruppeSumme += clampPunkte(n.punkte) * gew;
      gruppeGewicht += gew;
    }
    if (gruppeGewicht === 0) continue;

    const gruppenSchnitt = gruppeSumme / gruppeGewicht;
    const katGewicht = g[gruppe];
    if (katGewicht <= 0) continue;

    summe += gruppenSchnitt * katGewicht;
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
 * Gesamt-Schnitt über mehrere Fächer, gewichtet mit fachGewicht.
 * Fächer ohne Noten werden ignoriert.
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
 */
export function wasWaereWenn(
  noten: Note[],
  hypothese: Note,
  gewichtung?: Partial<Kategoriegewichtung>,
): number | null {
  return fachSchnitt([...noten, hypothese], gewichtung);
}

/**
 * Zielnoten-Rechner: kleinste Punktzahl (0–15) für eine zusätzliche Note
 * (gegebene Kategorie + Gewicht), damit der gerundete Fach-Schnitt das Ziel erreicht.
 * @returns Punktzahl 0–15, "erreicht" (Ziel schon erfüllt) oder "unmoeglich" (auch 15 reicht nicht).
 */
export function benoetigtePunkte(
  noten: Note[],
  gewichtung: Partial<Kategoriegewichtung> | undefined,
  kategorie: Kategorie,
  gewicht: number,
  ziel: number,
): number | "erreicht" | "unmoeglich" {
  const aktuell = fachSchnitt(noten, gewichtung);
  if (aktuell !== null && runde(aktuell) >= ziel) return "erreicht";

  for (let p = 0; p <= 15; p++) {
    const mitProbe = fachSchnitt(
      [...noten, { punkte: p, kategorie, gewicht }],
      gewichtung,
    );
    if (mitProbe !== null && runde(mitProbe) >= ziel) return p;
  }
  return "unmoeglich";
}
