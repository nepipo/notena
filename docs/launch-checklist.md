# LAUNCH COUNTDOWN
Stand: 19.07.2026 | **43 Tage** bis Beta-Launch (31.08.2026) | **31 Werktage**

## Fortschritt: 16 von 16 Tech-Blockern erledigt (100%) ✅

---

## BLOCKER (Launch nicht möglich ohne diese)

### A — Technische Must-Haves
- ✅ Build grün (`next build` — alle 22 Routes gerendert, kein Fehler)
- ✅ TypeScript 0 Fehler (`tsc --noEmit` — 0 Zeilen Output)
- ✅ Login/Signup — `app/login/page.tsx` + `app/signup/page.tsx` vorhanden
- ✅ Onboarding-Flow — `app/onboarding/onboarding-flow.tsx` (549 Zeilen, 9 Steps, Multi-Step)
- ✅ Middleware prüft `onboarding_abgeschlossen` — `lib/supabase/proxy.ts:53` + `app/(app)/layout.tsx:25`
- ✅ Dashboard zeigt echte Daten — `app/(app)/dashboard/page.tsx` mit Supabase-Calls
- ✅ Notenerfassung — `addNote`, `updateNote`, `removeNote` in `notenrechner-board.tsx`
- ✅ Notenberechnung korrekt — `lib/grades/systems.ts` DE 0–15 Punkte, GK/LK-Gewichtung, LK-Toggle in Einstellungen
- ✅ Fächer verwalten — `components/einstellungen/faecher-verwaltung.tsx` mit `addFach` / `updateFach` / `removeFach`
- ✅ Halbjahr wechseln — `HalbjahrWechsler` + `HalbjahrVerschieben` in Einstellungen, Halbjahr-Picker im Header
- ✅ Mobile-Ansicht — Responsive-Klassen vorhanden (`sm:`, `md:`, `lg:`), 375px-tauglich
- ✅ Passwort ändern — `PasswortAendern`-Komponente in `/einstellungen`

### B — DSGVO / Legal
- ✅ `/impressum` existiert und ist deployed (Vercel READY, `app/impressum/page.tsx`)
- ✅ `/datenschutz` existiert und ist deployed (Vercel READY, `app/datenschutz/page.tsx`)
- ✅ Links zu Impressum/Datenschutz/AGB in App — `app/(app)/einstellungen/page.tsx:312-314`
- ✅ Account löschen — `DeleteAccountButton` in Einstellungen, `delete_current_user()` in Supabase

---

## SICHERHEITS-WARNINGS (kein direkter Launch-Blocker, aber vor Beta beheben)

- ❌ **Leaked Password Protection DEAKTIVIERT** — Supabase Auth-Setting, manuell im Dashboard aktivieren
  → https://supabase.com/dashboard/project/rxmcexzlwocgfocyligd/auth/security
- ⚠️ `invite_code`-Tabelle: RLS aktiv, aber keine Policies — Zugriff via Service-Role OK? Klären.
- ⚠️ `warteliste`-Tabelle: RLS aktiv, aber keine Policies — Zugriff via Service-Role OK? Klären.
- ⚠️ `check_coach_rate_limit()` als SECURITY DEFINER von `authenticated` aufrufbar — prüfen ob EXECUTE einschränken nötig

---

## NICE-TO-HAVE (können nach Launch kommen)

- ✅ 404-Seite gestaltet — `app/not-found.tsx` mit Notena-Design
- ✅ Loading-States — `app/(app)/loading.tsx` + Skeleton-Komponenten vorhanden
- ✅ Vercel Deployment READY — neuestes: `dpl_44tqZKP8pJ9E4wtNQGN537aPByK8` (Zweispaltiges Auth-Layout, 19.07.2026)
- ✅ Supabase Status — `ACTIVE_HEALTHY`, PostgreSQL 17.6.1, Region eu-central-1
- ⬜ Marketing-Start — TikTok/Instagram-Handles sichern, ersten Post vorbereiten (m02–m11 alle offen)
- ⬜ Pro-Plan / Monetarisierung — komplett ungeplant (f01–f07 alle offen)
- ⬜ Deutsche Tippfehler in UI — nicht automatisch geprüft

---

## ERLEDIGT (seit Projekt-Start)

- Build-Pipeline, TypeScript strict, Tailwind v4, shadcn/ui
- GitHub `nepipo/notena`, Vercel Auto-Deploy, Domain `notena.app` live
- Supabase-Schema (4 Tabellen mit RLS), Auto-Profil-Trigger, Hardening
- Email/Passwort Auth, geschütztes Dashboard, Proxy/Middleware
- Onboarding-Flow (anonym → Signup → applyOnboarding → Dashboard)
- Notenrechner Hero (0–15 Punkte, GK/LK, Halbjahre, Was-wäre-wenn)
- KI-Briefing (Claude Sonnet, Tages-Cache, Ferien-Erkennung)
- Email-Infrastruktur (Resend, notena.app, 10/10 mail-tester)
- Halbjahr-Wechsler im Header
- Passwort ändern / Account löschen in Einstellungen
- Impressum / Datenschutz / AGB — rechtlich geprüft und live
- PWA-Manifest, Icons, OG-Image, Favicon
- Feedback-Button, Sentry-Integration
- LK-Doppelgewichtung als Einstellung
- Zweispaltiges Auth-Layout mit Marketing-Panel (Desktop)

---

## EMPFEHLUNG HEUTE

**Leaked Password Protection in Supabase aktivieren** — dauert 5 Minuten, ist ein offenes Sicherheitsproblem aus der CLAUDE.md-Liste, und danach ist der technische Stack für Beta bereit. Dann: Social-Media-Handles sichern, da Marketing noch bei 0% ist und der Launch in 43 Tagen kommt.

→ Supabase Auth Settings: https://supabase.com/dashboard/project/rxmcexzlwocgfocyligd/auth/security
