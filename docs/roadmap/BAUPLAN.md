# Project X — Bauplan & To-Do-Tracker

**Launch:** 13.08.2026  
**Stand:** 03.07.2026  
**Fortschritt:** 15 / 67 Tasks erledigt

> Diese Datei ist mein (Claudes) Gedächtnis für den Projektfortschritt.  
> Wenn Nepomuk fragt "was ist als nächstes?" — hier nachschauen.  
> `state.js` im selben Ordner wird parallel mitgepflegt (Dashboard auto-check).

---

## ✅ Beta-Erfolgskriterien — 13.08.2026

> Wenn alle 5 grün: Runde 2 mit 50+ Usern starten.

| # | Kriterium | Ziel | Wie messen |
|---|-----------|------|------------|
| 1 | Signups | ≥ 15 / 20 Eingeladene | Supabase → `nutzer_profil` → Zeilen mit `created_at > 13.08.` |
| 2 | Onboarding | ≥ 12 completen | Supabase → `nutzer_profil` → Filter `onboarding_completed = true` |
| 3 | Retention | ≥ 10 aktiv nach 14 Tagen | Supabase → `nutzer_profil` → Filter `last_seen_at > 27.08.` (Migration k04, W6) |
| 4 | Pro-Conversions | ≥ 3 zahlende User | LemonSqueezy Dashboard → Subscriptions |
| 5 | Feedback | ≥ 10 ausgefüllte Tally-Forms | Tally.so Dashboard |

**"Aktiver User"** = mindestens 1 Login + 1 Noten-Aktion (Note hinzufügen/bearbeiten oder Notenrechner aufrufen) in den letzten 7 Tagen.

**Review-Termin:** 27.08.2026 — Zahlen auswerten, Learnings dokumentieren, nächsten Sprint planen.

---

## ⚡ Was als nächstes — Offene Blocker

Sortiert nach Deadline:

- [x] `c01` Onboarding: Migration 0005 auf Supabase anwenden ✅ (war bereits angewendet)
- [x] `c02` Onboarding-Flow: UI fertigstellen ✅ (alle 9 Steps vollständig implementiert)
- [ ] `u01` **Onboarding: iPhone Safari + Chrome testen** ← 24.06 · BLOCKER (manuell)
- [ ] `m01` **App-Namen final entscheiden + Social Handles sichern** ← 24.06 · BLOCKER (manuell)
- [ ] `f01` **Mit Vater: Kleinunternehmer §19 UStG klären** ← 24.06 · BLOCKER (manuell)
- [x] `r01` Impressum: Adresse eingetragen ✅ (Moritz-Kolja Polonius, Osterbekstraße 90b, 22083 Hamburg)
- [x] `r02` Datenschutzerklärung ✅ (vollständig, nur Adress-Platzhalter wie r01)
- [x] `r03` AGB inkl. Widerrufsbelehrung ✅ (unter /agb, 13 Abschnitte, Minderjährige + Widerruf drin)
- [x] `r04` §312j BGB Button-Text ✅ (Worktree: "Zahlungspflichtig abonnieren")
- [x] `r05` Datenschutz + Impressum in Einstellungen verlinkt ✅
- [ ] `c19` **Final Bug-Bash + Regression-Test** ← 12.08 · BLOCKER
- [ ] `m11` **Beta-Einladungen rausschicken** ← 12.08 · BLOCKER
- [ ] `g08` **Launch-Checklist: alle Blocker grün** ← 12.08 · BLOCKER

---

## Woche 1 (18.–24.06) — Onboarding & Name

**0 / 6 Tasks**

**💻 Coding**
- [x] `c01` Onboarding-Flow: Migration 0005 auf Supabase anwenden ✅
- [x] `c02` Onboarding-Flow: UI fertigstellen (alle 9 Steps) ✅
- [ ] `c03` Onboarding: iPhone Safari + Chrome testen ← 24.06

**📱 Marketing**
- [ ] `m01` App-Namen final entscheiden + Social Handles sichern ← 24.06 🚨 BLOCKER

**💶 Finanzen**
- [ ] `f01` Mit Vater: Kleinunternehmer §19 UStG klären + rechtliche Rolle ← 24.06 🚨 BLOCKER

**✨ UX & Onboarding**
- [ ] `u01` Onboarding: alle 3 Screens auf iPhone testen (Safari + Chrome) ← 24.06 🚨 BLOCKER

---

## Woche 2 (25.06.–01.07) — Briefing Setup

**0 / 9 Tasks**

**💻 Coding**
- [ ] `c04` Briefing: Claude API Integration (Sonnet 4.6) ← 01.07
- [ ] `c05` Briefing: Daily Cron + briefing_cache Tabelle nutzen ← 01.07

**📱 Marketing**
- [ ] `m02` TikTok-Account anlegen + Bio + erstes Format planen ← 01.07
- [ ] `m03` Instagram-Account anlegen (gleiches Handle wie TikTok) ← 01.07

