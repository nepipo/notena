/** Gibt die CSS-Farb-Variable für einen Schnitt zurück (für inline style). */
export function schnittFarbe(schnitt: number | null): string {
  if (schnitt === null) return "var(--text-dim)";
  if (schnitt >= 10) return "var(--success)";
  if (schnitt >= 7) return "#f59e0b";
  return "var(--destructive)";
}
