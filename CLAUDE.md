# Project X — System-Verankerung

*Diese Datei wird in jeden Claude-Code-Chat dieses Projekts geladen. Sie definiert die Marschrichtung.*

**Stand:** 18.06.2026
**Arbeitstitel:** Project X (finaler Name kommt vor Launch)

### Fortschritt
- **Phase 0 (Setup):** ✅ Next.js 16 + TS + Tailwind v4, GitHub (`nepipo/project-x`), Vercel Auto-Deploy, Supabase Frankfurt (`rxmcexzlwocgfocyligd`), Theme (Azurblau/Indigo, Fonts, shadcn/ui), Showcase-Startseite.
- **Phase 1 (Auth):** ✅ Supabase Auth — Email/Passwort-Login + Signup, geschütztes Dashboard, Proxy (Next.js 16 `proxy.ts`) mit `getClaims()`. Google-OAuth im Code vorbereitet (Provider-Config offen). Apple bewusst später (€99/Jahr).
- **DB-Schema:** ✅ Angewendet auf Supabase (`0001_initial_schema`). 4 Tabellen mit RLS: `nutzer_profil`, `schule_fach`, `schule_note`, `schule_klausur`. Auto-Profil-Trigger `on_auth_user_created`. TS-Types in `lib/supabase/database.types.ts`. Hardening (`0002_harden_handle_new_user`): RPC-Zugriff auf den Trigger-Helper entzogen.
- **Onboarding:** ✅ Anonymer Flow **vor** Registrierung (8 Mini-Steps, `localStorage`-Bridge → `applyOnboarding()`), Migration `0005_onboarding_profil_felder`. Siehe §11. Live-Test der E-Mail-Bestätigungs-Bridge steht noch aus.
- **Offen:** Google-Provider in Supabase + Google Cloud konfigurieren · Leaked-Password-Protection in Supabase Auth aktivieren · Notenrechner-UI fürs eingeloggte Dashboard (statt nur public Demo) · Onboarding-Felder in `/einstellungen/profil` editierbar machen.
- **Live:** https://project-x-seven-tawny.vercel.app

---

## 1. Wer Nepomuk ist

17, Hamburg, Gymnasium 11. Klasse. Junger Gründer mit dem Ziel, das nächste große Unternehmen zu bauen. Denkt groß, arbeitet in Sprints, braucht einen Partner der ihn on speed hält UND ihn stoppt wenn er Bullshit baut.

**Motivation:** 1. Finanzielle Freiheit. 2. Anerkennung. 3. Reichweite/Impact. 4. Skills aufbauen. 5. Spaß am Bauen.

**Zeit:** Schwankend (0–6h pro Tag). Schule + Klausuren haben Vorrang.
**Budget:** 10–20€/Monat für Tools/APIs. Höher wenn klarer ROI.

---

## 2. Was Project X ist

**Eine SaaS-App für ambitionierte Oberstufen-Schüler (Klasse 11–13 in Deutschland) — Notenrechner + Schul-Cockpit + tägliches Briefing.**

**MVP-Hero:** Notenrechner (0–15 Punkte System, Halbjahre, Fächer-Konfig pro User). Das ist der Anker — wenn das landet, erweitern wir.

**Zielgruppe Persona 1 — "Ambitionierter Schüler":**
- 10–18 Jahre, Klasse 5–13
- Hat Side-Projects oder will eines starten
- Liest Hormozi/Naval, folgt Gründer-Accounts auf Insta/TikTok
- Will sich tracken aber alle bisherigen Apps sind für 30-Jährige
- Bezahlt 3–5€/Monat wenn das Produkt wirklich seinen Tag besser macht

**Markt:** ~50–100k in Deutschland. Klein, aber hoch-LTV, Influencer-Multiplikatoren.

**Marketing-Strategie:**
- Nepomuk postet auf TikTok/Instagram (Build-in-Public)
- Influencer-Kooperationen mit Student-YouTubern
- Schule + Freundeskreis als Closed Beta

**Pricing-Vision:** Komplett Free zum Start. Premium-Features (KI-Coach, Briefing-Audio, mehr Module) für 3–5€/Monat ab v1.0.

