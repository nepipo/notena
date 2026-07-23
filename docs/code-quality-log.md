---
CODE QUALITY - 2026-07-23

TypeScript:
- any-Types gefunden: 0
- @ts-ignore / @ts-expect-error: 0
- Non-null assertions (!=.): 2
  - components/stundenplan/foto-import.tsx:39 — canvas.getContext("2d")! (sicher, 2D immer verfügbar)
  - components/aufgaben/aufgaben-liste.tsx:121 — gruppen.get(item.urgency)! (sicher, urgency ist enum)

console.logs in Produktion: 0 (nur in lib/briefing/live-probe.test.ts — Testdatei, OK)
Server Actions ohne Error-Handling: keine — alle lib/actions/* haben try/catch
Supabase-Calls ohne Error-Check: 1 (behoben, siehe unten)
useEffect für Datenfetching: 0 (alle useEffects für Browser-APIs: PWA, Feedback-Modal, Auth-State — korrekt)

npm audit (vor Fix): 11 Vulnerabilities
npm audit (nach `npm audit fix`): 6 (5 non-breaking behoben)
Verbleibende:
  - KRITISCH: next@16.2.6 — 9 CVEs (SSRF, DoS, Middleware-Bypass, Cache-Confusion) → Fix: 16.2.11
  - MITTEL: postcss (in next/node_modules) → behoben durch Next.js-Update
  - HOCH: sharp (in next/node_modules) → behoben durch Next.js-Update
  - MITTEL: @hono/node-server, @modelcontextprotocol/sdk, shadcn — nur Dev-CLI, kein Produktionscode

Build-Status nach Fixes: ✅ OK (0 TS-Fehler, alle Routes kompiliert)
Sentry-Deprecation-Warnings: 2 (disableLogger, automaticVercelMonitors) — von Sentry-Package, kein Handlungsbedarf bis Sentry-Update

Automatisch behoben:
- app/api/push/subscribe/route.ts:43 — Fehlender Error-Check beim Supabase DELETE hinzugefügt (silent failure → 500-Response)
- package-lock.json — npm audit fix: body-parser, brace-expansion, fast-uri, @inquirer/* aktualisiert

Empfehlungen (manuell, nächster Sprint):
1. KRITISCH: Next.js auf 16.2.11 updaten — `npm install next@16.2.11` (in package.json: "next": "16.2.11")
   CVEs: GHSA-6gpp-xcg3-4w24, GHSA-m99w-x7hq-7vfj, GHSA-89xv-2m56-2m9x, GHSA-68g3-v927-f742, GHSA-4633-3j49-mh5q, GHSA-4c39-4ccg-62r3, GHSA-p9j2-gv94-2wf4, GHSA-q8wf-6r8g-63ch, GHSA-955p-x3mx-jcvp
   → Beinhaltet SSRF-Angriff auf Server Actions + Middleware-Bypass + Server Action DoS
2. Sentry-Config aktualisieren: disableLogger → webpack.treeshake.removeDebugLogging, automaticVercelMonitors → webpack.automaticVercelMonitors (in sentry.client.config.ts / sentry.server.config.ts)

---
