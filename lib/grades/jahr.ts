/**
 * Jahres-Aggregation: führt die Fächer zweier Halbjahre (per Name) zu einer
 * Schuljahres-Übersicht zusammen. Reine Funktionen — testbar, keine DB.
 *
 * Jahresschnitt = Mittel der vorhandenen Halbjahresschnitte
 * (beide da -> Durchschnitt, nur einer -> dieser).
 */
import { fachSchnittGerundet, gesamtSchnittGerundet, runde } from "./calc";
import type { Fach } from "./types";

export interface JahresFachZeile {
  name: string;
  niveau?: string;
  farbe?: string | null;
  hj1: number | null;
  hj2: number | null;
  jahr: number | null;
}

export interface JahresUebersicht {
  zeilen: JahresFachZeile[];
  gesamtHj1: number | null;
  gesamtHj2: number | null;
  gesamtJahr: number | null;
}

/** Mittel zweier optionaler Werte: beide -> Durchschnitt, einer -> dieser, keiner -> null. */
function mittel(a: number | null, b: number | null): number | null {
  if (a !== null && b !== null) return runde((a + b) / 2);
  return a ?? b;
}

export function berechneJahresUebersicht(
  hj1Faecher: Fach[],
  hj2Faecher: Fach[],
): JahresUebersicht {
  const byName1 = new Map(hj1Faecher.map((f) => [f.name, f]));
  const byName2 = new Map(hj2Faecher.map((f) => [f.name, f]));
  const namen = Array.from(
    new Set([...byName1.keys(), ...byName2.keys()]),
  ).sort((a, b) => a.localeCompare(b, "de"));

  const zeilen: JahresFachZeile[] = namen.map((name) => {
    const f1 = byName1.get(name);
    const f2 = byName2.get(name);
    const hj1 = f1 ? fachSchnittGerundet(f1.noten, f1.gewichtung) : null;
    const hj2 = f2 ? fachSchnittGerundet(f2.noten, f2.gewichtung) : null;
    // Anzeige-Metadaten bevorzugt aus dem aktuelleren (hj2) Fach.
    const meta = f2 ?? f1;
    return {
      name,
      niveau: meta?.niveau,
      farbe: meta?.farbe,
      hj1,
      hj2,
      jahr: mittel(hj1, hj2),
    };
  });

  const gesamtHj1 = gesamtSchnittGerundet(hj1Faecher);
  const gesamtHj2 = gesamtSchnittGerundet(hj2Faecher);

  return {
    zeilen,
    gesamtHj1,
    gesamtHj2,
    gesamtJahr: mittel(gesamtHj1, gesamtHj2),
  };
}
