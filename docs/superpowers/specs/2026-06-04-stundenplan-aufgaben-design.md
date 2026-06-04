# Stundenplan + Aufgaben — Design-Spec

**Datum:** 04.06.2026
**Status:** Approved
**Scope:** Stundenplan-Feature (Wochenraster + Tagesdetail) + neues Aufgaben-Modul (Klausuren + Hausaufgaben)

---

## 1. Überblick

Zwei neue Kernfeatures, die zusammen gebaut werden weil sie eine gemeinsame Datenbasis teilen:

1. **Stundenplan** (`/stundenplan`) — Wochenraster Mo–Sa + Tagesdetail-View. User trägt seine Stunden manuell ein (Fach, Zeit, Raum, A/B-Woche). Klausuren und offene Hausaufgaben erscheinen als Badges direkt in der Stunden-Kachel.
2. **Aufgaben** (`/aufgaben`) — neue Seite mit zwei Sektionen: Klausuren (aus bestehender `schule_klausur`-Tabelle, migriert aus dem Notenrechner) + Hausaufgaben (neue Tabelle). Sortiert nach Fälligkeitsdatum, farbcodiert nach Fach.

---

## 2. Navigation

| Tab | Route | Änderung |
|---|---|---|
| Übersicht | `/dashboard` | unverändert |
| Noten | `/noten` | KlausurSection **raus** |
| What-If | `/what-if` | unverändert |
| Stundenplan | `/stundenplan` | **neu gebaut** (Placeholder ersetzt) |
| Aufgaben | `/aufgaben` | **neu** (neuer Nav-Tab) |
| Einstellungen | `/einstellungen` | unverändert |

`app-nav.tsx` bekommt einen neuen Tab "Aufgaben" mit `ClipboardList`-Icon (Lucide).

---

## 3. Datenmodell

### 3a. `stundenplan_stunde` (neue Tabelle)

```sql
create table public.stundenplan_stunde (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  fach_id     uuid references public.schule_fach(id) on delete set null,
  wochentag   smallint not null check (wochentag between 1 and 7), -- 1=Mo, 7=So
  zeit_start  time not null,
  zeit_end    time not null,
  raum        text,
  woche_typ   text check (woche_typ in ('A', 'B')) -- null = jede Woche
);
```

RLS: User sieht und verwaltet nur eigene Zeilen.

Pausen werden **nicht** gespeichert — sie ergeben sich aus den Lücken zwischen `zeit_end` und `zeit_start` der folgenden Stunde desselben Tages.

### 3b. `hausaufgabe` (neue Tabelle)

```sql
create table public.hausaufgabe (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  fach_id      uuid references public.schule_fach(id) on delete set null,
  beschreibung text not null,
  faellig_am   date not null,
  erledigt     boolean not null default false,
  created_at   timestamptz not null default now()
);
```

### 3c. Nutzer-Einstellungen (in `nutzer_profil`, neue Spalten)

```sql
alter table public.nutzer_profil
  add column wochen_modus text check (wochen_modus in ('standard', 'AB')) default 'standard',
  add column aktuelle_woche text check (aktuelle_woche in ('A', 'B')) default 'A';
```

`wochen_modus = 'standard'` → alle Stunden mit `woche_typ = null` sichtbar.
`wochen_modus = 'AB'` → Stunden ohne `woche_typ` + Stunden mit `woche_typ = aktuelle_woche` sichtbar.

---

## 4. Stundenplan-Feature (`/stundenplan`)

### 4a. Wochenraster

- Grid: Zeitachse links (Zeilen), Mo–Sa als Spalten
- Heutiger Tag: leichter Brand-Tint im Hintergrund, Datum in Gradient-Text
- Jede Stunden-Kachel:
  - Fachfarbe als Hintergrund (niedrige Opacity) + farbiger linker Streifen
  - `KLAUSUR`-Badge (rot) wenn `schule_klausur.datum` am selben Tag
  - `HA`-Badge (grün) wenn offene `hausaufgabe.faellig_am` ≤ diesem Datum für dieses Fach
  - Hover: `scale(1.04) translateY(-2px)` + `filter brightness(1.12)`
- Klausur-Tag-Indikator im Header: pulsierender roter Dot mit `ping`-Animation
- A/B-Woche: kleiner Chip oben rechts (`Woche A` / `Woche B`), klickbar zum Umschalten

### 4b. Tagesdetail