**💶 Finanzen**
- [ ] `f02` LemonSqueezy Account anlegen (unter Vaters Daten) ← 01.07
- [ ] `f03` Bankkonto bei LemonSqueezy für Payouts verknüpfen ← 01.07

**⚖️ Recht**
- [ ] `r01` Impressum: Adresse eintragen (Vaters Name + Anschrift) ← 01.07 🚨 BLOCKER

**✨ UX & Onboarding**
- [ ] `u02` Profil-Edit-Seite (/einstellungen/profil) mit allen Onboarding-Feldern ← 01.07

**🗂️ General**
- [ ] `g01` Domain kaufen (app-name.de oder .app) + auf Vercel verbinden ← 01.07
- [ ] `g02` Leaked-Password-Protection in Supabase Auth aktivieren ← 01.07
- [ ] `g03` Vercel Analytics aktivieren (Free Tier, cookiefrei) ← 01.07

---

## Woche 3 (02.–08.07) — KI-Coach

**0 / 8 Tasks**

**💻 Coding**
- [ ] `c06` KI-Coach: Chat-Interface UI (/coach Route) ← 08.07
- [ ] `c07` KI-Coach: Streaming-Antworten (Edge Function) ← 08.07
- [ ] `c08` KI-Coach: Rate-Limiting via DB (coach_rate_limit vorhanden) ← 08.07

**📱 Marketing**
- [ ] `m04` 4-Wochen Content-Plan vor Launch schreiben (Themen + Rhythmus) ← 08.07

**💶 Finanzen**
- [ ] `f04` Produkte in LemonSqueezy anlegen (3 Pläne: Woche/Monat/Jahr) ← 08.07

**⚖️ Recht**
- [x] `r02` Datenschutzerklärung ✅ (vollständig unter /datenschutz)

**✨ UX & Onboarding**
- [x] `u03` Empty States: Dashboard + Noten-Seite für neue User ohne Daten ← 08.07

**🗂️ General**
- [ ] `g04` Sentry Error-Tracking aktivieren (Free Tier) ← 08.07
- [ ] `g05` Favicon + PWA-Icons finalisieren (alle Größen, 512×512) ← 08.07

---

## Woche 4 (09.–15.07) — Pro-Monetarisierung

**3 / 7 Tasks** · ✅ Code vorab erledigt (19.06), liegt im Worktree-Branch `worktree-feat+pro-monetarisierung` — noch nicht gemergt/live. Migration `0019` ist auf Supabase angewendet.

**💻 Coding**
- [x] `c09` Pro: LemonSqueezy JS SDK integrieren ← 15.07 — **ohne SDK gelöst** (direkte Checkout-URLs + `node:crypto`-Webhook, kein npm-Paket nötig)
- [x] `c10` Pro: Checkout-Flow (Pricing Page → LS Overlay) ← 15.07 — `/pro` Pricing-Page + Checkout-Button
- [x] `c11` Pro: Webhook Handler (LS Event → nutzer_profil.plan update) ← 15.07 — `/api/webhooks/lemonsqueezy` mit HMAC-Verify

**💶 Finanzen**
- [ ] `f05` Kleinunternehmer-Status beim Finanzamt anmelden (ELSTER) ← 15.07

**⚖️ Recht**
- [ ] `r03` AGB schreiben inkl. Widerrufsbelehrung (14 Tage) ← 15.07 🚨 BLOCKER
- [ ] `r04` §312j BGB Button-Text: "Kostenpflichtig bestellen — 4,99€/Monat" ← 15.07 🚨 BLOCKER

**✨ UX & Onboarding**
- [x] `u04` Welcome-Mail nach Signup (Resend, kurz + on-brand) ← 15.07

---

## Woche 5 (16.–22.07) — Feature-Gates

**3 / 8 Tasks** · ✅ Pro-Code vorab erledigt (19.06, Worktree-Branch)

**💻 Coding**
- [x] `c12` Pro: Feature-Gates (useProFeature Hook / Middleware) ← 22.07 — `istPro()`-Helper + serverseitiges Gating (Coach 402, Briefing)
- [x] `c13` Pro: Pricing-Page + Upgrade-Modal in App ← 22.07 — `/pro` + `UpgradePrompt`-Komponente

**📱 Marketing**
- [ ] `m05` Erste 3 Build-in-Public TikToks drehen und posten ← 22.07
- [ ] `m06` Beta-Tester-Liste: 20 Personen aus Schule + Freundeskreis ← 22.07

**💶 Finanzen**
- [ ] `f06` Test-Zahlung durchführen (eigene Karte → eigenes Konto) ← 22.07

**⚖️ Recht**
- [ ] `r05` Datenschutz + Impressum + AGB in App verlinken (Footer + Einstellungen) ← 22.07
- [ ] `r06` Cookie-/Consent-Pflicht prüfen (Plausible = cookiefrei → OK?) ← 22.07

**✨ UX & Onboarding**
- [x] `u05` 404 + 500 Error-Pages designen (on-brand, nicht Next.js-Default) ← erledigt 03.07

