// Notena — Roadmap State
// Wird von Claude aktualisiert wenn Tasks erledigt werden.
// Nach Update: Dashboard neu laden (Cmd+R) → Tasks haken sich automatisch ab.
// Stand: 2026-07-14

window.ROAD_STATE = {
  // Coding
  c01: true, c02: true, c03: false,
  c04: true, c05: true, // c05: Daily Cron bewusst durch On-Demand-Generierung + Tages-Cache (briefing_cache) ersetzt

  c06: true, c07: true, c08: true,
  c09: true, c10: true, c11: true,
  c12: true, c13: true,
  c14: true, c15: false, c16: false,
  c17: false,
  c18: false, c19: false,

  // Marketing
  m01: true, m02: true, m03: true, // m01: Name "Notena" final (14.07) · m02: TikTok @notena (20.07) · m03: Instagram @notena.app (20.07)

  m04: false,
  m05: false, m06: false,
  m07: false,
  m08: false, m09: false,
  m10: false, m11: false,

  // Finanzen
  f01: false,
  f02: false, f03: false,
  f04: false,
  f05: false,
  f06: false,
  f07: false,

  // Recht
  r01: true,
  r02: true,
  r03: true, r04: true,
  r05: true, r06: false,

  // UX & Onboarding
  u01: false,
  u02: false,
  u03: true,
  u04: true,
  u05: true,
  u06: true, u07: false, u08: false, // u06: Name "Notena" in PWA-Manifest + OG-Tags gesetzt


  // General
  g01: true, g02: true, g03: true, // g01: notena.app gekauft (14.07) · g02: Leaked-Password-Protection aktiviert
  g04: true, g05: true, // g05: Favicon + PWA-Icons (icon.tsx, apple-icon.tsx, favicon.ico, icon512, manifest.ts)
  g06: true, // OG-Image 1200×630 (opengraph-image.tsx)
  g07: true, // Feedback-Kanal: feedback-button.tsx in App eingebunden
  g08: false, g09: false,

  // Metriken & KPIs
  k01: false, k02: false,
  k03: false, k04: false,
  k05: false,
  k06: false, k07: false,
};