- Wochentag-Pills oben: horizontales Scroll, aktiver Tag in Brand-Gradient
- Zeitleiste: Stunden als große farbige Blöcke mit Farbstreifen oben (2px)
- Pausen automatisch als Trennlinie mit Dauer angezeigt
- Klausur-Warnung am Ende als roter Alert-Block (wenn Klausur ≤ 7 Tage)
- Zugang: Klick auf Datum im Wochenraster → `/stundenplan?datum=2026-06-03`. Komponente leitet Wochentag aus dem Datum ab, zeigt dessen Stunden + datumsgenaue Klausur-Warnungen

### 4c. Stunden-Verwaltung

- FAB (Floating Action Button) `+` öffnet ein Sheet/Dialog
- Felder: Fach (Dropdown aus `schule_fach`), Wochentag, Von, Bis, Raum (optional), Woche (A/B/Immer)
- Löschen: Swipe oder Kontextmenü auf Kachel

---

## 5. Aufgaben-Feature (`/aufgaben`)

### 5a. Layout

Zwei Spalten (Desktop/iPad) oder gestapelt (Mobile):
- Links: **Klausuren** — sortiert nach Datum aufsteigend
- Rechts: **Hausaufgaben** — sortiert nach `faellig_am` aufsteigend, erledigte ans Ende

### 5b. Klausuren

- Aus bestehender `schule_klausur`-Tabelle (keine Schema-Änderung)
- `klausur-section.tsx` wird refactored → neues `klausur-liste.tsx`
- Aus `/noten` entfernt
- Jede Klausur: Fach-Stripe mit Glow, Titel, Datum, Countdown-Chip (rot wenn ≤ 7 Tage, blau sonst)
- "Klausur hinzufügen"-Button bleibt erhalten

### 5c. Hausaufgaben

- Jede Hausaufgabe: Fach-Stripe, Beschreibung, Fälligkeitsdatum
- Checkbox: Klick → `erledigt = true`, Item dimmt + durchgestrichen, rutscht nach unten
- "Hausaufgabe hinzufügen"-Button öffnet Inline-Form oder Dialog
- Felder: Fach (optional), Beschreibung, Fällig am

---

## 6. Onboarding-Erweiterung

In `app/onboarding/page.tsx` nach Fach-Konfig einen neuen Schritt:
> "Nutzt deine Schule A/B-Wochen?" → Ja / Nein

Wert wird in `nutzer_profil.wochen_modus` gespeichert.
In den Einstellungen (`/einstellungen`) nachträglich änderbar.

---

## 7. Design-Token-Recap

Alles folgt dem bestehenden App-Theme:
- Fach-Kacheln: `rgba(<fachfarbe>, .14-.16)` Background + `rgba(<fachfarbe>, .22)` Border + `0 0 18px rgba(<fachfarbe>, .07)` Glow
- Hover: `transform: scale(1.04) translateY(-2px)` + `filter: brightness(1.12)`
- Klausur-Highlight: roter Border `rgba(255,48,80,.4)` + Glow `rgba(255,48,80,.14)`
- Stagger-Reveal: `fade-up` Animation mit 60ms Delay-Staftel pro Element
- Pulsierender Klausur-Dot: `ping`-Keyframe mit `opacity + scale`

---

## 8. Dateistruktur (neu/geändert)

```
app/(app)/
  stundenplan/
    page.tsx              ← komplett neu (Wochenraster + Tagesdetail)
  aufgaben/
    page.tsx              ← neu (Klausuren + Hausaufgaben)

components/
  stundenplan/
    wochen-raster.tsx     ← Wochengrid-Komponente
    tages-detail.tsx      ← Tagesdetail-Komponente
    stunde-kachel.tsx     ← einzelne Kachel (Wochenraster)
    stunde-dialog.tsx     ← Formular für neue Stunde
  aufgaben/
    klausur-liste.tsx     ← refactored aus klausur-section.tsx
    hausaufgaben-liste.tsx ← neu
    hausaufgabe-item.tsx  ← einzelne Hausaufgabe mit Checkbox

lib/
  actions/
    stundenplan.ts        ← Server Actions: addStunde, removeStunde
    hausaufgaben.ts       ← Server Actions: addHausaufgabe, removeHausaufgabe, toggleErledigt

supabase/migrations/
  0005_stundenplan_hausaufgaben.sql  ← neue Tabellen + Profil-Spalten
```

---

## 9. Nicht im Scope (Phase 2)

- KI-Assistent zum Aktualisieren via Chat ("Englisch fällt morgen aus")
- Push-Notifications vor Klausuren
- iCal-Import/Export
- Konflikt-Erkennung bei überschneidenden Stunden
