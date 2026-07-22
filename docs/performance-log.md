---
PERFORMANCE AUDIT - 2026-07-22

Bundle-Größen (First Load JS — uncompressed, via .next/diagnostics/route-bundle-stats.json):

| Route | Größe (unkomprimiert) | Status |
|-------|----------------------|--------|
| /noten | 801.8 kB | 🔴 KRITISCH |
| /einstellungen | 727.2 kB | 🔴 KRITISCH |
| /stundenplan | 726.9 kB | 🔴 KRITISCH |
| /what-if | 704.6 kB | 🔴 KRITISCH |
| /aufgaben | 691.8 kB | 🔴 KRITISCH |
| /dashboard | 676.4 kB | 🔴 KRITISCH |
| /pro | 657.5 kB | 🔴 KRITISCH |
| /demo/notenrechner | 657.5 kB | 🔴 KRITISCH |
| /signup | 656.8 kB | 🔴 KRITISCH |
| /login | 652.4 kB | 🔴 KRITISCH |
| / (Landing) | 649.6 kB | 🔴 KRITISCH |
| /forgot-password | 649.5 kB | 🔴 KRITISCH |
| /auth/reset | 649.3 kB | 🔴 KRITISCH |
| /warteliste/bestaetigen | 647.8 kB | 🔴 KRITISCH |
| /profil | 647.2 kB | 🔴 KRITISCH |
| /onboarding | 630.2 kB | 🔴 KRITISCH |
| /agb | 617.9 kB | 🔴 KRITISCH |
| /datenschutz | 617.9 kB | 🔴 KRITISCH |
| /impressum | 617.9 kB | 🔴 KRITISCH |
| /offline | 610.9 kB | 🔴 KRITISCH |
| /_not-found | 607.5 kB | 🔴 KRITISCH |

Größte Route: /noten mit 801.8 kB (unkomprimiert)
Kleinste Route: /_not-found mit 607.5 kB (unkomprimiert)

HINWEIS: Diese Werte sind UNKOMPRIMIERT (Turbopack-Diagnostics). Mit Gzip/Brotli
schätzen wir ~200–270 kB compressed, womit das 150 kB-Ziel noch immer verfehlt wird.
Ziel-Revision nötig: 150 kB unkomprimiert ist unrealistisch für React 19 + Next.js 16.
Ein realistisches Ziel für diese App-Struktur wäre ~200–250 kB compressed.

Gesamt-Chunks:
1. 01gm4zqh8lqvi.js: 222.5 kB (React 19 + ReactDOM — shared, alle Routen)
2. 03~yq9q893hmn.js: 110.0 kB (core-js Polyfills — NUR server-side, nicht in Client-Bundles!)
3. 0w0xc8cunx4s~.js: 108.1 kB (Next.js Framework — shared, alle Routen)
4. 14pm0t~x0opoo.js: 93.9 kB (unbekannt — shared)
5. 0275aot.cmujh.js: 53.7 kB (shared)
Gesamt-JS (alle Chunks): 1.27 MB unkomprimiert across 39 Chunks
Gesamt-CSS: 90.1 kB (Tailwind compiled)

Shared-Baseline (Chunks in JEDER Route): ~667 kB uncompressed
Route-spezifischer Overhead: 40–140 kB zusätzlich

Best-Practice-Check:
- <img> statt next/image: 0 Treffer ✅
- next/font verwendet: ✅ (Manrope, Inter, Oswald in layout.tsx)
- "use client" Direktiven: 5 (error.tsx, demo/notenrechner, onboarding-flow, offline) ✅ sehr niedrig
- "use server" Direktiven: 0 (Server Actions nutzen implizit server context) ✅
- console.logs in Produktion: 0 ✅ (nur in *.test.ts Dateien)
- Star-Imports: 3 (React in shadcn/ui Komponenten = normal; Sentry in error.tsx = OK)
- @anthropic-ai/sdk: nur in /api/coach/route.ts (server-only) ✅

Automatisch optimiert: nichts (keine console.logs, keine <img>-Tags gefunden)

Empfehlungen (manuell):

1. [HOCH] Untersuche Chunk 0w0xc8cunx4s~.js (108 kB shared)
   Was ist da drin? Falls eine große Library (z.B. @sentry/nextjs client-side, base-ui internals),
   kann durch lazy import oder Server-only Nutzung reduziert werden.

2. [HOCH] Chunk 14pm0t~x0opoo.js (93.9 kB shared) identifizieren
   Taucht in allen Routen auf. Wenn das eine wiederverwendete Komponente ist, die nicht
   überall gebraucht wird, könnte dynamic() import helfen.

3. [MITTEL] Fonts-Diskrepanz mit CLAUDE.md-Spec
   layout.tsx nutzt: Manrope, Inter, Oswald
   CLAUDE.md spezifiziert: Bricolage Grotesque, Onest, JetBrains Mono
   Drei Fonts laden ist gut (next/font = self-hosted, kein FOUT). Aber stimmt die Spec noch?
   Klären: Wurde die Design-Entscheidung absichtlich geändert?

4. [MITTEL] Ziel revidieren: 150 kB unkomprimiert ist für React 19 nicht erreichbar
   React 19 + ReactDOM = 222 kB unkomprimiert (70 kB gzipped) — das allein überschreitet
   das Ziel. Realistischer Zielwert: unter 300 kB unkomprimiert pro Route
   (entspricht ~100 kB gzipped).

5. [NIEDRIG] /noten ist die schwerste Route (+190 kB vs. /impressum)
   Chunks 0_xobyvtnx0cp.js (40.9 kB) + 0cp.zx2d571jt.js (40.6 kB) + 0m2tq8buqj-4v.js
   (37.3 kB) sind /noten-spezifisch. Notenrechner-Logik prüfen — schwere Client-Komponenten
   mit dynamic(()=>import(...), {ssr:false}) lazy-loaden falls sie nicht sofort sichtbar sind.

6. [NIEDRIG] @sentry/nextjs Deprecation-Warnings
   disableLogger und automaticVercelMonitors sind deprecated. Migration:
   webpack.treeshake.removeDebugLogging und webpack.automaticVercelMonitors
   (erst wenn Turbopack-Support da ist).
---
