/**
 * Notensystem-Abstraktion — KANONISCHES MODELL.
 *
 * Noten werden intern IMMER als 0–15 Punkte (deutsche Oberstufe) gespeichert.
 * Jedes System rechnet nur beim ANZEIGEN und EINGEBEN in seine eigene Skala um.
 * Dadurch ändert ein System-Wechsel nur die "Anzeige-Linse" — Noten und Schnitt
 * rechnen sich sofort um, ohne dass Daten angefasst werden.
 *
 *  - DE 0–15 ↔ DE 1–6: EXAKT (KMK-Umrechnungstabelle Punkte ↔ Note).
 *  - CH / AT / IB: lineare NÄHERUNG — zwischen Ländern gibt es keine offizielle
 *    Umrechnungsformel, daher bewusst als Näherung gekennzeichnet (exakt=false).
 *
 * Diese Datei importiert NICHT aus calc.ts (sonst Zyklus).
 */

export type NotensystemId = "de_0_15" | "de_1_6" | "ch_1_6" | "at_1_5" | "ib_1_7";
export type Richtung = "hoeher_besser" | "niedriger_besser";

export interface Notensystem {
  id: NotensystemId;
  label: string;
  /** true = Umrechnung ist exakt (nur DE-Systeme), false = Näherung (CH/AT/IB). */
  exakt: boolean;
  /** Kanonischer Bereich — IMMER 0–15 (Punkte). Für Balken-Normalisierung etc. */
  min: number;
  max: number;
  /** Kanonische Schrittweite (Punkte). */
  step: number;
  richtung: Richtung;
  /** Eingabe-Hinweis in der System-Skala (Platzhalter), z.B. "0–15" / "1–6". */
  eingabeHinweis: string;
  /** Kanonische 0–15 Punkte -> Anzeige einer Einzelnote in diesem System. */
  formatNote(punkte: number): string;
  /** Kanonische 0–15 Punkte -> Schnitt-Anzeige in diesem System. */
  formatSchnitt(punkte: number): string;
  /** Eingabe-String (System-Skala) -> kanonische 0–15 Punkte, oder null. */
  parse(eingabe: string): number | null;
  /** CSS-Farbe für einen Schnitt (auf Basis kanonischer Punkte). */
  farbe(punkte: number): string;
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────

function deFix(wert: number, dezimal: number): string {
  return wert.toLocaleString("de-DE", {
    minimumFractionDigits: dezimal,
    maximumFractionDigits: dezimal,
  });
}

function clampP(p: number): number {
  if (Number.isNaN(p)) return 0;
  return Math.min(15, Math.max(0, p));
}

/** Farbe rein nach kanonischen Punkten (hohe Punkte = gut). Für alle Systeme gleich. */
function farbeNachPunkte(punkte: number): string {
  const p = clampP(punkte);
  if (p >= 10) return "var(--success)";
  if (p >= 7) return "#f59e0b";
  return "var(--destructive)";
}

// ── DE-Notentabelle (Punkte ↔ Note), exakt (KMK) ───────────────────────────

/** Kanonische Punkte -> deutsche Tendenz-Note (15 -> "1+", 13 -> "1−", 0 -> "6"). */
function punkteZuNote(punkte: number): string {
  const p = Math.round(clampP(punkte));
  if (p === 0) return "6";
  const grundnote = 6 - Math.ceil(p / 3);
  const rest = (p - 1) % 3;
  const tendenz = rest === 2 ? "+" : rest === 0 ? "−" : "";
  return `${grundnote}${tendenz}`;
}

/** Deutsche Note ("2+", "1-", "6") -> kanonische Punkte, oder null. */
function noteZuPunkte(note: string): number | null {
  const n = note.trim();
  if (n === "6") return 0;
  const match = /^([1-5])([+\-−]?)$/.exec(n);
  if (!match) return null;
  const grundnote = Number(match[1]);
  const tendenz = match[2];
  const hoechster = (6 - grundnote) * 3; // 1->15, 2->12, ... 5->3
  const punkte =
    tendenz === "+" ? hoechster : tendenz === "-" || tendenz === "−" ? hoechster - 2 : hoechster - 1;
  return clampP(punkte);
}

// ── Lineare Näherungs-Umrechnung Punkte <-> Fremdsystem ────────────────────
// Punkte 0..15 werden linear auf [unten..oben] der Zielskala abgebildet.
// invertiert=true für Skalen, bei denen 1 die beste Note ist (AT).

function macheKonverter(unten: number, oben: number, invertiert: boolean) {
  const ausPunkte = (p: number): number => {
    const t = clampP(p) / 15; // 0..1, 1 = beste Leistung
    return invertiert ? oben - t * (oben - unten) : unten + t * (oben - unten);
  };
  const zuPunkte = (wert: number): number => {
    const w = Math.min(oben, Math.max(unten, wert));
    const t = invertiert ? (oben - w) / (oben - unten) : (w - unten) / (oben - unten);
    return Math.round(t * 15);
  };
  return { ausPunkte, zuPunkte };
}

// ── DE Oberstufe (0–15 Punkte) — kanonisch, Anzeige = Punkte ───────────────

/** Eingabe in DE-Oberstufe: rohe Punkte ("14") ODER Note ("2+") -> Punkte. */
function de0_15Parse(eingabe: string): number | null {
  const n = eingabe.trim().replace(",", ".");
  if (n === "") return null;
  if (/^\d{1,2}$/.test(n)) {
    const p = Number(n);
    return p >= 0 && p <= 15 ? p : null;
  }
  return noteZuPunkte(n);
}

export const DE_0_15: Notensystem & {
  /** @deprecated Alias für parse(). */
  noteZuPunkte(note: string): number | null;
  /** @deprecated Alias für formatNote im Note-Stil. */
  punkteZuNote(punkte: number): string;
} = {
  id: "de_0_15",
  label: "Deutschland — Oberstufe (0–15 Punkte)",
  exakt: true,
  min: 0,
  max: 15,
  step: 1,
  richtung: "hoeher_besser",
  eingabeHinweis: "0–15 oder 2+",
  formatNote: (p) => `${Math.round(clampP(p))}`,
  formatSchnitt: (p) => deFix(clampP(p), 1),
  parse: de0_15Parse,
  farbe: farbeNachPunkte,
  noteZuPunkte,
  punkteZuNote,
};

// ── DE Schulnoten (1–6) — EXAKT, Anzeige = Tendenz-Note ────────────────────

export const DE_1_6: Notensystem = {
  id: "de_1_6",
  label: "Deutschland — Schulnoten (1–6)",
  exakt: true,
  min: 0,
  max: 15,
  step: 1,
  richtung: "hoeher_besser",
  eingabeHinweis: "1–6 (z.B. 2+)",
  formatNote: (p) => punkteZuNote(p),
  formatSchnitt: (p) => punkteZuNote(Math.round(clampP(p))),
  parse: (e) => noteZuPunkte(e),
  farbe: farbeNachPunkte,
};

// ── Schweiz (1–6, 6 = beste) — Näherung ────────────────────────────────────

const CH = macheKonverter(1, 6, false);

function chFormat(p: number): string {
  // auf Viertelnote runden
  const v = Math.round(CH.ausPunkte(p) * 4) / 4;
  return deFix(v, 2);
}

export const CH_1_6: Notensystem = {
  id: "ch_1_6",
  label: "Schweiz (1–6)",
  exakt: false,
  min: 0,
  max: 15,
  step: 1,
  richtung: "hoeher_besser",
  eingabeHinweis: "1–6 (z.B. 4,5)",
  formatNote: chFormat,
  formatSchnitt: chFormat,
  parse: (e) => {
    const n = e.trim().replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(n)) return null;
    const w = Number(n);
    if (w < 1 || w > 6) return null;
    return CH.zuPunkte(w);
  },
  farbe: farbeNachPunkte,
};

