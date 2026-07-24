/**
 * Einzige Quelle der Wahrheit für die Pro-Feature-Liste (Pricing-Seite + Paywall-Popup).
 * `bald: true` = auf der Roadmap, aber noch NICHT gebaut → wird ehrlich als „bald" markiert,
 * damit niemand für ein leeres Feature zahlt. Sobald ein Feature live ist, das Flag entfernen.
 */
export type ProFeature = { label: string; bald?: boolean };

export const PRO_FEATURES: ProFeature[] = [
  { label: "KI-Coach — Chat mit Claude" },
  { label: "Tägliches KI-Briefing" },
  { label: "Trend-Analyse & Abi-Prognose", bald: true },
  { label: "Themes & Akzentfarben", bald: true },
  { label: "PDF-Report deiner Noten", bald: true },
];
