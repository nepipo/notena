export interface StundeRow {
  id: string;
  user_id: string;
  fach_id: string | null;
  wochentag: number;       // 1=Mo … 7=So
  zeit_start: string;      // "HH:MM:SS" (Postgres time)
  zeit_end: string;
  raum: string | null;
  woche_typ: "A" | "B" | null;
}

export interface HausaufgabeRow {
  id: string;
  user_id: string;
  fach_id: string | null;
  beschreibung: string;
  faellig_am: string;  // ISO-Datum "YYYY-MM-DD"
  erledigt: boolean;
  created_at: string;
}

/** ISO-Datum → Wochentag 1 (Mo) … 7 (So) */
export function wochentagAusDatum(iso: string): number {
  const d = new Date(iso + "T12:00:00");
  const js = d.getDay(); // 0=So
  return js === 0 ? 7 : js;
}

/** Filtert Stunden nach A/B-Wochen-Modus. */
export function filterStunden(
  stunden: StundeRow[],
  wochenModus: "standard" | "AB",
  aktuelleWoche: "A" | "B",
): StundeRow[] {
  if (wochenModus === "standard") {
    return stunden.filter((s) => s.woche_typ === null);
  }
  return stunden.filter(
    (s) => s.woche_typ === null || s.woche_typ === aktuelleWoche,
  );
}

/** Berechnet Pausen zwischen sortierten Stunden eines Tages. */
export function pausenZwischen(
  stundenAmTag: StundeRow[],
): { start: string; end: string; minuten: number }[] {
  const result: { start: string; end: string; minuten: number }[] = [];
  for (let i = 0; i < stundenAmTag.length - 1; i++) {
    const end = stundenAmTag[i].zeit_end;
    const next = stundenAmTag[i + 1].zeit_start;
    const minuten = zeitZuMinuten(next) - zeitZuMinuten(end);
    if (minuten > 0) result.push({ start: end, end: next, minuten });
  }
  return result;
}

function zeitZuMinuten(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Tage bis zu einem Datum (negativ = vergangen). */
export function tageBis(datumIso: string): number {
  return Math.ceil(
    (new Date(datumIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

/** Hex-Farbe (#rrggbb) → "rgba(r,g,b,alpha)"-String. */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Kürzt "HH:MM:SS" → "HH:MM". */
export function fmtZeit(t: string): string {
  return t.slice(0, 5);
}

export const FACH_FALLBACK_FARBE = "#1da1ff";
