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
