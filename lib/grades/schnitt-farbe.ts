import { DE_0_15, type Notensystem } from "./systems";

/** CSS-Farb-Variable für einen Schnitt, richtungsabhängig je System. */
export function schnittFarbe(schnitt: number | null, system: Notensystem = DE_0_15): string {
  if (schnitt === null) return "var(--text-dim)";
  return system.farbe(schnitt);
}
