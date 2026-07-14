# Spec: Navigation + Übersichts-Hub (Teil A)

**Datum:** 2026-06-03
**Status:** Design (vor Implementierung)
**Phase:** Notena — Information Architecture / App-Struktur

---

## 1. Ziel

Die App hat keine übergreifende Navigation — alles hängt an `/dashboard`. Diese Spec führt eine **persistente Navigations-Leiste** + eine **Übersichts-Home (Hub)** + eine **Profil-Seite** ein und macht die bestehenden Bereiche über die Nav erreichbar. Was-wäre-wenn bekommt eine eigene Seite.

## 2. Scope-Abgrenzung

**Teil A (diese Spec):** Navigation, Hub, Profil, Was-wäre-wenn-Seite, Stundenplan-**Platzhalter**.
**Teil B (eigener Sprint, NICHT hier):** Das echte Stundenplan-Modul (DB-Schema, Eingabe, Wochenraster).

**Bewusst draußen:** Account-Löschung (nur Hinweis), Ferien-Countdown (Backlog), i18n/Sprache.

## 3. Routing

| Route | Inhalt | Status |
|---|---|---|
| `/` | Welcome (public, Gäste) — leitet Eingeloggte zu `/dashboard` | bestehend |
| `/dashboard` | **NEU: Übersichts-Hub** (Widgets) | umgebaut |
| `/noten` | **Notenrechner** (bisheriger `/dashboard`-Inhalt zieht 1:1 um) | Umzug |
| `/was-waere-wenn` | **NEU: eigene Seite** — Fach-Auswahl + Durchspielen/Zielnoten | neu |
| `/profil` | **NEU** — Name/Klasse/Schule + Account | neu |
| `/einstellungen` | Eingabe-Modus etc. (bisher `/settings`, zieht um) | Umzug |
| `/stundenplan` | **Platzhalter** ("kommt bald") | neu, Platzhalter |

Bestehende Redirects (Login/Welcome → `/dashboard`) landen künftig auf dem Hub — passt.

## 4. Layout-Architektur

Eine Next.js **Route-Group** `app/(app)/` mit gemeinsamem `layout.tsx`, das:
- die **Nav-Leiste** rendert (umschließt alle eingeloggten Seiten),
- den **Auth-Check** zentralisiert (`getClaims()`, sonst `/login`),
- den **Onboarding-Check** zentralisiert (`onboarding_abgeschlossen === false` → `/onboarding`) — wandert aus `dashboard/page.tsx` ins Layout, gilt damit für alle App-Seiten.

Eingeloggte Seiten ziehen in die Gruppe: `(app)/dashboard`, `(app)/noten`, `(app)/was-waere-wenn`, `(app)/profil`, `(app)/einstellungen`, `(app)/stundenplan`. Die Route-Group ändert die URLs nicht (Klammern erscheinen nicht im Pfad). Welcome (`/`), Auth, Onboarding, Demo bleiben außerhalb (keine Nav).

## 5. Nav-Verhalten (responsive)

- **< 1024px (Handy + iPad / App-Kontext):** Tab-Leiste **unten**, Icons + kurze Labels, Daumen-erreichbar.
- **≥ 1024px (Mac / Browser):** Leiste **oben**.
- **5 Haupt-Tabs:** Übersicht · Noten · Was-wäre-wenn · Stundenplan · Einstellungen.
- **Profil** über ein **Avatar-Icon oben rechts** (auf allen App-Seiten sichtbar) — hält die Bottom-Nav bei 5 (6 wären zu eng).
- Aktiver Tab hervorgehoben (Brand-Farbe). Theme-konsistent (dark, Azurblau).

## 6. Hub-Widgets (`/dashboard`)

1. **Gesamtschnitt** — große, farbcodierte Zahl des aktuellen Halbjahres (grün/gelb/rot via `schnittFarbe`).
2. **Nächste Klausur** — Countdown zur zeitlich nächsten Klausur (Titel, Fach, Tage); Empty State wenn keine.
3. **Schnellzugriff-Karten** — Kacheln zu Noten / Was-wäre-wenn / Stundenplan.

Daten kommen serverseitig (wie im bisherigen Dashboard): Profil, Fächer/Noten des aktuellen Halbjahres, kommende Klausuren.

## 7. Was-wäre-wenn-Seite (`/was-waere-wenn`)

Fach-Auswahl (Dropdown/Chips über alle Fächer des aktuellen Halbjahres) → darunter das bestehende `WasWaereWennPanel` (Durchspielen + Zielnoten-Rechner) für das gewählte Fach. Komponente wird wiederverwendet, kein neuer Rechen-Code. Das 🔮 im Notenrechner bleibt zusätzlich erhalten (schneller Inline-Zugriff).

## 8. Profil-Seite (`/profil`)

- Bearbeitbar: `name`, `klasse` (5–13), `schule` → schreibt `nutzer_profil` via Server Action.
- Account-Bereich: E-Mail (read-only), Abmelden-Button. „Account löschen" nur als Hinweis-Text (heikel, später mit eigenem Flow).

## 9. Stundenplan-Platzhalter (`/stundenplan`)

Schlichte Seite: „Stundenplan kommt bald" + ein Satz, was kommt. Macht den Nav-Eintrag schon funktionsfähig, ohne das Modul zu bauen.

## 10. Bau-Schichten (Teil A)

1. **Nav-Layout + Routing-Umzug:** Route-Group `(app)`, Nav-Komponente (responsive), Auth/Onboarding-Check ins Layout, Notenrechner → `/noten`, Settings → `/einstellungen`, Hub-Skelett auf `/dashboard`.
2. **Hub-Widgets:** Gesamtschnitt, nächste Klausur, Schnellzugriff.
3. **Profil-Seite** + Server Action `updateProfil`.
4. **Was-wäre-wenn-Seite** (Fach-Auswahl + Panel-Wiederverwendung).
5. **Stundenplan-Platzhalter** + Verifikation (Build/Tests grün, Smoke-Test).

## 11. Risiken / offene Punkte

- **Routing-Umzug** ist der riskanteste Teil: bestehende Imports (`@/app/dashboard/actions`) müssen gültig bleiben. Server Actions bleiben vorerst in `app/dashboard/actions.ts` (Import-Pfad unverändert), nur die Seiten ziehen um. Falls sauberer gewünscht, später nach `lib/` verschieben.
- **Nav-Icons:** `lucide-react` ist installiert — daraus die Tab-Icons.
- **Tests:** Reine UI/Routing-Arbeit; bestehende Logik-Tests (60) müssen grün bleiben, keine neuen Logik-Tests nötig außer ggf. `updateProfil`-Validierung.
