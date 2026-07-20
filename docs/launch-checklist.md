# LAUNCH COUNTDOWN
Stand: 20.07.2026 | **42 Tage** bis Beta-Launch (31.08.2026) | **31 Werktage**

## Fortschritt: 16 von 16 Tech-Blockern erledigt (100%) ✅

---

## BLOCKER (Launch nicht möglich ohne diese)

### A — Technische Must-Haves
- ✅ Build grün (`next build` — compiled in 10.4s, alle Routes, kein Fehler)
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
- ✅ Links zu Impressum/Datenschutz/AGB in App — `app/(app)/einstellungen/page.tsx:312–314`
- ✅ Account löschen — `DeleteAccountButton` in Einstellungen, `delete_current_user()` in Supabase

---

## SICHERHEITS-WARNINGS (kein direkter Launch-Blocker, aber vor Beta beheben)

- ❌ **Leaked Password Protection DEAKTIVIERT** — Supabase Auth-Setting, manuell im Dashboard aktivieren
  → https://supabase.com/dashboard/project/rxmcexzlwocgfocyligd/auth/security
- ❌ **Rate-Limit-Bypass möglich** — `check_coach_rate_limit()` ist als SECURITY DEFINER von jedem
  `authenticated`-User via REST aufrufbar (`/rest/v1/rpc/check_coach_rate_limit`). Da `p_limit`
  ein Parameter ist, kann ein User das Limit mit `{"p_limit": 999999}` umgehen.
  Fix: Admin-Client in `app/api/coach/route.ts` für Rate-Limit nutzen + user_id als Parameter übergeben
  + EXECUTE für `authenticated` revoken. Siehe Prompt-Block unten.
- ⚠️ `invite_code`-Tabelle: RLS aktiv, keine Policies — Zugriff nur via Service-Role (vermutlich OK)
- ⚠️ `warteliste`-Tabelle: RLS aktiv, keine Policies — Zugriff nur via Service-Role (vermutlich OK)
- ⚠️ `delete_current_user()`: SECURITY DEFINER von `authenticated` aufrufbar — intentional (Account-Löschung)

---

## NICE-TO-HAVE (können nach Launch kommen)

- ✅ 404-Seite gestaltet — `app/not-found.tsx` mit Notena-Design
- ✅ Loading-States — `app/(app)/loading.tsx` + Skeleton-Komponenten (6 Verwendungen)
- ✅ Vercel Deployment — Auto-Deploy via GitHub, letzter Commit `aedeb44` heute
- ✅ Supabase Status — `ACTIVE_HEALTHY`, PostgreSQL 17.6.1, Region eu-central-1
- ⬜ Leaked Password Protection aktivieren (5 Min. Aufwand — manuell im Supabase-Dashboard)
- ⬜ Marketing-Start — TikTok/Instagram-Handles sichern, ersten Post vorbereiten (m02–m11 alle offen)
- ⬜ Pro-Plan / Monetarisierung — komplett ungeplant (f01–f07 alle offen)
- ⬜ Deutsche Tippfehler in UI — nicht automatisch geprüft

---

## ERLEDIGT (seit Projekt-Start)

- Build-Pipeline, TypeScript strict, Tailwind v4, shadcn/ui
- GitHub `nepipo/notena`, Vercel Auto-Deploy, Domain `notena.app` live
- Supabase-Schema (Tabellen mit RLS), Auto-Profil-Trigger, Hardening
- Email/Passwort Auth, Google OAuth, geschütztes Dashboard, Proxy/Middleware
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

**Rate-Limit-Bypass in `check_coach_rate_limit` fixen** — ein authentifizierter User kann aktuell das
KI-Coach-Limit (20 Anfragen/Stunde) umgehen, indem er die Supabase-RPC direkt mit `p_limit: 999999`
aufruft. Das kostet echtes Geld bei Scale. Fix ist ~30 Minuten Arbeit (Admin-Client + Migration).
Danach noch 5 Minuten: Leaked Password Protection im Supabase-Dashboard aktivieren.
