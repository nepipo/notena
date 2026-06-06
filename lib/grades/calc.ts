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

const ALLE_KATEGORIEN: Kategorie[] = [
  "klausur", "test", "muendlich", "referat", "hausaufgabe", "sonstige",
];

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
 * Fach-Schnitt mit vollständiger Gewichtungskonfiguration.
 * - Jede Kategorie hat ein eigenes Gewicht.
 * - Kategorien ohne Noten werden ignoriert und die Gewichte renormalisiert.
 * - Klausur-Dynamik: wenn klausurDynamisch, wächst das Klausur-Gewicht mit
 *   jeder Klausur (klausurPro × Anzahl, gedeckelt bei klausurMax).
 */
export function fachSchnitt(noten: Note[], config?: GewichtungConfig): number | null {
  const c = resolveConfig(config);
  let summe = 0;
  let gewSum = 0;

  for (const kat of ALLE_KATEGORIEN) {
    const katNoten = noten.filter((n) => n.kategorie === kat);
    if (katNoten.length === 0) continue;

    let katSumme = 0;
    let katGew = 0;
    for (const n of katNoten) {
      const g = n.gewicht ?? 1;
      katSumme += clampPunkte(n.punkte) * g;
      katGew += g;
    }
    if (katGew === 0) continue;

    const katSchnitt = katSumme / katGew;

    let effGew: number;
    if (kat === "klausur" && c.klausurDynamisch) {
      effGew = Math.min(katNoten.length, c.klausurMax) * c.klausurPro;
    } else {
      effGew = c[kat as keyof Pick<GewichtungConfig, Kategorie>] as number;
    }

    if (effGew <= 0) continue;
    summe += katSchnitt * effGew;
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
