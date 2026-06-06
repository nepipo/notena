import { FERIEN, type Bundesland, type Ferienperiode } from "./ferien-data";

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export interface FerienStatus {
  /** Gerade Ferien? */
  laufend: Ferienperiode | null;
  /** Nächste Ferienperiode (Tage bis Beginn). */
  naechste: Ferienperiode | null;
  tagesBisNaechste: number | null;
  /** Tage bis Ende der laufenden Ferien. */
  tagesBisEnde: number | null;
}

export function getFerienStatus(bundesland: Bundesland): FerienStatus {
  const liste = FERIEN[bundesland] ?? [];
  const h = today();

  let laufend: Ferienperiode | null = null;
  let naechste: Ferienperiode | null = null;
  let tagesBisNaechste: number | null = null;
  let tagesBisEnde: number | null = null;

  for (const f of liste) {
    const von = parseDate(f.von);
    const bis = parseDate(f.bis);

    if (h >= von && h <= bis) {
      laufend = f;
      tagesBisEnde = diffDays(bis, h);
      continue;
    }

    if (von > h) {
      const tage = diffDays(von, h);
      if (naechste === null || tage < tagesBisNaechste!) {
        naechste = f;
        tagesBisNaechste = tage;
      }
    }
  }

  return { laufend, naechste, tagesBisNaechste, tagesBisEnde };
}
