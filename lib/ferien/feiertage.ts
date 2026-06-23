/**
 * Deutsche Feiertage — bundesweit + länderspezifisch.
 * Berechnet für ein gegebenes Jahr und Bundesland alle gesetzlichen Feiertage.
 *
 * Quellen:
 * - BMI-Liste: bmi.bund.de/DE/themen/verfassung/staatliche-symbole/nationale-feiertage
 * - Länderspezifisch: jeweilige Landesgesetze
 */

import type { Bundesland } from "./ferien-data";

export interface Feiertag {
  name: string;
  datum: string; // ISO YYYY-MM-DD
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Gaußsche Osterformel */
function osterSonntag(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Erster Advent: Sonntag zwischen 27.11. und 3.12. */
function ersterAdvent(year: number): Date {
  const nov27 = new Date(year, 10, 27);
  const wday = nov27.getDay(); // 0=So
  return addDays(nov27, wday === 0 ? 0 : 7 - wday);
}

/** Buß- und Bettag: Mittwoch 11 Tage vor erstem Advent (nur SN) */
function bussUndBettag(year: number): Date {
  return addDays(ersterAdvent(year), -11);
}

function mk(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

export function getFeiertage(bundesland: Bundesland, year: number): Feiertag[] {
  const ostern = osterSonntag(year);
  const feiertage: Feiertag[] = [];

  const add = (name: string, d: Date) => {
    feiertage.push({ name, datum: iso(d) });
  };

  // ── Bundesweite Feiertage ─────────────────────────────────────────────────
  add("Neujahr",                  mk(year, 1, 1));
  add("Karfreitag",               addDays(ostern, -2));
  add("Ostermontag",              addDays(ostern, 1));
  add("Tag der Arbeit",           mk(year, 5, 1));
  add("Christi Himmelfahrt",      addDays(ostern, 39));
  add("Pfingstmontag",            addDays(ostern, 50));
  add("Tag der Deutschen Einheit", mk(year, 10, 3));
  add("1. Weihnachtstag",         mk(year, 12, 25));
  add("2. Weihnachtstag",         mk(year, 12, 26));

  // ── Länderspezifische Feiertage ───────────────────────────────────────────

  // Heilige Drei Könige (6.1.) — BW, BY, ST
  if (["BW", "BY", "ST"].includes(bundesland)) {
    add("Heilige Drei Könige", mk(year, 1, 6));
  }

  // Frauentag (8.3.) — BE (seit 2019), MV (seit 2023)
  if (["BE", "MV"].includes(bundesland)) {
    add("Internationaler Frauentag", mk(year, 3, 8));
  }

  // Fronleichnam — BW, BY, HE, NW, RP, SL (+ Teile SN, TH — hier pauschal drin)
  if (["BW", "BY", "HE", "NW", "RP", "SL", "SN", "TH"].includes(bundesland)) {
    add("Fronleichnam", addDays(ostern, 60));
  }

  // Maria Himmelfahrt (15.8.) — BY, SL
  if (["BY", "SL"].includes(bundesland)) {
    add("Maria Himmelfahrt", mk(year, 8, 15));
  }

  // Reformationstag (31.10.) — BB, HB, HH, MV, NI, SH, SN, ST, TH
  if (["BB", "HB", "HH", "MV", "NI", "SH", "SN", "ST", "TH"].includes(bundesland)) {
    add("Reformationstag", mk(year, 10, 31));
  }

  // Allerheiligen (1.11.) — BW, BY, NW, RP, SL
  if (["BW", "BY", "NW", "RP", "SL"].includes(bundesland)) {
    add("Allerheiligen", mk(year, 11, 1));
  }

  // Buß- und Bettag — SN
  if (bundesland === "SN") {
    add("Buß- und Bettag", bussUndBettag(year));
  }

  return feiertage;
}

/** Gibt den Feiertag-Namen für ein gegebenes ISO-Datum zurück, oder null. */
export function getFeiertag(bundesland: Bundesland, iso: string): string | null {
  const year = Number(iso.slice(0, 4));
  const feiertage = getFeiertage(bundesland, year);
  return feiertage.find((f) => f.datum === iso)?.name ?? null;
}
