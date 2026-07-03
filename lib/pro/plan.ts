/** Minimal-Form eines Profils, die für die Pro-Prüfung reicht. */
export type PlanProfil = {
  plan_tier: string | null;
  plan_bis: string | null;
};

/**
 * Einzige Quelle der Wahrheit für „darf dieser User Pro-Features nutzen".
 * Pro gilt, solange plan_tier === 'pro' UND plan_bis in der Zukunft liegt.
 * plan_bis bleibt nach Kündigung bis zum Periodenende stehen — daher reicht
 * diese eine Prüfung auch für gekündigte-aber-noch-aktive Abos.
 */
export function istPro(profil: PlanProfil | null | undefined): boolean {
  if (!profil) return false;
  if (profil.plan_tier !== "pro") return false;
  if (!profil.plan_bis) return false;
  return new Date(profil.plan_bis).getTime() > Date.now();
}

/** Abo-Intervalle. */
export type PlanIntervall = "woche" | "monat" | "jahr";

/** Preise in Cent (für Anzeige). Quelle: Design-Spec §4. */
export const PREISE: Record<PlanIntervall, number> = {
  woche: 199,
  monat: 499,
  jahr: 3999,
};

export const INTERVALL_LABEL: Record<PlanIntervall, string> = {
  woche: "Woche",
  monat: "Monat",
  jahr: "Jahr",
};
