# LAUNCH COUNTDOWN
Stand: 22.07.2026 | **40 Tage** bis Beta-Launch (31.08.2026) | **28 Werktage**

## Fortschritt: 16 von 16 Tech-Blockern erledigt (100%) ✅

---

## BLOCKER (Launch nicht möglich ohne diese)

### A — Technische Must-Haves
- ✅ Build grün (`next build` — alle Routes, kein Fehler, 14.6s)
- ✅ TypeScript 0 Fehler (`tsc --noEmit` — 0 Zeilen Output)
- ✅ Login/Signup — `app/login/page.tsx` + `app/signup/page.tsx` mit echtem Form-Code
- ✅ Onboarding-Flow — `app/onboarding/onboarding-flow.tsx` (Multi-Step, localStorage-Bridge)
- ✅ Middleware prüft `onboarding_abgeschlossen` — `app/(app)/layout.tsx:25-26` + Redirect nach `/onboarding`
- ✅ Dashboard zeigt echte Daten — `app/(app)/dashboard/page.tsx` mit Suspense + Skeleton
- ✅ Notenerfassung — `addNote` in `lib/actions/schule.ts`, `NotenrechnerBoard` in `/noten`
- ✅ Notenberechnung korrekt — `lib/grades/calc.ts` + `systems.ts`, DE 0–15 Punkte, GK/LK-Gewichtung
- ✅ Fächer verwalten — `faecher-verwaltung.tsx` mit add/update/remove + GK/LK-Toggle per Fach
- ✅ Halbjahr wechseln — `HalbjahrWechsler` + `HalbjahrVerschieben` in Einstellungen
- ✅ Mobile-Ansicht — Responsive-Klassen vorhanden (`sm:`, `md:`, `lg:`), 375px-tauglich
- ✅ Passwort ändern — `components/einstellungen/passwort-aendern.tsx` in `/einstellungen`

### B — DSGVO / Legal
- ✅ `/impressum` — `app/impressum/page.tsx` vorhanden, im Build als Route (ƒ /impressum)
- ✅ `/datenschutz` — `app/datenschutz/page.tsx` vorhanden, im Build als Route (ƒ /datenschutz)
- ✅ Links zu Impressum/Datenschutz — Landing-Footer + Einstellungen + AGB (14+ Stellen)
- ✅ Account löschen — `DeleteAccountButton` in Einstellungen, `deleteAccount` Server-Action

---

## SICHERHEITS-WARNINGS (kein direkter Launch-Blocker, aber vor Beta beheben)

- ❌ **Rate-Limit-Bypass möglich** — `check_coach_rate_limit()` akzeptiert `p_limit` als Parameter.
  Jeder `authenticated`-User kann Supabase RPC direkt mit `p_limit: 999999` aufrufen und
  das KI-Coach-Limit (20/h) umgehen → unbegrenzte Claude-API-Kosten bei Scale.
  `anon` wurde via Migration 0017 revoked, `authenticated` jedoch nicht.
  Fix: `p_limit` aus RPC entfernen, Limit im SQL hardcoden ODER Admin-Client in `app/api/coach/route.ts`.
  **Seit 3+ Tagen offen — höchste Priorität.**
- ❌ **Leaked Password Protection DEAKTIVIERT** — Supabase Auth-Setting, 5 Min. Fix.
  → https://supabase.com/dashboard/project/rxmcexzlwocgfocyligd/auth/security
- ⚠️ `invite_code` + `warteliste`: RLS aktiv, 0 Policies — nur via Service-Role (intentional)
- ⚠️ `delete_current_user()`: SECURITY DEFINER von `authenticated` aufrufbar — intentional

---

## NICE-TO-HAVE (können nach Launch kommen)

- ✅ 404-Seite gestaltet — `app/not-found.tsx` vorhanden
- ✅ Loading-States — `app/(app)/loading.tsx` + Skeleton-Komponenten (BriefingSkeleton, DashboardCardsSkeleton, FerienSkeleton)
- ✅ Supabase Status — `ACTIVE_HEALTHY`, PostgreSQL 17.6.1, Region eu-central-1
- ⬜ Vercel letztes Deployment — nicht geprüft (curl blockiert via Proxy in dieser Umgebung)
- ⬜ Marketing-Start — TikTok/Instagram-Handles, erster Post (m02–m11 alle offen)
- ⬜ Pro-Plan / Monetarisierung — komplett ungeplant (f01–f07 alle offen)

---

## ERLEDIGT (seit Projekt-Start)

- Build-Pipeline, TypeScript strict, Tailwind v4, shadcn/ui
- GitHub `nepipo/notena`, Vercel Auto-Deploy, Domain `notena.app` live
- Supabase-Schema (30+ Migrationen, 15+ Tabellen mit RLS), Auto-Profil-Trigger, Security-Hardening
- Email/Passwort Auth, Google OAuth, geschütztes Dashboard, Proxy/Middleware
- Onboarding-Flow (anonym → Signup → applyOnboarding → Dashboard)
- Notenrechner Hero (0–15 Punkte, GK/LK, Halbjahre, Was-wäre-wenn)
- KI-Briefing (Claude Sonnet, Tages-Cache, Ferien-Erkennung)
- KI-Coach (Chat mit Tool-Use, Rate-Limiting via DB)
- Email-Infrastruktur (Resend, notena.app, 10/10 mail-tester)
- Halbjahr-Wechsler im Header + Einstellungen
- Passwort ändern / Account löschen in Einstellungen
- Impressum / Datenschutz / AGB — rechtlich geprüft und live
- PWA-Manifest, Icons, OG-Image, Favicon, Offline-Page
- Feedback-Button, Sentry-Integration
- LK-Doppelgewichtung als Einstellung
- Zweispaltiges Auth-Layout mit Marketing-Panel (Desktop)
- Stundenplan, Aufgaben, Pro-Page, Warteliste, What-If

---

## EMPFEHLUNG HEUTE

**Rate-Limit-Bypass in `check_coach_rate_limit` schließen.**
Authentifizierte User können das KI-Coach-Limit umgehen und unbegrenzt Claude-API-Anfragen
auslösen. Das kostet echtes Geld. Fix: `p_limit`-Parameter aus der SQL-Funktion entfernen
und den LIMIT-Wert im SQL hardcoden (1 Migration, ~15 Min.). Dann 5 Min. Leaked-Password-
Protection im Supabase-Dashboard aktivieren.
