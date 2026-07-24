/**
 * Trend-Aggregation für den Verlaufs-Chart im Coach.
 * Reine Funktionen (keine DB) — nutzt die bestehende Schnitt-Logik aus calc.ts,
 * damit der Trend exakt denselben Schnitt zeigt wie /noten.
 *
 * Idee: Für jedes Noten-Datum den kumulativen Schnitt „mit allen Noten bis dahin"
 * berechnen. Ergibt den Verlauf des Gesamtschnitts und pro Fach.
 */
import { assembleFaecher, type FachRow, type NoteRow } from "./db";
import {
  gesamtSchnitt,
  fachSchnitt,
  fachSchnittMitUnterfaecher,
  runde,
  clamp,
} from "./calc";
import { DE_0_15, type Notensystem } from "./systems";
import type { Fach } from "./types";

export type TrendPunkt = { datum: string; schnitt: number };
export type TrendSerie = {
  fachId: string;
  name: string;
  farbe: string | null;
  punkte: TrendPunkt[];
};
/** Lineare Fortschreibung des Gesamtschnitts (Pro-Feature). */
export type Prognose = {
  /** Zieldatum der Prognose (Horizont). */
  datum: string;
  /** Prognostizierter Schnitt am Zieldatum (auf Systembereich geklemmt). */
  schnitt: number;
  /** Trend in Punkten pro 30 Tage (kann negativ sein). */
  proMonat: number;
};

const MS_PRO_TAG = 86_400_000;
/** Erst ab so vielen Datenpunkten ist eine Prognose halbwegs seriös. */
export const MIN_PROGNOSE_PUNKTE = 4;
/** Wie weit in die Zukunft die Prognose fortschreibt. */
const PROGNOSE_HORIZONT_TAGE = 30;

/** Effektives Datum einer Note: `datum`, sonst Fallback `created_at`. */
function effDatum(r: NoteRow): string {
  return (r.datum ?? r.created_at).slice(0, 10);
}

function tageZwischen(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / MS_PRO_TAG;
}

/** Schnitt eines Elternfachs inkl. seiner Unterfächer (wie in gesamtSchnitt). */
function fachSchnittMitKindern(
  fach: Fach,
  alle: Fach[],
  system: Notensystem,
): number | null {
  const kinder = alle.filter((f) => f.parentFachId === fach.id);
  return kinder.length > 0
    ? fachSchnittMitUnterfaecher(fach, kinder, system)
    : fachSchnitt(fach.noten, fach.gewichtungConfig, system);
}

/**
 * Lineare Regression auf den Gesamtschnitt-Verlauf → Fortschreibung um
 * PROGNOSE_HORIZONT_TAGE. Gibt null zurück, wenn zu wenig Daten oder alle
 * Punkte am selben Tag liegen (keine Steigung berechenbar).
 */
export function berechnePrognose(
  gesamt: TrendPunkt[],
  system: Notensystem = DE_0_15,
): Prognose | null {
  if (gesamt.length < MIN_PROGNOSE_PUNKTE) return null;

  const start = gesamt[0].datum;
  const xs = gesamt.map((p) => tageZwischen(start, p.datum));
  const ys = gesamt.map((p) => p.schnitt);
  const n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return null; // alle Noten am selben Tag

  const slope = num / den; // Punkte pro Tag
  const intercept = my - slope * mx;

  const zielX = xs[n - 1] + PROGNOSE_HORIZONT_TAGE;
  const rohSchnitt = intercept + slope * zielX;
  const schnitt = runde(clamp(rohSchnitt, system));
  const zielDatum = new Date(Date.parse(start) + zielX * MS_PRO_TAG)
    .toISOString()
    .slice(0, 10);

  return { datum: zielDatum, schnitt, proMonat: runde(slope * 30) };
}

/**
 * Baut den kompletten Trend: Gesamtschnitt-Verlauf, Verlauf pro Fach und die
 * Prognose (Pro-Feature — im UI nur für Pro-User sichtbar).
 */
export function berechneTrend(
  fachRows: FachRow[],
  noteRows: NoteRow[],
  system: Notensystem = DE_0_15,
): { gesamt: TrendPunkt[]; proFach: TrendSerie[]; prognose: Prognose | null } {
  if (noteRows.length === 0) {
    return { gesamt: [], proFach: [], prognose: null };
  }

  const daten = [...new Set(noteRows.map(effDatum))].sort();
  const gesamt: TrendPunkt[] = [];
  const serien = new Map<string, TrendSerie>();

  for (const d of daten) {
    const bisD = noteRows.filter((r) => effDatum(r) <= d);
    const faecher = assembleFaecher(fachRows, bisD);

    const g = gesamtSchnitt(faecher, system);
    if (g !== null) gesamt.push({ datum: d, schnitt: runde(g) });

    for (const fach of faecher) {
      if (fach.parentFachId) continue; // Unterfächer zählen via Elternfach
      if (fach.ausgeschlossen) continue;
      const s = fachSchnittMitKindern(fach, faecher, system);
      if (s === null) continue;

      let serie = serien.get(fach.id);
      if (!serie) {
        serie = {
          fachId: fach.id,
          name: fach.name,
          farbe: fach.farbe ?? null,
          punkte: [],
        };
        serien.set(fach.id, serie);
      }
      serie.punkte.push({ datum: d, schnitt: runde(s) });
    }
  }

  return {
    gesamt,
    proFach: [...serien.values()],
    prognose: berechnePrognose(gesamt, system),
  };
}
