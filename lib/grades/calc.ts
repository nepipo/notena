/**
 * Notenrechner-Kernlogik (0–15-Punkte-System, deutsche Oberstufe).
 * Reine Funktionen, vollständig ohne Seiteneffekte.
 */

import {
  type Fach,
  type Kategorie,
  type GewichtungConfig,
  type Note,
  DEFAULT_GEWICHTUNG_CONFIG,
} from "./types";


export function clampPunkte(punkte: number): number {
  if (Number.isNaN(punkte)) return 0;
  return Math.min(15, Math.max(0, punkte));
}

export function runde(wert: number, dezimal = 1): number {
  const f = 10 ** dezimal;
  return Math.round(wert * f) / f;
}

export function punkteZuNote(punkte: number): string {
  const p = Math.round(clampPunkte(punkte));
  if (p === 0) return "6";
  const grundnote = 6 - Math.ceil(p / 3);
  const rest = (p - 1) % 3;
  const tendenz = rest === 2 ? "+" : rest === 0 ? "−" : "";
  return `${grundnote}${tendenz}`;
}

/** Ordnet eine Kategorie einer Gruppe zu (für die K/M-Anzeige). */
export function kategorieZurGruppe(k: Kategorie): "klausur" | "muendlich" {
  return k === "klausur" ? "klausur" : "muendlich";
}

/** Gewichteter Schnitt einer einzelnen Kategorie. Für Detailansichten. */
export function kategorieSchnitt(noten: Note[], kategorie: Kategorie): number | null {
  const relevant = noten.filter((n) => n.kategorie === kategorie);
  if (relevant.length === 0) return null;
  let summe = 0;
  let gewSum = 0;
  for (const n of relevant) {
    const g = n.gewicht ?? 1;
    summe += clampPunkte(n.punkte) * g;
    gewSum += g;
  }
  return gewSum > 0 ? summe / gewSum : null;
}

function resolveConfig(config?: GewichtungConfig): GewichtungConfig {
  return config ? { ...DEFAULT_GEWICHTUNG_CONFIG, ...config } : DEFAULT_GEWICHTUNG_CONFIG;
}

/**
 * Fach-Schnitt: Alle Kategorien werden via kategorieZurGruppe in "klausur"
 * oder "muendlich" eingruppiert, dann mit den Gruppengewichten aus config
 * kombiniert. Fehlende Gruppen werden renormalisiert.
 * Klausur-Dynamik: wächst klausurDynamisch, wächst das Klausur-Gewicht mit
 * jeder Klausur (klausurPro × Anzahl, gedeckelt bei klausurMax).
 */
export function fachSchnitt(noten: Note[], config?: GewichtungConfig): number | null {
  if (noten.length === 0) return null;
  const c = resolveConfig(config);

  const gruppen: Record<"klausur" | "muendlich", { sum: number; gew: number }> = {
    klausur: { sum: 0, gew: 0 },
    muendlich: { sum: 0, gew: 0 },
  };

  for (const n of noten) {
    const gruppe = kategorieZurGruppe(n.kategorie);
    const g = n.gewicht ?? 1;
    gruppen[gruppe].sum += clampPunkte(n.punkte) * g;
    gruppen[gruppe].gew += g;
  }

  let summe = 0;
  let gewSum = 0;

  for (const gruppe of ["klausur", "muendlich"] as const) {
    const { sum, gew } = gruppen[gruppe];
    if (gew === 0) continue;
    const schnitt = sum / gew;

    let effGew: number;
    if (gruppe === "klausur" && c.klausurDynamisch) {
      const anzahl = noten.filter((n) => n.kategorie === "klausur").length;
      effGew = Math.min(anzahl, c.klausurMax) * c.klausurPro;
    } else {
      effGew = c[gruppe];
    }

    if (effGew <= 0) continue;
    summe += schnitt * effGew;
    gewSum += effGew;
  }

  return gewSum > 0 ? summe / gewSum : null;
}

export function fachSchnittGerundet(noten: Note[], config?: GewichtungConfig): number | null {
  const s = fachSchnitt(noten, config);
  return s === null ? null : runde(s);
}

export function gesamtSchnitt(faecher: Fach[]): number | null {
  let summe = 0;
  let gewSum = 0;
  for (const fach of faecher) {
    if (fach.ausgeschlossen) continue;
    const schnitt = fachSchnitt(fach.noten, fach.gewichtungConfig);
    if (schnitt === null) continue;
    const fg = fach.fachGewicht ?? 1;
    if (fg <= 0) continue;
    summe += schnitt * fg;
    gewSum += fg;
  }
  return gewSum > 0 ? summe / gewSum : null;
}

export function gesamtSchnittGerundet(faecher: Fach[]): number | null {
  const s = gesamtSchnitt(faecher);
  return s === null ? null : runde(s);
}

export function wasWaereWenn(
  noten: Note[],
  hypothese: Note,
  config?: GewichtungConfig,
): number | null {
  return fachSchnitt([...noten, hypothese], config);
}

export function benoetigtePunkte(
  noten: Note[],
  config: GewichtungConfig | undefined,
  kategorie: Kategorie,
  gewicht: number,
  ziel: number,
): number | "erreicht" | "unmoeglich" {
  const aktuell = fachSchnitt(noten, config);
  if (aktuell !== null && runde(aktuell) >= ziel) return "erreicht";

  for (let p = 0; p <= 15; p++) {
    const mitProbe = fachSchnitt(
      [...noten, { punkte: p, kategorie, gewicht }],
      config,
    );
    if (mitProbe !== null && runde(mitProbe) >= ziel) return p;
  }
  return "unmoeglich";
}
