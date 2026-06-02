# Spec: Notenrechner fürs eingeloggte Dashboard

**Datum:** 2026-06-02
**Status:** Design (vor Implementierung)
**Phase:** Project X — Phase 2 (Schule Core MVP), MVP-Hero

---

## 1. Ziel

Aus der bestehenden öffentlichen Demo (`/demo/notenrechner`, in-memory) ein **echtes, persistentes Schul-Cockpit** im eingeloggten Dashboard machen. Daten liegen pro User in Supabase mit RLS. Der Notenrechner ist der MVP-Hero — das, weswegen jemand die App nutzt.

## 2. Nicht-Ziele (bewusst draußen, später)

- **Andere Notensysteme** (Schweiz 1–6, Österreich 1–5, IB 1–7): Architektur wird system-fähig gebaut, aber **nur Deutschland (0–15 Punkte)** wird jetzt implementiert. CH/AT/IB sind spätere Erweiterungen ohne Architektur-Umbau.
- Klausur-Termine mit Countdown (`schule_klausur` existiert, bleibt aber für dieses Feature ungenutzt).
- KI-Coach, Briefing, Push — eigene spätere Phasen.

## 3. Geklärte Entscheidungen

| Thema | Entscheidung |
|---|---|
| Scope | Volles Cockpit, aber in 4 iterativen Schichten gebaut (jede für sich nutzbar) |
| Fächer-Anlage | Geführtes Onboarding (Schale), plus simpler "Fach hinzufügen"-Mechanismus (Dauer-Nutzung) |
| Halbjahr-Modell | Fächer + Gewichtung sind **pro Halbjahr**; beim HJ-Wechsel Komfort-Übernahme-Dialog |
| Architektur | Server Components laden Daten, Client-Komponente hält State für Live-Rechnung, Server Actions persistieren mit optimistischem Update |
| Notensystem | DE 0–15 jetzt; Architektur system-fähig (Interface), Rest später |
| Eingabe Punkte/Note | Beim ersten Login wählbar (Onboarding) + in Einstellungen änderbar — **nicht** als Schalter in der Hauptansicht |
| Anzeige | Überall: Punktzahl/Schnitt groß, Note klein daneben (immer beides) |

## 4. Datenmodell

Das bestehende Schema (`0001_initial_schema`) **passt** — `halbjahr` und Gewichtung hängen schon am `schule_fach`. Damit ist jedes Fach (Name, Halbjahr)-spezifisch, was zur Halbjahr-Entscheidung passt. **Keine** Struktur-Migration der Schule-Tabellen nötig.

**Eine kleine Migration (`0003`) fürs Profil:**
```sql
alter table public.nutzer_profil
  add column notensystem  text not null default 'de_0_15'
    check (notensystem in ('de_0_15')),  -- später: 'ch_1_6','at_1_5','ib_1_7'
  add column eingabe_modus text not null default 'punkte'
    check (eingabe_modus in ('punkte','note'));
```
(Der CHECK auf `notensystem` wird erweitert, sobald weitere Systeme dazukommen.)

**Tabellen-Rollen:**
- `nutzer_profil` — pro User: `notensystem`, `eingabe_modus`, `aktuelles_halbjahr`.
- `schule_fach` — eine Zeile pro (Fach, Halbjahr): `name`, `niveau` (grund/erhoeht → GK/LK), `farbe`, `halbjahr`, Kategorie-Gewichte, `fach_gewicht`.
- `schule_note` — hängt an `fach_id` (erbt damit das Halbjahr): `punkte` (0–15), `kategorie`, `gewicht`, `bezeichnung`, `datum`.

## 5. Architektur & Dateien

```
app/dashboard/page.tsx          Server Component: lädt Profil + Fächer + Noten (aktuelles HJ)
app/dashboard/actions.ts        Server Actions: addFach, updateFach, removeFach,
                                addNote, removeNote, setHalbjahr, neuesHalbjahr,
                                updatePraeferenzen (System/Eingabe-Modus)
lib/grades/systems.ts           Notensystem-Interface + DE-0-15-Implementierung
                                (Skala, punkteZuNote, noteZuPunkte, Formatierung)
lib/grades/db.ts                reine Mapping-Funktionen: DB-Row <-> calc.ts-Typen
lib/grades/calc.ts              vorhanden — bleibt Kern; ggf. um Jahres-Aggregation ergänzt
components/notenrechner/        Client-Komponenten (State + optimistisches UI)
```