---

## 3. Tech-Stack (final, nicht verhandelbar)

- **Frontend:** Next.js 16 App Router + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth + Postgres + Storage)
- **Hosting:** Vercel
- **Mobile:** PWA first (installierbar via Homescreen) → später Capacitor für App Stores
- **Auth:** Email + Passwort + Google + Apple OAuth (Multi-User ab Tag 1)
- **KI:** Claude API (Sonnet 4.6 für Briefing, Haiku 4.5 für Klassifikation)
- **Sprache Code:** TypeScript strict
- **Sprache UI:** Deutsch
- **Theme:** Dark Mode default, Azurblau (#1da1ff) + Indigo Akzente (aus Mockup v4 abgeleitet)

---

## 4. Design-Prinzipien

**Vibe:** Premium Performance / Future Founder. Schwarz mit kräftigen Akzenten in Azurblau (#1da1ff) + Indigo. Animationen lebendig aber ruhig (statischer Glow, Number-Counter, Hover-Lift, Stagger-Reveal — KEIN driftender Background, das nervt).

**Layouts:** Mobile-first. Drei Form-Factor-Versionen:
- Handy (≤ 480px) — Single-column stack
- iPad (480–1024px) — 2-Spalten-Grid
- Mac (≥ 1024px) — 3-Spalten-Grid mit Sidebar

**Typografie:**
- Display: Bricolage Grotesque (variable, characterful)
- Body: Onest (modern clean)
- Mono: JetBrains Mono (für Daten/Labels)

**Animationen:** lieber zu viel als zu wenig. Page-Load Stagger-Reveal, Number Counter auf Reveal, Background-Glow shift, Hover-Lift auf Karten, Live-Clock, Pulse, Floating Particles.

**Referenz-Mockup:** `~/Desktop/mockups/4_responsive_playground.html` (alle Layouts + Theme-Toggle + 7 Akzentfarben live umschaltbar)

---

## 5. Wie Claude in diesem Projekt arbeitet

### Sprache & Ton
- **Immer auf Deutsch.** Umlaute (ä, ö, ü), nicht ae/oe/ue.
- Du kannst Nepomuk duzen.
- Direkter Kumpel-Ton, kein Konzernsprech, keine Buzzwords.
- Bei schlechten Ideen: sofort und direkt sagen "Das ist Bullshit, weil…"

### Workflow-Regeln
- **Bei größeren Features:** Erst `brainstorming` Skill nutzen (Anforderungen klären), dann `writing-plans` (Plan schreiben), dann `executing-plans` (umsetzen).
- **Bei Bugs:** Erst `systematic-debugging` Skill nutzen, dann Fix.
- **Vor Code-Push:** `verification-before-completion` (Build durchläuft, Tests grün).
- **Bei UI/Design:** `frontend-design` + `ui-styling` + `design-system` Skills.

### Hard Rules
- Git: Konventionelle Commit-Messages (`feat:`, `fix:`, `chore:` etc.)
- npm install: NIE ohne vorher zu fragen
- Externe API-Calls mit Kosten: Kosten nennen, bevor ausgeführt wird
- Sensible Daten (Passwörter, API-Keys): NIE in Code committen, immer .env + .gitignore
- Bei Unsicherheit: erst fragen, nie raten

### Ehrliche Tensions (immer spiegeln)
- **1-Jahres-Horizont vs. 12-Wochen-MVP-Plan** — wenn Scope explodiert, stoppen
- **Build-in-Public vs. Schul-Klausuren** — wenn Klausuren kommen, Sprint runterfahren
- **Persönliches Tool vs. Produkt** — wenn ein Feature nur Nepomuk nutzt, raus

---

## 6. Timeline (12 Wochen, Ende August 2026 = Beta-Launch)

- **Woche 1:** Setup (Repo, Vercel, Supabase, Tailwind-Theme, CLAUDE.md)
- **Woche 2–3:** Foundation (Auth-Flow, User Profile, Dashboard-Shell, Onboarding)
- **Woche 4–6:** Schule Core MVP (Klausuren, Noten, Notenrechner-Hero, Halbjahres-System)
- **Woche 7–8:** Mobile-First Polish (Responsive, PWA, Web Push)
- **Woche 9–10:** Briefing + KI Coach (Daily Briefing, Chat mit Claude, Insights)
- **Woche 11–12:** Beta-Launch Prep (Sign-up Flow, Onboarding-Polish, Landing Page, Marketing-Material)

→ **Closed Beta:** Ende August 2026, erste echte User aus Nepomuks Umfeld — aber die App ist von Tag 1 für 100.000 User gebaut.

---

## 7. Verbindung zum alten Repo

Project X ist **getrennt** vom `lebens-automatismus` Repo (Nepomuks privates Tool). Sie können sich Code-Patterns teilen aber **keine DB-Tabellen, keine Auth, keine Vercel-Org**.

Das alte Repo bleibt für Nepomuks tägliches Leben (Habits, Tagebuch, Aktien, Briefing, Gmail-Filter). Das neue Repo wird das Produkt.

---

## 8. Konkrete Setup-Entscheidungen (final)

- **Code-Ort:** `~/project-x/` (gleiche Ebene wie `~/lebens-automatismus/`)
- **GitHub:** Repo `nepipo/project-x` (privat) auf dem existierenden GitHub-Account
- **Vercel:** Neues Projekt `project-x` in der existierenden Vercel-Org (`lebens-automatismus-projects`)
- **Supabase:** Neues Projekt `project-x` im existierenden Supabase-Account (komplett getrennte DB, eigene Auth)
- **Briefing-Docs:** Liegen auf `~/Desktop/project-x/` — werden im Repo als `docs/` referenziert aber nicht direkt verschoben (Plan-Ordner ≠ Bau-Ordner)

## 10. Skalierungsziel & Security-Standards (nicht verhandelbar)

**Die App wird gebaut für bis zu 100.000 User — von Tag 1.**

Das ist keine Aspirationsaussage. Es ist ein technischer Constraint. Auch wenn die Closed Beta mit 10 Leuten startet, gilt: Jede Entscheidung — DB-Schema, Auth, Queries, API-Design, Security — wird so getroffen als ob morgen 100k Schüler gleichzeitig einloggen.

---

### Was das konkret bedeutet

**Datenbank / Supabase**
- RLS auf JEDER Tabelle, die User-Daten enthält — immer, keine Ausnahmen
- Keine `SELECT *` auf großen Tabellen — immer nur die Felder die gebraucht werden
- Indexes auf alle Felder die in `WHERE`-Clauses oder Joins auftauchen (user_id, fach_id, created_at etc.)
- Migrations werden sorgfältig geschrieben — kein `ALTER TABLE` ohne Nachdenken über Lock-Zeiten
- Kein Client-seitiges Filtern von Daten die nie hätten geladen werden sollen — immer serverseitig filtern

**Auth & Session**
- Supabase Auth ist State of the Art — aber zusätzlich: Rate-Limiting auf Login-Endpunkt (Supabase hat das eingebaut, muss aktiviert sein)
- Leaked-Password-Protection in Supabase Auth aktivieren (steht noch offen)
- JWTs nie im LocalStorage, immer Supabase's HttpOnly-Cookie-Mechanismus
- Sensible Aktionen (Passwort ändern, Account löschen) brauchen Re-Auth

**API-Sicherheit**
- Alle API-Routen validieren Input mit zod — kein blindes `req.body` vertrauen
- Keine API-Route gibt mehr zurück als der eingeloggte User sehen darf
- User-IDs nie aus dem Request-Body nehmen — immer aus der verifizierten Session
- CSRF-Schutz durch SameSite-Cookies (Supabase default)

**Frontend**
- Keine sensiblen Daten im URL-State (Query-Params, Hash)
- Kein Inline-Script, kein `dangerouslySetInnerHTML` ohne explizite Sanitierung
- Fehler-Messages an den User dürfen keine internen Details verraten (Stack-Traces, DB-Errors)

**Kosten bei Scale**
- Vor jedem Feature das Claude API calls macht: Kostenrechnung bei 100k DAU (Daily Active Users)
- Vor jedem Supabase-Feature: Prüfen ob es im Free/Pro Tier noch skaliert oder ob Vercel/Supabase-Upgrade nötig wird
- Vercel Serverless Functions haben Timeout-Limits — bei AI-Features auf Streaming oder Edge-Functions achten

**Code-Qualität**
- Keine N+1 Queries — wenn ein Feature X Items lädt, sollte es 1 Query sein, nicht X Queries in einer Loop
- Error-Handling an allen System-Boundaries (API-Calls, DB-Calls, externe Services)

---

### Was ich NICHT will

- Micro-Optimierungen die keinen User-Impact haben (kein premature performance tuning)
- Over-Engineering für hypothetische Features
- Security-Theater (zod auf Daten die sowieso aus der verifizierten Session kommen)

**Der Punkt ist:** Richtig bauen von Anfang an. Nicht: "Wir machen das Production-ready wenn wir groß sind." Einmal falsch gebaut → schwer umzubauen wenn 50k User drauf sind.

---

## 11. Onboarding-Flow (vor der Registrierung)

*Stand: 18.06.2026 — Flow umgedreht: Onboarding läuft jetzt **anonym vor** Login/Registrierung (Duolingo-Prinzip: erst Wert zeigen, dann Account). Implementiert.*

**Trigger:** Landing-CTA „Kostenlos starten" → `/onboarding` (öffentlich, kein Login nötig). Login/Registrierung kommt **danach**.

**Ablauf (anonym → Account):**
1. User klickt auf der Landing „Kostenlos starten" → `/onboarding` (anonym)
2. Multi-Step-Form (viele kleine Steps, 1 Frage pro Screen) → Antworten landen im `localStorage` (`px_onboarding`), **nicht** sofort in der DB (es gibt noch keine `user_id`)
3. Am Ende → Redirect `/signup` (Button heißt „Konto erstellen →")
4. Nach Registrierung + E-Mail-Bestätigung → `/onboarding` (eingeloggt) liest `localStorage` → `applyOnboarding()` schreibt Profil + Fächer in einem Rutsch in die DB, setzt `onboarding_abgeschlossen = true` → Redirect `/dashboard`

**Fallback (robust gegen Datenverlust):** Geht der `localStorage` verloren (z.B. E-Mail auf anderem Gerät bestätigt), bleibt `onboarding_abgeschlossen = false`. Der bestehende Mechanismus in `app/(app)/layout.tsx` schickt den User dann erneut nach `/onboarding` — diesmal eingeloggt, am Ende wird direkt via `applyOnboarding()` gespeichert. Kein Datenverlust-Drama.

**Step-Reihenfolge (8 Mini-Screens):**
1. `vorname` — Pflicht (wird überall in der App genutzt) → DB-Spalte `name`
2. `nachname` — Optional, überspringbar
3. `geburtsdatum` — Optional, volles Datum (DB-Spalte `geburtsdatum date`)
4. `klasse` — Pflicht, 5–13 als Grid (Tipp = direkt weiter)
5. `bundesland` — Pflicht, Liste (Tipp = direkt weiter)
6. `schulform` — Optional: Gymnasium / Berufsschule / Stadtteilschule / Andere
7. `schule_name` — Optional, Freitext → DB-Spalte `schule`
8. `faecher` — Chips + Freitext + LK/GK-Toggle (Batch-Insert in `schule_fach`)

**Design-Vorgaben:**
- Gleicher Dark-Mode-Look wie der Rest der App
- 1 Frage pro Screen, große Buttons, Auto-Advance bei Single-Choice
- Progress-Indicator „Schritt X von 8", Zurück-Button überall
- Skip nur für optionale Felder, nicht für Pflichtfelder

**Code-Orte:**
- `app/onboarding/page.tsx` — Server-Wrapper (Login-Check + Redirect-Logik)
- `app/onboarding/onboarding-flow.tsx` — Client-Steps
- `lib/onboarding/storage.ts` — `localStorage`-Bridge (`OnboardingData`, save/load/clear)
- `lib/actions/schule.ts` → `applyOnboarding()` — zod-validiert (`ApplyOnboardingSchema`), Batch-Insert, `user_id` aus Session
- `lib/supabase/proxy.ts` — `/onboarding` ist öffentlich

**DB-Mapping:**
- `nutzer_profil`: `name`, `nachname`, `geburtsdatum`, `klasse`, `bundesland`, `schulform`, `schule`, `onboarding_abgeschlossen` (Migration `0005_onboarding_profil_felder`)
- Altlast: `geburtsjahr` (ungenutzt, kann später gedroppt werden — `geburtsdatum` ist der Nachfolger)

**Einstellungen:**
- Route `/einstellungen/profil` — alle Onboarding-Felder dort nochmal editierbar (noch offen)
- Kein separater Onboarding-Re-Run, einfach direkt im Formular ändern

---

## 12. Einstellungen — Roadmap & Todo-Liste

*Referenz: beste Apps (Notion, Todoist, Duolingo, Spotify, Apple Health) + Schul-Apps (iDoceo, myHomework, Additio, Stundenplan+). Stand: 06.06.2026*

### Legende
- 🔴 Vor Beta — Blocker oder DSGVO-Pflicht
- 🟡 v1.0 — kommt bald nach Beta-Launch
- ⚪ Später — nice to have, kein Blocker

---

### A · Profil & Konto

| Prio | Feature | Notiz |
|------|---------|-------|
| 🔴 | **Passwort ändern** in /einstellungen (oder /profil) | Supabase `updateUser({ password })` — aktuell nur per "Passwort vergessen"-Flow möglich |
| 🔴 | **Abmelden** auch in /einstellungen sichtbar | Aktuell nur in /profil versteckt — viele User suchen es in Settings |
| 🟡 | E-Mail ändern | Supabase `updateUser({ email })` + Bestätigungs-Mail |
| 🟡 | Profilbild / Avatar-Farbe | Initialen-Avatar mit wählbarer Farbe — kein Upload nötig |
| ⚪ | Verbundene Konten (Google) | Wenn Google-OAuth konfiguriert ist |

---

### B · Schule

| Prio | Feature | Notiz |
|------|---------|-------|
| 🔴 | **Halbjahr wechseln** | Schüler brauchen das 2× pro Jahr — aktuell nicht in Settings möglich. Dropdown: 11/1, 11/2, 12/1, 12/2, 13/1, 13/2 |
| 🟡 | Bundesland | Dropdown (16 Bundesländer) — relevant für Ferien, Notensystem-Varianten |
| 🟡 | Abiturjahr | Countdown "noch X Tage bis Abi" im Dashboard |
| 🟡 | Schulform | Gymnasium / Gesamtschule / Berufsschule — beeinflusst zukünftig Feature-Sichtbarkeit |
| ⚪ | Notensystem | Schweiz (1–6 umgekehrt), Österreich, IB — nach Beta |

---

### C · Fächer

| Prio | Feature | Notiz |
|------|---------|-------|
| 🔴 | **Fach hinzufügen** direkt in Einstellungen | Aktuell nur in /noten möglich — Settings ist der natürliche Ort |
| 🔴 | **GK/LK (Niveau) pro Fach ändern** | Nach Onboarding nicht mehr änderbar — Bug |
| 🟡 | Fach-Farbe wählen | Color-Picker oder Preset-Palette (6–8 Farben) — aktuell alle Fächer gleiche Default-Farbe |
| 🟡 | Reihenfolge ändern | Drag & Drop oder Up/Down-Pfeile — beeinflusst Sortierung in Noten + Dashboard |
| ⚪ | Fach archivieren | Statt löschen: ausblenden aber Noten behalten |

---

### D · Benachrichtigungen

| Prio | Feature | Notiz |
|------|---------|-------|
| 🟡 | **Klausur-Erinnerung konfigurieren** | X Tage vorher (1 / 3 / 7 Tage) — aktuell keine Konfiguration möglich |
| 🟡 | Briefing-Uhrzeit | Wann kommt das tägliche KI-Briefing (z. B. 7:00 Uhr) |
| 🟡 | Tägliche Lern-Erinnerung | Optional: "Hast du heute schon Noten eingetragen?" |
| ⚪ | Stille Stunden | Keine Notifications zwischen X und Y Uhr |

---

### E · Darstellung

| Prio | Feature | Notiz |
|------|---------|-------|
| 🟡 | **Theme-Toggle** (Dark / Light / System) | Aktuell hardcoded Dark — viele Schüler nutzen Light Mode |
| 🟡 | Dezimalstellen im Schnitt | 1 oder 2 Nachkommastellen (z. B. 12,3 vs 12,34) |
| ⚪ | Akzentfarbe wählen | Azurblau, Indigo, Grün, Rot etc. — wie in Mockup v4 |
| ⚪ | Kompakt-Ansicht | Weniger Padding, mehr Fächer auf einen Blick |

---

### F · Daten & Privatsphäre

| Prio | Feature | Notiz |
|------|---------|-------|
| 🔴 | **Datenschutz + Impressum verlinken** in Einstellungen | DSGVO-Pflicht — User muss die Seiten von der App aus erreichen können |
| 🟡 | **Daten exportieren** (CSV / JSON) | DSGVO Art. 20 — Recht auf Datenportabilität. Export: Fächer + Noten + Klausuren |
| 🟡 | Daten-Übersicht | "Diese Daten speichern wir von dir" — Transparenz erhöht Vertrauen |
| ⚪ | Alle Daten löschen (ohne Account löschen) | Noten/Fächer reset, Account bleibt |

---

### G · KI & Briefing

| Prio | Feature | Notiz |
|------|---------|-------|
| 🟡 | **Briefing ein/ausschalten** | Manche User wollen kein KI-Briefing |
| 🟡 | Briefing-Länge | Kurz (3 Sätze) / Mittel / Lang |
| 🟡 | Briefing-Fokus | Noten / Klausuren / Beides / Alles inkl. Hausaufgaben |
| ⚪ | Coach-Kontext | Persistenter Kontext für den KI-Coach ("Mein Ziel ist Mathe LK 13 Punkte") |

---

### H · Über die App

| Prio | Feature | Notiz |
|------|---------|-------|
| 🟡 | App-Version anzeigen | Hilft beim Debugging bei Beta-Usern ("Was für eine Version hast du?") |
| 🟡 | Changelog / "Was ist neu?" | Nach jedem größeren Update — hält User informiert |
| 🟡 | Feedback-Button-Link | Direkt zum Feedback-Dialog (den wir gebaut haben) |
| ⚪ | App-Store-Bewertung | Wenn iOS/Android App live |

---

### Zusammenfassung: Was zuerst?

**Nächste Session (Blocker für gute Beta-UX):**
1. Halbjahr wechseln (B)
2. GK/LK pro Fach ändern (C)
3. Fach hinzufügen in Settings (C)
4. Passwort ändern (A)
5. Datenschutz/Impressum Links in Settings (F)

**Danach (v1.0-Features):**
6. Theme-Toggle
7. Daten exportieren
8. Briefing ein/ausschalten
9. Fach-Farbe
10. Klausur-Erinnerung konfigurieren

---

## 13. Pro-Plan & Monetarisierung — TODO: Noch komplett zu planen, besprechen & umsetzen

> **Status: OFFEN** — Noch nicht geplant, nicht besprochen, nicht implementiert. Muss vor v1.0 vollständig durchdacht und gebaut werden.

---

### Was noch fehlt

1. **Modell-Entscheidung** — Welches Pricing-Modell? Freemium mit harten Limits? Trial? Usage-based? Noch keine finale Entscheidung.
2. **Feature-Grenze** — Welche Features sind Free, welche Pro? Noch nicht definiert.
3. **Technische Umsetzung** — Payment-Provider, Subscription-Verwaltung, Feature-Gates im Code. Noch nicht gebaut.
4. **Rechtliches** — AGB, Widerrufsrecht, USt bei Minderjährigen (Eltern-Zustimmung?). Noch nicht geprüft.

---

### Monetarisierungsmodell — Ideen-Rohmasse (noch nicht entschieden)

**Modell-Optionen (müssen wir besprechen):**

| Modell | Wie | Pro | Contra |
|--------|-----|-----|--------|
| **Freemium hard** | Free: 3 Fächer, 10 Noten/Monat. Pro: Unbegrenzt | Conversion-Druck | Nervt Beta-User |
| **Freemium soft** | Free: Alles core. Pro: KI-Features + Extras | User-freundlich, vertrauen aufbauen | Conversion langsamer |
| **Trial** | 30 Tage Pro kostenlos, danach Abo | Alle lernen Pro kennen | Viele vergessen/canceln |
| **One-Time** | Einmalzahlung für Pro (~20€) | Kein Abo-Stress | Kein recurring revenue |
| **Schüler-Deal** | 1€/Monat im Schuljahr, 0€ in den Ferien | Zielgruppen-fit | Komplex in Umsetzung |

**Mein Bauchgefühl (noch zu validieren):** Freemium soft — Free für alles Kern-Nützliche, Pro für KI + Extras. 3–5€/Monat. Weniger Churn, mehr Vertrauen beim Launch.

---

### Pro-Feature-Kandidaten (noch zu priorisieren)

- 🤖 **KI-Coach** — Chat mit Claude über Noten, Ziele, Lernplan
- 🗞️ **Tägliches Audio-Briefing** — TTS-Zusammenfassung des Schultags
- 📊 **Trend-Analyse** — Notenentwicklung über Zeit, Prognose bis Abi
- 📅 **Smarte Klausur-Vorbereitung** — KI schlägt Lernplan vor
- 🔔 **Push-Benachrichtigungen** — Klausur-Erinnerungen, Briefing
- 📤 **Daten-Export** (CSV/PDF) — auch als DSGVO-Feature
- 🎨 **Themes / Akzentfarben** — Customization als Motivation
- 👥 **Klassen-Vergleich** (anonym) — "Du liegst über dem Schnitt deiner Klasse"

---

### Payment-Tech — Optionen (noch nicht entschieden)

| Provider | Kosten | Notiz |
|----------|--------|-------|
| **Stripe** | 1,5% + 0,25€ je Transaktion (EU) | Standard, gut dokumentiert, Supabase-Integration vorhanden |
| **LemonSqueezy** | 5% + 0,50€ | Merchant of Record — übernimmt Steuern/MwSt, ideal für Solopreneure |
| **Paddle** | 5% + 0,50€ | Ähnlich LemonSqueezy |

**Empfehlung noch offen** — LemonSqueezy könnte sinnvoll sein weil MoR (kein Steuer-Kopfschmerz als 17-Jähriger).

---

### Nächste Schritte für Pro-Planung

- [ ] Session: Pro-Modell gemeinsam besprechen und entscheiden
- [ ] Feature-Grenze definieren (was ist Free, was Pro)
- [ ] Rechtliches klären (Minderjährige + Abo, Eltern-Zustimmung DE-Recht)
- [ ] Payment-Provider wählen + integrieren
- [ ] `nutzer_profil` um `plan` (free/pro) + `abo_bis` erweitern
- [ ] Feature-Gates in der App implementieren (Middleware oder Hook)
- [ ] Upgrade-Flow bauen (Pricing-Page → Checkout → Bestätigung)
- [ ] Webhook für Abo-Events (Stripe/LemonSqueezy → Supabase)

---

## 9. Wie wir starten

1. Neuen GitHub-Repo erstellen: `gh repo create nepipo/project-x --private`
2. Lokales Verzeichnis: `mkdir ~/project-x && cd ~/project-x`
3. `create-next-app` mit TypeScript + Tailwind + App Router
4. Connect zu GitHub: `git remote add origin git@github.com:nepipo/project-x.git`
5. Vercel-Projekt anlegen + GitHub verbinden
6. Supabase-Projekt anlegen + Schema-Init
7. Erst dann: Tailwind-Theme aus Mockup v4 übernehmen + Auth-Setup
