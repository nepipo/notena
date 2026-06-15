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

// ── DE Schulnoten (1–6, Tendenz, niedriger = besser) ───────────────────────

const DE_1_6_TENDENZ: Record<string, number> = { "+": -0.3, "-": 0.3, "−": 0.3, "": 0 };

function de1_6Parse(eingabe: string): number | null {
  const n = eingabe.trim();
  const m = /^([1-6])([+\-−]?)$/.exec(n);
  if (!m) return null;
  const basis = Number(m[1]);
  const delta = DE_1_6_TENDENZ[m[2]] ?? 0;
  const wert = Math.round((basis + delta) * 10) / 10;
  if (wert < 1 || wert > 6) return null;
  return wert;
}

function de1_6FormatNote(wert: number): string {
  const basis = Math.round(wert);
  const diff = Math.round((wert - basis) * 10) / 10;
  const tendenz = diff <= -0.3 ? "+" : diff >= 0.3 ? "−" : "";
  return `${basis}${tendenz}`;
}

export const DE_1_6: Notensystem = {
  id: "de_1_6",
  label: "Deutschland — Schulnoten (1–6)",
  min: 1,
  max: 6,
  step: 0.1,
  richtung: "niedriger_besser",
  bestehtAb: 4,
  schnittDezimal: 1,
  formatNote: de1_6FormatNote,
  formatSchnitt: (w) => deFix(w, 1),
  parse: de1_6Parse,
  farbe: (s) => farbeNachRichtung(s, "niedriger_besser", 2, 4),
};

// ── Schweiz (1–6, Viertelnoten, höher = besser) ────────────────────────────

function ch1_6Parse(eingabe: string): number | null {
  const n = eingabe.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(n)) return null;
  const wert = Number(n);
  if (wert < 1 || wert > 6) return null;
  if (Math.abs(wert * 4 - Math.round(wert * 4)) > 1e-9) return null;
  return Math.round(wert * 4) / 4;
}

export const CH_1_6: Notensystem = {
  id: "ch_1_6",
  label: "Schweiz (1–6)",
  min: 1,
  max: 6,
  step: 0.25,
  richtung: "hoeher_besser",
  bestehtAb: 4,
  schnittDezimal: 2,
  formatNote: (w) => deNum(w),
  formatSchnitt: (w) => deFix(w, 2),
  parse: ch1_6Parse,
  farbe: (s) => farbeNachRichtung(s, "hoeher_besser", 5, 4),
};

// ── Gemeinsamer Parser für Ganzzahl-Systeme ────────────────────────────────

function ganzzahlParse(min: number, max: number) {
  return (eingabe: string): number | null => {
    const n = eingabe.trim();
    if (!/^\d+$/.test(n)) return null;
    const w = Number(n);
    return w >= min && w <= max ? w : null;
  };
}

// ── Österreich (1–5, niedriger = besser) ───────────────────────────────────

export const AT_1_5: Notensystem = {
  id: "at_1_5",
  label: "Österreich (1–5)",
  min: 1,
  max: 5,
  step: 1,
  richtung: "niedriger_besser",
  bestehtAb: 4,
  schnittDezimal: 1,
  formatNote: (w) => deNum(w),
  formatSchnitt: (w) => deFix(w, 1),
  parse: ganzzahlParse(1, 5),
  farbe: (s) => farbeNachRichtung(s, "niedriger_besser", 2, 4),
};

// ── IB (1–7, höher = besser) ───────────────────────────────────────────────

export const IB_1_7: Notensystem = {
  id: "ib_1_7",
  label: "International Baccalaureate (1–7)",
  min: 1,
  max: 7,
  step: 1,
  richtung: "hoeher_besser",
  bestehtAb: 4,
  schnittDezimal: 1,
  formatNote: (w) => deNum(w),
  formatSchnitt: (w) => deFix(w, 1),
  parse: ganzzahlParse(1, 7),
  farbe: (s) => farbeNachRichtung(s, "hoeher_besser", 5, 4),
};

// ── Registry ───────────────────────────────────────────────────────────────

const ALLE: Record<NotensystemId, Notensystem> = {
  de_0_15: DE_0_15,
  de_1_6: DE_1_6,
  ch_1_6: CH_1_6,
  at_1_5: AT_1_5,
  ib_1_7: IB_1_7,
};

/** Liefert das Notensystem zur Id, fällt auf DE zurück. */
export function getNotensystem(id: string): Notensystem {
  return ALLE[id as NotensystemId] ?? DE_0_15;
}

/** Alle Systeme als Liste (für Dropdowns), DE zuerst. */
export const ALLE_SYSTEME: Notensystem[] = [DE_0_15, DE_1_6, CH_1_6, AT_1_5, IB_1_7];
