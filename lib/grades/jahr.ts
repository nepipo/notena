/**
 * Jahres-Aggregation: führt die Fächer zweier Halbjahre (per Name) zu einer
 * Schuljahres-Übersicht zusammen. Reine Funktionen — testbar, keine DB.
 *
 * Jahresschnitt = Mittel der vorhandenen Halbjahresschnitte
 * (beide da -> Durchschnitt, nur einer -> dieser).
 */
import {
  fachSchnittGerundet,
  fachSchnittMitUnterfaecher,
  gesamtSchnittGerundet,
  runde,
} from "./calc";
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

/** Fachschnitt inkl. Unterfächer (wie in der Halbjahres-Ansicht), gerundet. */
function zeilenSchnitt(fach: Fach, alleFaecher: Fach[]): number | null {
  const unterfaecher = alleFaecher.filter((f) => f.parentFachId === fach.id);
  if (unterfaecher.length === 0) {
    return fachSchnittGerundet(fach.noten, fach.gewichtungConfig);
  }
  const s = fachSchnittMitUnterfaecher(fach, unterfaecher);
  return s === null ? null : runde(s);
}

export function berechneJahresUebersicht(
  hj1Faecher: Fach[],
  hj2Faecher: Fach[],
): JahresUebersicht {
  // Unterfächer zählen über ihr Elternfach — keine eigene Zeile.
  // Verwaiste Unterfächer (Elternfach nicht in der Liste) bleiben eigene Zeilen.
  const istTopLevel = (f: Fach, alle: Fach[]) =>
    !f.parentFachId || !alle.some((p) => p.id === f.parentFachId);
  const top1 = hj1Faecher.filter((f) => istTopLevel(f, hj1Faecher));
  const top2 = hj2Faecher.filter((f) => istTopLevel(f, hj2Faecher));

  const byName1 = new Map(top1.map((f) => [f.name, f]));
  const byName2 = new Map(top2.map((f) => [f.name, f]));
  const namen = Array.from(
    new Set([...byName1.keys(), ...byName2.keys()]),
  ).sort((a, b) => a.localeCompare(b, "de"));

  const zeilen: JahresFachZeile[] = namen.map((name) => {
    const f1 = byName1.get(name);
    const f2 = byName2.get(name);
    const hj1 = f1 ? zeilenSchnitt(f1, hj1Faecher) : null;
    const hj2 = f2 ? zeilenSchnitt(f2, hj2Faecher) : null;
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
