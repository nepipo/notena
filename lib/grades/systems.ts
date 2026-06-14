/**
 * Notensystem-Abstraktion. Single Source of Truth für alle Systeme.
 * Jedes System kapselt Bereich, Richtung, Format, Parse und Farb-Logik.
 * Diese Datei importiert NICHT aus calc.ts (sonst Zyklus) — die DE-Note-Logik
 * lebt hier.
 */

export type NotensystemId = "de_0_15" | "de_1_6" | "ch_1_6" | "at_1_5" | "ib_1_7";
export type Richtung = "hoeher_besser" | "niedriger_besser";

export interface Notensystem {
  id: NotensystemId;
  label: string;
  min: number;
  max: number;
  /** Schrittweite gültiger Eingaben (1 = Ganzzahl, 0.25 = CH-Viertel). */
  step: number;
  richtung: Richtung;
  /** Schwelle „bestanden" (mit richtung interpretiert). Nur für Anzeige/Farbe. */
  bestehtAb: number;
  /** Nachkommastellen der Schnitt-Anzeige. */
  schnittDezimal: number;
  /** Einzelnote/Label, z.B. 13 -> "1−" (DE) oder 4.5 -> "4,5" (CH). */
  formatNote(wert: number): string;
  /** Schnitt mit fixen Nachkommastellen, de-DE. */
  formatSchnitt(wert: number): string;
  /** Eingabe-String -> gespeicherter Wert, oder null bei ungültig. */
  parse(eingabe: string): number | null;
  /** CSS-Farbe für einen Schnitt (richtungsabhängig). */
  farbe(schnitt: number): string;
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────

function deFix(wert: number, dezimal: number): string {
  return wert.toLocaleString("de-DE", {
    minimumFractionDigits: dezimal,
    maximumFractionDigits: dezimal,
  });
}

/** Natürliche Zahl-Darstellung ohne erzwungene Nachkommastellen (max 2). */
function deNum(wert: number): string {
  return wert.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Farb-Logik nach Richtung: bei hoeher_besser ist großer Wert gut, bei
 * niedriger_besser ist kleiner Wert gut. `gut`/`mittel` sind Schwellen in
 * Richtung „besser".
 */
function farbeNachRichtung(
  schnitt: number,
  richtung: Richtung,
  gut: number,
  mittel: number,
): string {
  const istGut = richtung === "hoeher_besser" ? schnitt >= gut : schnitt <= gut;
  const istMittel = richtung === "hoeher_besser" ? schnitt >= mittel : schnitt <= mittel;
  if (istGut) return "var(--success)";
  if (istMittel) return "#f59e0b";
  return "var(--destructive)";
}

function clampZu(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}

// ── DE Oberstufe (0–15) ────────────────────────────────────────────────────

/** Punkte -> Tendenz-Note (15 -> "1+", 13 -> "1−", 0 -> "6"). */
function de0_15FormatNote(punkte: number): string {
  const p = Math.round(clampZu(punkte, 0, 15));
  if (p === 0) return "6";
  const grundnote = 6 - Math.ceil(p / 3);
  const rest = (p - 1) % 3;
  const tendenz = rest === 2 ? "+" : rest === 0 ? "−" : "";
  return `${grundnote}${tendenz}`;
}

/**
 * Note ("2+", "1-", "6") -> Punkte (nur Notendarstellung, keine rohen Zahlen).
 * @deprecated Aliased als noteZuPunkte für Rückwärtskompatibilität.
 */
function de0_15NoteZuPunkte(note: string): number | null {
  const n = note.trim();
  if (n === "6") return 0;
  // Akzeptiere Bindestrich (U+002D) und Minus (U+2212).
  const match = /^([1-5])([+\-−]?)$/.exec(n);
  if (!match) return null;
  const grundnote = Number(match[1]);
  const tendenz = match[2];
  const hoechster = (6 - grundnote) * 3; // 1->15, 2->12, ... 5->3
  const punkte =
    tendenz === "+" ? hoechster : tendenz === "-" || tendenz === "−" ? hoechster - 2 : hoechster - 1;
  return clampZu(punkte, 0, 15);
}

/** Note ("2+") -> Punkte. Akzeptiert auch rohe Ganzzahl-Punkte ("14"). */
function de0_15Parse(eingabe: string): number | null {
  const n = eingabe.trim().replace(",", ".");
  if (n === "") return null;
  // Rohe Punkte?
  if (/^\d{1,2}$/.test(n)) {
    const p = Number(n);
    return p >= 0 && p <= 15 ? p : null;
  }
  if (n === "6") return 0;
  // Tendenz-Note. Akzeptiere Bindestrich (U+002D) und Minus (U+2212).
  const match = /^([1-5])([+\-−]?)$/.exec(n);
  if (!match) return null;
  const grundnote = Number(match[1]);
  const tendenz = match[2];
  const hoechster = (6 - grundnote) * 3; // 1->15, 2->12, ... 5->3
  const punkte =
    tendenz === "+" ? hoechster : tendenz === "-" || tendenz === "−" ? hoechster - 2 : hoechster - 1;
  return clampZu(punkte, 0, 15);
}

export const DE_0_15: Notensystem & {
  /** @deprecated Alias für parse(). Bleibt für Alt-Tests und -Komponenten. */
  noteZuPunkte(note: string): number | null;
  /** @deprecated Alias für formatNote(). Bleibt für Alt-Tests und -Komponenten. */
  punkteZuNote(punkte: number): string;
} = {
  id: "de_0_15",
  label: "Deutschland — Oberstufe (0–15 Punkte)",
  min: 0,
  max: 15,
  step: 1,
  richtung: "hoeher_besser",
  bestehtAb: 5,
  schnittDezimal: 1,
  formatNote: de0_15FormatNote,
  formatSchnitt: (w) => deFix(w, 1),
  parse: de0_15Parse,
  farbe: (s) => farbeNachRichtung(s, "hoeher_besser", 10, 7),
  noteZuPunkte: de0_15NoteZuPunkte,
  punkteZuNote: de0_15FormatNote,
};

const ALLE: Record<NotensystemId, Notensystem> = {
  de_0_15: DE_0_15,
  // weitere Systeme folgen in den nächsten Tasks
} as Record<NotensystemId, Notensystem>;

/** Liefert das Notensystem zur Id, fällt auf DE zurück. */
export function getNotensystem(id: string): Notensystem {
  return ALLE[id as NotensystemId] ?? DE_0_15;
}
