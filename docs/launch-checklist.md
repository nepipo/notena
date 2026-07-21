# LAUNCH COUNTDOWN
Stand: 21.07.2026 | **41 Tage** bis Beta-Launch (31.08.2026) | **29 Werktage**

## Fortschritt: 16 von 16 Tech-Blockern erledigt (100%) ✅

---

## BLOCKER (Launch nicht möglich ohne diese)

### A — Technische Must-Haves
- ✅ Build grün (`next build` — alle Routes, kein Fehler)
- ✅ TypeScript 0 Fehler (`tsc --noEmit` — 0 Zeilen Output)
- ✅ Login/Signup — `app/login/page.tsx` + `app/signup/page.tsx` mit echtem Form-Code
- ✅ Onboarding-Flow — `app/onboarding/onboarding-flow.tsx` (Multi-Step, 9 Steps, localStorage-Bridge)
- ✅ Middleware prüft `onboarding_abgeschlossen` — `lib/supabase/proxy.ts` + `app/(app)/layout.tsx`
- ✅ Dashboard zeigt echte Daten — `app/(app)/dashboard/page.tsx` mit Supabase-Calls
- ✅ Notenerfassung — `addNote`, `updateNote`, `removeNote` in `notenrechner-board.tsx`
- ✅ Notenberechnung korrekt — `lib/grades/systems.ts` DE 0–15 Punkte, GK/LK-Gewichtung, LK-Toggle in Einstellungen
- ✅ Fächer verwalten — `components/einstellungen/faecher-verwaltung.tsx` mit add/update/remove
- ✅ Halbjahr wechseln — `HalbjahrWechsler` + `HalbjahrVerschieben` in Einstellungen, Halbjahr-Picker im Header
- ✅ Mobile-Ansicht — Responsive-Klassen vorhanden (`sm:`, `md:`, `lg:`), 375px-tauglich
- ✅ Passwort ändern — `PasswortAendern`-Komponente in `/einstellungen`

### B — DSGVO / Legal
- ✅ `/impressum` — `app/impressum/page.tsx` vorhanden, deployed
- ✅ `/datenschutz` — `app/datenschutz/page.tsx` vorhanden, deployed
- ✅ Links zu Impressum/Datenschutz/AGB — Landing-Footer `app/page.tsx:294-299` + Einstellungen
- ✅ Account löschen — `DeleteAccountButton` in Einstellungen, `delete_current_user()` in Supabase

---

## SICHERHEITS-WARNINGS (kein direkter Launch-Blocker, aber vor Beta beheben)

- ❌ **Rate-Limit-Bypass möglich** — `check_coach_rate_limit()` ist SECURITY DEFINER und via
  REST für alle `authenticated`-User erreichbar. Ein User kann das Limit mit `p_limit: 999999`
  umgehen und unbegrenzt KI-Coach-Anfragen stellen → echte Kosten bei Scale.
  Fix: Admin-Client in `app/api/coach/route.ts` + EXECUTE für `authenticated` revoken.
  **Seit 2 Tagen offen — höchste Priorität.**
- ❌ **Leaked Password Protection DEAKTIVIERT** — Supabase Auth-Setting, manuell aktivieren.
  → https://supabase.com/dashboard/project/rxmcexzlwocgfocyligd/auth/security
  5 Minuten Aufwand, kein Code nötig.
- ⚠️ `invite_code` + `warteliste`: RLS aktiv, 0 Policies — nur via Service-Role (intentional)
- ⚠️ `delete_current_user()`: SECURITY DEFINER von `authenticated` aufrufbar — intentional

---

## NICE-TO-HAVE (können nach Launch kommen)

- ✅ 404-Seite gestaltet — `app/not-found.tsx` mit Notena-Design
- ✅ Loading-States — `app/(app)/loading.tsx` + Skeleton-Komponenten (6 Verwendungen)
- ✅ Vercel Deployment — READY (commit `ac72613`, heute deployed, Auto-Deploy aktiv)
- ✅ Supabase Status — `ACTIVE_HEALTHY`, PostgreSQL 17.6.1, Region eu-central-1, 6 aktive User
- ⬜ Leaked Password Protection aktivieren (5 Min. — manuell im Supabase-Dashboard)
- ⬜ Marketing-Start — TikTok/Instagram-Handles, erster Post (m02–m11 alle offen)
- ⬜ Pro-Plan / Monetarisierung — komplett ungeplant (f01–f07 alle offen)
- ⬜ Migrations-Tracking: 35 lokal / 51 remote (16 nur remote — Doku-Issue, kein Sicherheitsrisiko)

---

## ERLEDIGT (seit Projekt-Start)

- Build-Pipeline, TypeScript strict, Tailwind v4, shadcn/ui
- GitHub `nepipo/notena`, Vercel Auto-Deploy, Domain `notena.app` live
- Supabase-Schema (15 Tabellen mit RLS), Auto-Profil-Trigger, Security-Hardening
- Email/Passwort Auth, Google OAuth, geschütztes Dashboard, Proxy/Middleware
- Onboarding-Flow (anonym → Signup → applyOnboarding → Dashboard)
- Notenrechner Hero (0–15 Punkte, GK/LK, Halbjahre, Was-wäre-wenn)
- KI-Briefing (Claude Sonnet, Tages-Cache, Ferien-Erkennung)
- KI-Coach (Chat mit Tool-Use, Rate-Limiting via DB)
- Email-Infrastruktur (Resend, notena.app, 10/10 mail-tester)
- Halbjahr-Wechsler im Header + Einstellungen
- Passwort ändern / Account löschen in Einstellungen
- Impressum / Datenschutz / AGB — rechtlich geprüft und live
- PWA-Manifest, Icons, OG-Image, Favicon
- Feedback-Button, Sentry-Integration
- LK-Doppelgewichtung als Einstellung
- Zweispaltiges Auth-Layout mit Marketing-Panel (Desktop)

---

## EMPFEHLUNG HEUTE

**Rate-Limit-Bypass in `check_coach_rate_limit` fixen** — authentifizierte User können
aktuell das KI-Coach-Limit (20 Anfragen/Stunde) umgehen, indem sie Supabase RPC direkt
mit `p_limit: 999999` aufrufen. Kostet echtes Geld bei Scale. Seit 2 Tagen offen.
Fix: ~30 Min (Admin-Client in `app/api/coach/route.ts` + Migration EXECUTE revoken).
Danach 5 Min: Leaked Password Protection im Supabase-Dashboard aktivieren.
