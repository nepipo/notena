/** Leitet das aktuelle Halbjahr im Format JJJJ/JJ-N aus einem Datum ab.
 *  Schuljahr beginnt im August. HJ-1 = Aug–Jan, HJ-2 = Feb–Jul. */
export function aktuellesHalbjahr(now: Date = new Date()): string {
  const m = now.getMonth(); // 0 = Jan
  const jahr = now.getFullYear();
  const startjahr = m >= 7 ? jahr : jahr - 1; // ab August neues Schuljahr
  const kurz = String((startjahr + 1) % 100).padStart(2, "0");
  const hj = m >= 7 || m <= 0 ? 1 : 2; // Aug(7)–Jan(0) => HJ1, sonst HJ2
  return `${startjahr}/${kurz}-${hj}`;
}

/** Zerlegt "JJJJ/JJ-N" in Startjahr, Kurzjahr, Halbjahr-Nummer. */
function parseHalbjahr(
  hj: string,
): { startjahr: number; kurz: string; nummer: number } | null {
  const m = /^(\d{4})\/(\d{2})-([12])$/.exec(hj);
  if (!m) return null;
  return { startjahr: Number(m[1]), kurz: m[2], nummer: Number(m[3]) };
}

/** "2025/26-2" -> "2. Halbjahr · 2025/26". Ungültiger Input wird unverändert zurückgegeben. */
export function halbjahrLabel(hj: string): string {
  const p = parseHalbjahr(hj);
  if (!p) return hj;
  return `${p.nummer}. Halbjahr · ${p.startjahr}/${p.kurz}`;
}

/** Liefert das chronologisch nächste Halbjahr. HJ-1 -> HJ-2, HJ-2 -> HJ-1 des Folgejahres. */
export function naechstesHalbjahr(hj: string): string {
  const p = parseHalbjahr(hj);
  if (!p) return hj;
  if (p.nummer === 1) {
    return `${p.startjahr}/${p.kurz}-2`;
  }
  const neuStart = p.startjahr + 1;
  const neuKurz = String((neuStart + 1) % 100).padStart(2, "0");
  return `${neuStart}/${neuKurz}-1`;
}