---

## Woche 6 (23.–29.07) — OAuth & i18n

**0 / 6 Tasks**

**💻 Coding**
- [ ] `c14` Google OAuth: Provider in Supabase + Google Cloud konfigurieren ← 29.07
- [ ] `c15` i18n: next-intl Setup + EN/DE-Routing ← 29.07
- [ ] `c16` Pro: PDF-Report (Notenübersicht, nur Pro) ← 29.07

**💶 Finanzen**
- [ ] `f07` Steuern-Rücklage-Plan: 19% zurücklegen ab erstem Euro ← 29.07

**📱 Marketing**
- [ ] `m07` Influencer-Longlist: 10+ Student-YouTuber + Schüler-Accounts ← 29.07

**🗂️ General**
- [ ] `g06` OG-Image für Social Sharing erstellen (1200×630px) ← 29.07

---

## Woche 7 (30.07.–05.08) — Beta-Prep

**0 / 7 Tasks**

**💻 Coding**
- [ ] `c17` i18n: alle UI-Strings ins Englische übersetzen ← 05.08

**📱 Marketing**
- [ ] `m08` DM-Templates schreiben (3 Varianten für Kooperations-Outreach) ← 05.08
- [ ] `m09` Erste 5 Influencer kontaktieren ← 05.08

**✨ UX & Onboarding**
- [ ] `u06` App-Namen final in UI einsetzen (PWA-Name, Loading Screen, OG-Tags) ← 01.08
- [ ] `u07` Landing Page polishen für Launch (CTA, Screenshots, Pricing-Block) ← 05.08
- [ ] `u08` Produkt-Screenshots erstellen (iPhone Mockup, 3 Key-Screens) ← 05.08

**🗂️ General**
- [ ] `g07` Beta-Feedback-Kanal einrichten (Tally-Formular oder Discord) ← 05.08

---

## Woche 8 (06.–12.08) — Launch-Ready

**0 / 5 Tasks**

**💻 Coding**
- [ ] `c18` Performance-Audit: Core Web Vitals + Lighthouse ← 11.08
- [ ] `c19` Final Bug-Bash + Regression-Test aller Core-Features ← 12.08 🚨 BLOCKER

**📱 Marketing**
- [ ] `m10` Launch-TikTok + Reel drehen und terminieren ← 12.08
- [ ] `m11` Beta-Einladungen rausschicken (persönlich + Email) ← 12.08 🚨 BLOCKER

**🗂️ General**
- [ ] `g08` Launch-Checklist: alle Blocker grün, alle Core-Screens manuell testen ← 12.08 🚨 BLOCKER

---

## 🚀 Launch — 13.08.2026

- [ ] `g09` App live schalten, erste Beta-Einladungen versenden
- [ ] `k06` Baseline Day-1 messen: Signups, Sessions, Fehler-Rate, erste Aktivitäten
- [ ] `k07` Post-Beta-Review-Termin setzen: 27.08. — Zahlen auswerten, Learnings, nächster Sprint

---

## Woche 5–8 Ergänzung: Metriken & KPIs

> Ohne klare Erfolgskriterien weißt du am 14.08. nicht ob der Launch gut war.

**Woche 5 (22.07)**
- [ ] `k01` Beta-Erfolgskriterien definieren: Wie viele aktive User = Erfolg? Welche Retention-Rate?
- [ ] `k02` "Aktiver User" definieren: z.B. Login + mind. 1 Noten-Aktion in letzten 7 Tagen

**Woche 6 (29.07)**
- [ ] `k03` KPI-Tracker anlegen: einfaches Spreadsheet für Beta-Woche (Signups, DAU, Pro-Conversions)
- [ ] `k04` Retention-Messung: wie kommen User nach 7 + 14 Tagen zurück? (Vercel Analytics + manuell)

**Woche 7 (05.08)**
- [ ] `k05` Pro-Conversion-Funnel tracken: Pricing-Page-Views → Klicks → Käufe (LemonSqueezy Dashboard)

**Launch (13.08)**
- [ ] `k06` Baseline Day-1 messen: Signups, Sessions, Fehler-Rate, erste Aktivitäten
- [ ] `k07` Post-Beta-Review-Termin setzen: 27.08. — Zahlen auswerten, Learnings, nächster Sprint

---

## Übersicht nach Abteilung

| Abteilung | Total | Erledigt |
|-----------|-------|----------|
| 💻 Coding | 19 | 5 |
| 📱 Marketing | 11 | 0 |
| 💶 Finanzen | 7 | 0 |
| ⚖️ Recht | 6 | 0 |
| ✨ UX & Onboarding | 8 | 0 |
| 🗂️ General | 9 | 0 |
| 📊 Metriken & KPIs | 7 | 0 |
| **Gesamt** | **67** | **5** |

---

*Dieses Dokument und `state.js` werden von Claude synchron gehalten.*  
*`state.js` → Dashboard auto-check | `BAUPLAN.md` → Claude-Kontext*