**Datenfluss:** Server lädt → Client-Komponente erhält Initialdaten → hält State (Schnitt rechnet live mit `calc.ts`) → bei Änderung sofort optimistisches UI-Update + Server Action persistiert → bei Fehler Rollback + Toast (`sonner`).

**Notensystem-Interface** (Kern der späteren Erweiterbarkeit): definiert Skala (min/max, Richtung), `punkteZuNote`/`noteZuPunkte`, Anzeige-Formatierung und Aggregationsart. DE 0–15 ist die erste Implementierung; `calc.ts` arbeitet gegen dieses Interface statt fest gegen 0–15.

## 6. Bau-Schichten (jede einzeln nutzbar & vorzeigbar)

### Schicht 1 — Kern (das echte Tool)
- Migration `0003` (Profil-Felder).
- `lib/grades/systems.ts` (DE), `lib/grades/db.ts` (Mapping).
- Server Actions: Fach- und Noten-CRUD.
- Dashboard zeigt echte Fächer-Karten, Noten-Pills, "+ Note" (**Punkte-Eingabe**), Hero-Gesamtschnitt. Anzeige überall Punkte groß + Note klein.
- Leerer Zustand: simples "Fach hinzufügen".
- **Done-when:** Eingeloggter User legt Fach + Noten an, sieht korrekten Schnitt, alles übersteht einen Reload.

### Schicht 2 — Konfiguration & Präferenzen
- ⚙ Fach-Dialog: Niveau GK/LK, Kategorie-Gewichtung (Klausur/mündlich %), Farbe.
- Onboarding-Schritt beim ersten Login: Notensystem (DE vorausgewählt) + Eingabe-Modus (Punkte/Note).
- Einstellungs-Seite: System + Eingabe-Modus änderbar.
- Note-Eingabe-Variante (Auswahl 1+ … 6) zusätzlich zur Punkte-Eingabe, gesteuert vom Eingabe-Modus.

### Schicht 3 — Halbjahr-Cockpit
- Halbjahr-Switcher (Daten nach `aktuelles_halbjahr` gefiltert).
- Neues-Halbjahr-Dialog: Fächer übernehmen/weglassen + Gewichtung anpassen, Noten werden nicht kopiert.
- Was-wäre-wenn-Modus ("Was, wenn ich in Mathe 12 schreibe?") — nutzt `wasWaereWenn` aus `calc.ts`.

### Schicht 4 — Jahresübersicht
- Ansicht-Tabs: Halbjahr / Ganzes Jahr.
- Jahres-Tabelle: pro Fach Schnitt je HJ + zusammengeführter Jahresschnitt; Gesamt-Jahresschnitt als Hero.
- Leere Felder, wenn ein Fach in einem HJ nicht belegt war.

## 7. UX-Flow

Neuer User → Onboarding (System + Eingabe-Modus, Schicht 2) → leeres Dashboard mit Fächer-Anlage → Fächer + Noten → Live-Schnitt. Optik 1:1 aus der bestehenden Demo (Hero-Riesenzahl, Karten, Pills) + Theme (Azurblau, Dark). Visuelle Referenz: `~/Desktop/project-x/mockups/notenrechner-eingeloggt.html`.

## 8. Testing

- `lib/grades/calc.ts` hat bereits Vitest-Tests.
- Neu: Unit-Tests für `lib/grades/systems.ts` (punkteZuNote/noteZuPunkte hin und zurück) und `lib/grades/db.ts` (Mapping korrekt).
- **Offener Punkt:** Prüfen, ob Vitest als Dependency installiert ist; falls `npm install` nötig, vorher fragen.
- Playwright-E2E (Bauplan Woche 6) bewusst später.

## 9. Risiken / offene Details

- **Vitest-Install** noch unbestätigt (siehe oben).
- **Halbjahr-Bezeichnung:** Format `JJJJ/JJ-N` (z.B. `2025/26-2`); wählbare HJ aus Klasse + Schuljahr ableiten, plus manuelles Anlegen. Anzeige-Label menschlich (z.B. "11/2").
- **Note↔Punkte-Umrechnung:** DE-Mapping ist diskret (1+ = 15, 1 = 14, 1- = 13, … 6 = 0); bei Note-Eingabe wird der Punktwert daraus abgeleitet.
