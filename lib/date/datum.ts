/**
 * Reine, abhängigkeitsfreie Datums-Prüfungen.
 * Bewusst OHNE zod — damit sie auch im Client-Bundle landen können, ohne
 * das ganze Validierungs-/zod-Paket mitzuziehen (Performance-Budget).
 *
 * Eine Quelle der Wahrheit für Server (lib/validation.ts) und Client
 * (Onboarding-Flow, Formulare).
 */

/**
 * Prüft, ob ein "YYYY-MM-DD"-String ein *echtes* Kalenderdatum ist.
 * Der reine Regex reicht nicht — er lässt Quatsch wie "2026-99-99",
 * "2026-02-30" oder "2023-02-29" (kein Schaltjahr) durch. Hier wird über
 * einen Date-Round-Trip geprüft: korrigiert Date die Werte, war das Datum
 * unmöglich. KEINE Bereichsgrenzen — nur "existiert dieser Tag im Kalender".
 */
export function istEchtesKalenderdatum(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const jahr = Number(m[1]);
  const monat = Number(m[2]);
  const tag = Number(m[3]);
  const d = new Date(Date.UTC(jahr, monat - 1, tag));
  return (
    d.getUTCFullYear() === jahr &&
    d.getUTCMonth() === monat - 1 &&
    d.getUTCDate() === tag
  );
}

/**
 * Prüft, ob ein "YYYY-MM-DD"-String ein *plausibles Geburtsdatum* ist:
 *   1. echtes Kalenderdatum (fängt 30. Februar & Co.)
 *   2. nicht in der Zukunft
 *   3. nicht mehr als 100 Jahre her (kein 1200er-Jahrgang, kein 9999)
 */
export function istPlausiblesGeburtsdatum(s: string): boolean {
  if (!istEchtesKalenderdatum(s)) return false;
  const jahr = Number(s.slice(0, 4));

  const d = new Date(`${s}T00:00:00Z`);
  const heute = new Date();
  const heuteUTC = Date.UTC(
    heute.getUTCFullYear(),
    heute.getUTCMonth(),
    heute.getUTCDate(),
  );
  if (d.getTime() > heuteUTC) return false; // Zukunft
  if (heute.getUTCFullYear() - jahr > 100) return false; // absurd alt
  return true;
}

/** Frühestes plausibles Geburtsdatum als "YYYY-MM-DD" — für das `min`-Attribut. */
export function fruehestesGeburtsdatum(): string {
  const jahr = new Date().getUTCFullYear() - 100;
  return `${jahr}-01-01`;
}
