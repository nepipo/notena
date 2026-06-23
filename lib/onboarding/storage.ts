/**
 * Onboarding-Bridge: Da das Onboarding *vor* der Registrierung laeuft (anonym),
 * gibt es noch keine user_id. Die Antworten werden daher im Browser zwischen-
 * gelagert und nach dem ersten Login per applyOnboarding() in die DB geschrieben.
 *
 * Fallback: Geht der localStorage verloren (z. B. E-Mail auf anderem Geraet
 * bestaetigt), bleibt onboarding_abgeschlossen=false und der User durchlaeuft
 * das Onboarding eingeloggt erneut — kein Datenverlust-Drama.
 */

export type OnboardingNiveau = "grund" | "erhoeht";

export interface OnboardingFach {
  name: string;
  niveau: OnboardingNiveau;
}

export interface OnboardingData {
  vorname: string;
  nachname: string | null;
  geburtsdatum: string | null; // ISO "YYYY-MM-DD"
  klasse: number | null;
  land: string | null;         // "de", "at", "ch", "other"
  bundesland: string | null;
  schulform: string | null;
  schule: string | null;
  faecher: OnboardingFach[];
}

const STORAGE_KEY = "px_onboarding";

export function saveOnboarding(data: OnboardingData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage kann voll/blockiert sein — Onboarding laeuft trotzdem weiter
  }
}

export function loadOnboarding(): OnboardingData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingData;
  } catch {
    return null;
  }
}

export function clearOnboarding(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // egal
  }
}
