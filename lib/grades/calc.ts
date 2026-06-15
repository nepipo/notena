/**
 * Notenrechner-Kernlogik. System-agnostisch: Bereich/Richtung kommen über das
 * Notensystem rein (default DE für Back-Compat).
 */

import {
  type Fach,
  type Kategorie,
  type GewichtungConfig,
  type Note,
  DEFAULT_GEWICHTUNG_CONFIG,
} from "./types";
import { DE_0_15, type Notensystem } from "./systems";

/** Begrenzt einen Wert auf den gültigen Bereich des Systems. */
export function clamp(wert: number, system: Notensystem = DE_0_15): number {
  if (Number.isNaN(wert)) return system.min;
  return Math.min(system.max, Math.max(system.min, wert));
}

/** @deprecated Nutze clamp(wert, system). Bleibt für Alt-Aufrufer. */
export function clampPunkte(punkte: number): number {
  return clamp(punkte, DE_0_15);
}

export function runde(wert: number, dezimal = 1): number {
  const f = 10 ** dezimal;
  return Math.round(wert * f) / f;
}

/** @deprecated Liefert die deutsche Note zu Punkten. Re-Export für Alt-Komponenten/Demo. */
export function punkteZuNote(punkte: number): string {
  return DE_0_15.punkteZuNote(punkte);
}

/** Ordnet eine Kategorie einer Gruppe zu (für die K/M-Anzeige). */
export function kategorieZurGruppe(k: Kategorie): "klausur" | "muendlich" {
  return k === "klausur" ? "klausur" : "muendlich";
}

/** Gewichteter Schnitt einer einzelnen Kategorie. Für Detailansichten. */
export function kategorieSchnitt(noten: Note[], kategorie: Kategorie, system: Notensystem = DE_0_15): number | null {
  const relevant = noten.filter((n) => n.kategorie === kategorie);
  if (relevant.length === 0) return null;
  let summe = 0;
  let gewSum = 0;
  for (const n of relevant) {
    const g = n.gewicht ?? 1;
    summe += clamp(n.punkte, system) * g;
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
export function fachSchnitt(noten: Note[], config?: GewichtungConfig, system: Notensystem = DE_0_15): number | null {
  if (noten.length === 0) return null;
  const c = resolveConfig(config);

  const gruppen: Record<"klausur" | "muendlich", { sum: number; gew: number }> = {
    klausur: { sum: 0, gew: 0 },
    muendlich: { sum: 0, gew: 0 },
  };

  for (const n of noten) {
    const gruppe = kategorieZurGruppe(n.kategorie);
    const g = n.gewicht ?? 1;
    gruppen[gruppe].sum += clamp(n.punkte, system) * g;
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

export function fachSchnittGerundet(noten: Note[], config?: GewichtungConfig, system: Notensystem = DE_0_15): number | null {
  const s = fachSchnitt(noten, config, system);
  return s === null ? null : runde(s);
}

export function gesamtSchnitt(faecher: Fach[], system: Notensystem = DE_0_15): number | null {
  let summe = 0;
  let gewSum = 0;
  for (const fach of faecher) {
    if (fach.ausgeschlossen) continue;
    const schnitt = fachSchnitt(fach.noten, fach.gewichtungConfig, system);
    if (schnitt === null) continue;
    const fg = fach.fachGewicht ?? 1;
    if (fg <= 0) continue;
    summe += schnitt * fg;
    gewSum += fg;
  }
  return gewSum > 0 ? summe / gewSum : null;
}

export function gesamtSchnittGerundet(faecher: Fach[], system: Notensystem = DE_0_15): number | null {
  const s = gesamtSchnitt(faecher, system);
  return s === null ? null : runde(s);
}

export function wasWaereWenn(
  noten: Note[],
  hypothese: Note,
  config?: GewichtungConfig,
  system: Notensystem = DE_0_15,
): number | null {
  return fachSchnitt([...noten, hypothese], config, system);
}

export function benoetigtePunkte(
  noten: Note[],
  config: GewichtungConfig | undefined,
  kategorie: Kategorie,
  gewicht: number,
  ziel: number,
  system: Notensystem = DE_0_15,
): number | "erreicht" | "unmoeglich" {
  const aktuell = fachSchnitt(noten, config, system);
  const zielErreicht = (s: number) =>
    system.richtung === "hoeher_besser" ? runde(s) >= ziel : runde(s) <= ziel;
  if (aktuell !== null && zielErreicht(aktuell)) return "erreicht";

  // Gültige Werte aufsteigend erzeugen.
  const werte: number[] = [];
  for (let v = system.min; v <= system.max + 1e-9; v += system.step) {
    werte.push(Math.round(v / system.step) * system.step);
  }
  // hoeher_besser: kleinste ausreichende Note zuerst -> aufsteigend durchsuchen.
  // niedriger_besser: größte noch ausreichende Note zuerst -> absteigend.
  const reihe = system.richtung === "hoeher_besser" ? werte : [...werte].reverse();
  for (const v of reihe) {
    const mitProbe = fachSchnitt([...noten, { punkte: v, kategorie, gewicht }], config, system);
    if (mitProbe !== null && zielErreicht(mitProbe)) return v;
  }
  return "unmoeglich";
}
