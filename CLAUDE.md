# Project X — System-Verankerung

*Diese Datei wird in jeden Claude-Code-Chat dieses Projekts geladen. Sie definiert die Marschrichtung.*

**Stand:** 27.05.2026
**Arbeitstitel:** Project X (finaler Name kommt vor Launch)

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
- 15–18 Jahre, Gymnasium
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
- **Theme:** Dark Mode default, Blue/Dark Accents (Coral/Indigo aus Mockup v4 als Inspiration)

---

## 4. Design-Prinzipien

**Vibe:** Premium Performance / Future Founder. Schwarz mit kräftigen Akzenten in Coral + Indigo. Animationen lebendig (Glows, Driften, Counters, Particles). Soft & Flowing trotzdem.

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

→ **Closed Beta:** Ende August 2026, 5–20 echte User aus Nepomuks Umfeld

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

## 9. Wie wir starten

1. Neuen GitHub-Repo erstellen: `gh repo create nepipo/project-x --private`
2. Lokales Verzeichnis: `mkdir ~/project-x && cd ~/project-x`
3. `create-next-app` mit TypeScript + Tailwind + App Router
4. Connect zu GitHub: `git remote add origin git@github.com:nepipo/project-x.git`
5. Vercel-Projekt anlegen + GitHub verbinden
6. Supabase-Projekt anlegen + Schema-Init
7. Erst dann: Tailwind-Theme aus Mockup v4 übernehmen + Auth-Setup
