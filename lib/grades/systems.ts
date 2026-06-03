/**
 * Notensystem-Abstraktion. Macht den Notenrechner system-faehig.
 * Jetzt nur Deutschland (0-15 Punkte). CH/AT/IB folgen spaeter als
 * weitere Implementierungen desselben Interfaces.
 */
import { clampPunkte, punkteZuNote } from "./calc";

export type NotensystemId = "de_0_15";

export interface Notensystem {
  id: NotensystemId;
  label: string;
  /** Kleinster gueltiger Punktwert. */
  min: number;
  /** Groesster gueltiger Punktwert. */
  max: number;
  /** Punkte -> Notendarstellung (z.B. 13 -> "1-"). */
  punkteZuNote(punkte: number): string;
  /** Notendarstellung -> Punkte, oder null bei ungueltiger Eingabe. */
  noteZuPunkte(note: string): number | null;
}

export const DE_0_15: Notensystem = {
  id: "de_0_15",
  label: "Deutschland — Oberstufe (0–15 Punkte)",
  min: 0,
  max: 15,
  punkteZuNote,
  noteZuPunkte(note: string): number | null {
    const n = note.trim();
    if (n === "6") return 0;
    // Accept both regular hyphen (U+002D) and Unicode minus sign (U+2212)
    // punkteZuNote produces U+2212; user input typically uses U+002D.
    const match = /^([1-5])([+\-−]?)$/.exec(n);
    if (!match) return null;
    const grundnote = Number(match[1]);
    const tendenz = match[2];
    const hoechster = (6 - grundnote) * 3; // 1->15, 2->12, ... 5->3
    const punkte =
      tendenz === "+" ? hoechster : tendenz === "-" || tendenz === "−" ? hoechster - 2 : hoechster - 1;
    return clampPunkte(punkte);
  },
};

const ALLE: Record<NotensystemId, Notensystem> = {
  de_0_15: DE_0_15,
};

/** Liefert das Notensystem zur Id, faellt auf DE zurueck. */
export function getNotensystem(id: string): Notensystem {
  return ALLE[id as NotensystemId] ?? DE_0_15;
}
