# Weekly Audit Log

---
## WEEKLY FULL-AUDIT - 2026-07-23

**Build:** OK (0 Fehler)
**TypeScript:** 0 `any`-Types / 0 `@ts-ignore`
**console.logs entfernt:** 0 (vorhandene logs nur in Testdateien — korrekt)

---

### SECURITY

**npm audit:**
- 0 kritisch
- 2 hoch (nach Fix: next-intern, nicht direkt behebbar — s.u.)
- 7 moderat (6 davon transitiv, nicht direkt behebbar)
- 0 niedrig

**Packages geupdated:**
- `next` 16.2.6 → **16.2.11** ✅ (HIGH CVE GHSA-6gpp-xcg3-4w24: Middleware/Proxy bypass mit Turbopack — gefixt)
- `eslint-config-next` 16.2.6 → 16.2.11
- `@sentry/nextjs` 10.58.0 → 10.67.0
- `lucide-react` 1.18.0 → 1.25.0
- `@base-ui/react` 1.5.0 → 1.6.0
- `tailwindcss` 4.3.1 → 4.3.3
- `@tailwindcss/postcss` 4.3.1 → 4.3.3
- `@anthropic-ai/sdk` 0.104.1 → 0.104.2
- `resend` 6.16.0 → 6.18.0
- `vitest` 4.1.8 → 4.1.10
- `eslint` 9.39.4 → 9.39.5

**Verbleibende Audit-Findings (nicht direkt behebbar):**
- `sharp@0.34.5` HIGH (in next@16.2.11 intern) — betrifft libvips CVEs, fix braucht next@16.3+. Notena läuft auf Linux/Vercel, CVEs haben Score 0, kein akuter Handlungsbedarf.
- `postcss@8.4.31` MODERATE (in next intern) — XSS in CSS-Stringify, aber nur Build-Zeit-Tool, kein Runtime-Risiko für SaaS-App.
- `@hono/node-server` MODERATE (via `shadcn` CLI, devDependency) — kein Produktions-Runtime-Risiko.

**Secret-Scan (letzte 7 Tage):** ✅ Sauber — keine Credentials im Code

---

### PERFORMANCE

**Größte Chunks (static):** 224 kB (einzelner Chunk), 1.9 MB gesamt static
**Bundle-Status:** OK — kein Route-Bloat erkennbar
**img-Tags statt next/image:** keine
**Sentry-Deprecation-Warnings:** `disableLogger` und `automaticVercelMonitors` sind deprecated. Nicht breaking, aber für nächste Major-Sentry-Migration vormerken.

---

### DB HEALTH (Supabase rxmcexzlwocgfocyligd)

**RLS:** ✅ Alle 15 Tabellen haben RLS aktiviert
- `invite_code`: RLS an, keine Policies → Deny-All default → **intentional** (nur server-seitig via Service Role)
- `warteliste`: RLS an, keine Policies → Deny-All default → **intentional** (nur server-seitig via Service Role)

**Security Advisor (WARNs — alle intentional):**
- `check_coach_rate_limit(p_limit integer)` als SECURITY DEFINER durch `authenticated` aufrufbar → **intentional** (Rate-Limit-Funktion muss von eingeloggten Usern aufrufbar sein)
- `delete_current_user()` als SECURITY DEFINER durch `authenticated` aufrufbar → **intentional** (Account-Löschen durch den User selbst)
- Leaked Password Protection deaktiviert → **offen** (steht seit CLAUDE.md als TODO, manuell im Supabase Dashboard: Authentication → Password Security aktivieren)

**Performance Advisor (Unused Indexes — INFO, kein Handlungsbedarf):**
Alle 7 als "unused" gemeldeten Indexes sind korrekt gesetzt, aber noch nicht von Query-Planner aktiviert (normaler Zustand bei neuem Projekt mit wenig Traffic):
- `idx_nutzer_profil_ls_customer` (nutzer_profil)
- `idx_schule_fach_parent` (schule_fach)
- `idx_schule_klausur_user_datum` (schule_klausur)
- `idx_hausaufgabe_user_erledigt_faellig` (hausaufgabe)
- `idx_stundenplan_entfall_stunde_id` (stundenplan_entfall)
- `idx_stundenplan_halbjahr_user` (stundenplan_halbjahr)
- `idx_stundenplan_stunde_halbjahr` (stundenplan_stunde)

**Neue Indexes erstellt:** keine (alle user_id-Spalten bereits indexiert)

---

### MAJOR VERSION UPGRADES (nicht installiert — nur Dokumentation)

| Package | Aktuell | Latest | Grund Skip |
|---------|---------|--------|------------|
| `typescript` | 5.9.3 | 7.0.2 | Major — protected |
| `@types/node` | 20.x | 26.x | Major |
| `eslint` | 9.39.5 | 10.x | Major |
| `@supabase/ssr` | 0.10.3 | 0.12.3 | Protected |
| `@supabase/supabase-js` | 2.106.2 | 2.110.8 | Protected |
| `react`/`react-dom` | 19.2.4 | 19.2.8 | Protected |

---

### Fixes in diesem Lauf

1. `next` 16.2.6 → 16.2.11 (HIGH CVE Middleware bypass — gefixt, committed, gepusht)
2. 10 weitere Packages auf neueste Patch/Minor-Version aktualisiert

### Manuell zu prüfen

1. **Leaked Password Protection** im Supabase Dashboard aktivieren: Authentication → Settings → Password Security → "Prevent use of leaked passwords" (HaveIBeenPwned.org-Integration). Prio: MITTEL.
2. **Sentry-Config modernisieren**: `disableLogger` → `webpack.treeshake.removeDebugLogging`, `automaticVercelMonitors` → `webpack.automaticVercelMonitors` in `next.config.ts` (kein Breaking Change, aber Sentry gibt Deprecation-Warnings). Prio: NIEDRIG.
3. **`@supabase/supabase-js` + `@supabase/ssr` Minor-Updates** (2.106.2 → 2.110.8 und 0.10.3 → 0.12.3): Changelog prüfen — breaking changes möglich trotz minor Version. Eigene Session planen. Prio: MITTEL.
