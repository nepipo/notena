# LAUNCH COUNTDOWN
Stand: 24.07.2026 | **38 Tage** bis Beta-Launch (31.08.2026) | **26 Werktage**

## Fortschritt: 16 von 16 Tech-Blockern erledigt (100%) ✅

---

## BLOCKER (Launch nicht möglich ohne diese)

### A — Technische Must-Haves
- ✅ Build grün (`next build` — alle Routes, kein Fehler, 13.2s, Turbopack)
- ✅ TypeScript 0 Fehler (`tsc --noEmit` — 0 Zeilen Output)
- ✅ Login/Signup — `app/login/page.tsx` + `app/signup/page.tsx` mit echtem Form-Code
- ✅ Onboarding-Flow — `app/onboarding/onboarding-flow.tsx` (8 Schritte, Multi-Step, localStorage-Bridge)
- ✅ Middleware prüft `onboarding_abgeschlossen` — `app/(app)/layout.tsx:25-26` → Redirect `/onboarding`
- ✅ Dashboard zeigt echte Daten — `app/(app)/dashboard/page.tsx` mit 6 parallelen Supabase-Queries
- ✅ Notenerfassung — `addNote` in `lib/actions/schule.ts`, `NotenrechnerBoard` in `/noten`
- ✅ Notenberechnung korrekt — `lib/grades/calc.ts` + `systems.ts`, DE 0–15 Punkte, GK/LK-Gewichtung
- ✅ Fächer verwalten — `faecher-verwaltung.tsx` + `notenrechner-board.tsx` mit add/update/remove
- ✅ Halbjahr wechseln — `HalbjahrWechsler` + `HalbjahrVerschieben` in Einstellungen
- ✅ Mobile-Ansicht — Responsive-Klassen vorhanden (`sm:`, `md:`, `lg:`) in Components
- ✅ Passwort ändern — `components/einstellungen/passwort-aendern.tsx` in `/einstellungen`

### B — DSGVO / Legal
- ✅ `/impressum` — `app/impressum/page.tsx` vorhanden, im Build als Route (ƒ /impressum)
- ✅ `/datenschutz` — `app/datenschutz/page.tsx` vorhanden, im Build als Route (ƒ /datenschutz)
- ✅ Links zu Impressum/Datenschutz — Landing-Footer + Einstellungen + AGB (14+ Stellen)
- ✅ Account löschen — `DeleteAccountButton` in Einstellungen, `deleteAccount` Server-Action

---

## SICHERHEITS-WARNINGS

- ✅ **Rate-Limit-Bypass BEHOBEN** (23.07.2026) — `check_coach_rate_limit()` hat keinen `p_limit`-Parameter mehr, Limit hardcoded in SQL (Migration `0031`)
- ✅ **Anon-EXECUTE auf `check_coach_rate_limit()` REVOKED** (24.07.2026) — Migration `0032` angewandt. Funktion war via REST für anon aufrufbar trotz SECURITY DEFINER. Jetzt nur noch `authenticated`.
- ❌ **Leaked Password Protection DEAKTIVIERT** — Supabase Auth-Setting, 5 Min. Fix im Dashboard.
  → https://supabase.com/dashboard/project/rxmcexzlwocgfocyligd/auth/security
- ⚠️ `invite_code` + `warteliste`: RLS aktiv, 0 Policies — nur via Service-Role (intentional)
- ⚠️ `delete_current_user()`: SECURITY DEFINER von `authenticated` aufrufbar — intentional (User löscht eigenen Account)

---

## NICE-TO-HAVE (können nach Launch kommen)

- ✅ 404-Seite gestaltet — `app/not-found.tsx` vorhanden, branded Design
- ✅ Loading-States — `app/(app)/loading.tsx` + Skeleton-Komponenten vorhanden
- ✅ Vercel letztes Deployment — READY (`dpl_GAUeYGn`, Commit: "docs: debug-report 2026-07-24")
- ✅ Supabase Status — `ACTIVE_HEALTHY`, PostgreSQL 17.6.1, Region eu-central-1
- ⬜ Marketing-Start — TikTok/Instagram-Handles, erster Post (m02–m11 alle offen)
- ⬜ Pro-Plan / Monetarisierung — komplett ungeplant (f01–f07 alle offen)

---

## ERLEDIGT (seit Projekt-Start)

- Build-Pipeline, TypeScript strict, Tailwind v4, shadcn/ui
- GitHub `nepipo/notena`, Vercel Auto-Deploy, Domain `notena.app` live
- Supabase-Schema (32 Migrationen, 15+ Tabellen mit RLS), Auto-Profil-Trigger, Security-Hardening
- Email/Passwort Auth, Google OAuth, geschütztes Dashboard, Proxy/Middleware
- Onboarding-Flow (anonym → Signup → applyOnboarding → Dashboard)
- Notenrechner Hero (0–15 Punkte, GK/LK, Halbjahre, Was-wäre-wenn)
- KI-Briefing (Claude Sonnet, Tages-Cache, Ferien-Erkennung)
- KI-Coach (Chat mit Tool-Use, Rate-Limiting via DB — Bypass + Anon-EXECUTE geschlossen)
- Email-Infrastruktur (Resend, notena.app, 10/10 mail-tester)
- Halbjahr-Wechsler im Header + Einstellungen
- Passwort ändern / Account löschen in Einstellungen
- Impressum / Datenschutz / AGB — rechtlich geprüft und live
- PWA-Manifest, Icons, OG-Image, Favicon, Offline-Page
- Feedback-Button, Sentry-Integration, LK-Doppelgewichtung
- Stundenplan, Aufgaben, Pro-Page, Warteliste, What-If

---

## EMPFEHLUNG HEUTE

**Leaked Password Protection in Supabase aktivieren — 5 Minuten, direkt im Dashboard.**
Geh auf: https://supabase.com/dashboard/project/rxmcexzlwocgfocyligd/auth/security
Dort "Enable leaked password protection" aktivieren.
Das ist der letzte offene Security-Punkt — danach ist alles launch-ready.