// ── Österreich (1–5, 1 = beste) — Näherung ─────────────────────────────────

const AT = macheKonverter(1, 5, true);

export const AT_1_5: Notensystem = {
  id: "at_1_5",
  label: "Österreich (1–5)",
  exakt: false,
  min: 0,
  max: 15,
  step: 1,
  richtung: "hoeher_besser",
  eingabeHinweis: "1–5",
  formatNote: (p) => `${Math.round(AT.ausPunkte(p))}`,
  formatSchnitt: (p) => deFix(AT.ausPunkte(p), 1),
  parse: (e) => {
    const n = e.trim();
    if (!/^[1-5]$/.test(n)) return null;
    return AT.zuPunkte(Number(n));
  },
  farbe: farbeNachPunkte,
};

// ── IB (1–7, 7 = beste) — Näherung ─────────────────────────────────────────

const IB = macheKonverter(1, 7, false);

export const IB_1_7: Notensystem = {
  id: "ib_1_7",
  label: "International Baccalaureate (1–7)",
  exakt: false,
  min: 0,
  max: 15,
  step: 1,
  richtung: "hoeher_besser",
  eingabeHinweis: "1–7",
  formatNote: (p) => `${Math.round(IB.ausPunkte(p))}`,
  formatSchnitt: (p) => deFix(IB.ausPunkte(p), 1),
  parse: (e) => {
    const n = e.trim();
    if (!/^[1-7]$/.test(n)) return null;
    return IB.zuPunkte(Number(n));
  },
  farbe: farbeNachPunkte,
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
