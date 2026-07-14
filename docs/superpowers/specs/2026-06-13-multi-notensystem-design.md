# Multi-Notensystem — Design-Spec

**Datum:** 2026-06-13
**Status:** Genehmigt (Design), bereit für Implementierungsplan
**Subsystem:** 1 von 2 (Notensysteme). Subsystem 2 = i18n/EN-UI bekommt eigenen Spec.

---

## 1. Ziel & Motivation

Notena unterstützt heute nur das deutsche Oberstufen-System (0–15 Punkte). Ziel: weitere
Notensysteme für mehr Reichweite — DACH (gleiche Sprache, billigster Reichweiten-Hebel) plus IB.

**Reichweiten-Logik:** Schweiz + Österreich sind deutschsprachig → dieselben Insta/TikTok-Kanäle
erreichen sie ohne Übersetzung. IB ist international (volle EN-UI folgt in Subsystem 2).

## 2. Scope

**Drin:**
- 5 Notensysteme: DE-Oberstufe (0–15), DE-Schulnoten (1–6), CH (1–6), AT (1–5), IB (1–7)
- Eingabe, Anzeige, Schnitt-Berechnung, Was-wäre-wenn, Bestehens-/Farb-Coding pro System
- System-Wechsel-Flow in den Einstellungen
- DB-Migration (numeric statt smallint, CHECK-Erweiterung)

**Draußen (bewusst):**
- i18n / englische UI → eigener Spec (Subsystem 2)
- Cross-System-Umrechnung → semantisch falsch (eine CH-4 ist keine DE-8). Keine Konversion.
- Demo-Notenrechner (öffentlich) bleibt vorerst DE-only. Multi-System nur in der eingeloggten App.
- Kategorie-/Gewichtungsmodell (Klausur/mündlich + GewichtungConfig) bleibt unverändert — es ist
  system-unabhängig.

## 3. Die fünf Systeme

| System-ID  | Bereich | Richtung          | Besteht ab | Kommastellen | Eingabe                       |
|------------|---------|-------------------|------------|--------------|-------------------------------|
| `de_0_15`  | 0–15    | höher = besser    | ≥ 5        | nein         | Punkte **oder** Note (2+, 3−) |
| `de_1_6`   | 1–6     | niedriger = besser| ≤ 4        | nein         | Note mit Tendenz (2+, 3−)     |
| `ch_1_6`   | 1–6     | höher = besser    | ≥ 4        | ja (Schritt 0,25: 4,5 / 5,25) | Dezimalzahl   |
| `at_1_5`   | 1–5     | niedriger = besser| ≤ 4        | nein         | Ganzzahl                      |
| `ib_1_7`   | 1–7     | höher = besser    | ≥ 4        | nein         | Ganzzahl                      |

Faktische Grundlagen (Standard-Domänenwissen):
- **DE-Oberstufe:** 0–15 Punkte, 15 best, 5 Punkte = ausreichend (Note 4).
- **DE-Schulnoten:** 1 (Sehr gut) … 6 (Ungenügend), 4 = ausreichend, Tendenzen 2+/3− üblich.
- **CH:** 1 … 6, 6 best, 4 = genügend. Halbe/Viertel-Noten üblich (4,5; 5,25). Höher = besser.
- **AT:** 1 (Sehr gut) … 5 (Nicht genügend), 4 = genügend, 5 = Fail. Ganzzahlig.
- **IB:** je Fach 1 … 7, 7 best, 4 = pass. Ganzzahlig. (Core/Gesamt /45 = out of scope.)

## 4. Datenmodell (DB)

### Änderungen
- `schule_note.punkte`: `smallint` → **`numeric(4,2)`** (deckt Kommastellen ab, max 15.00).
  - Coarse-CHECK `between 0 and 15` bleibt als Außen-Guard (alle Systeme ⊂ 0–15).
  - Echte Per-System-Validierung (min/max/step) macht die App via zod.
- `nutzer_profil.notensystem`: CHECK von `in ('de_0_15')` → `in ('de_0_15','de_1_6','ch_1_6','at_1_5','ib_1_7')`.
- Spaltenname `punkte` **bleibt** (intern = "gespeicherter Notenwert"). Rename wäre Churn ohne
  User-Nutzen und würde 8+ Files anfassen.

### Migration
- Neue Migration `00XX_multi_notensystem.sql`.
- Bestehende User: `notensystem` bleibt `de_0_15`, alle Werte (0–15) gültig in `numeric` → **kein
  Daten-Backfill nötig**.
- `ALTER TABLE … ALTER COLUMN punkte TYPE numeric(4,2)` — auf einer kleinen Beta-Tabelle
  unkritisch; Lock-Zeit vernachlässigbar (§10 beachtet, aber hier kein Skalierungsrisiko).

## 5. Code-Architektur

### `lib/grades/systems.ts` wird Single Source of Truth
Das vorhandene `Notensystem`-Interface wird erweitert:

```ts
interface Notensystem {
  id: NotensystemId;
  label: string;
  min: number;
  max: number;
  step: number;                       // 1 für Ganzzahl-Systeme, 0.25 für CH
  richtung: "hoeher_besser" | "niedriger_besser";
  bestehtAb: number;                  // Schwelle für "bestanden"
  displayDezimal: number;             // Nachkommastellen in der Anzeige
  format(wert: number): string;       // z.B. 13 -> "1−" (DE) / 4.5 -> "4,5" (CH)
  parse(eingabe: string): number | null;
  farbe(schnitt: number): string;     // Farb-Klasse je nach Richtung + Schwellen
}
```

`NotensystemId` wird von `"de_0_15"` zu Union aller 5 IDs. `ALLE`-Record + `getNotensystem(id)`
bleiben, kriegen die 4 neuen Einträge.

### `calc.ts` wird system-agnostisch
- `clampPunkte(p)` (hart auf 0–15) → `clamp(wert, system)` mit `[system.min, system.max]`.
- `fachSchnitt` / `gesamtSchnitt`: Aggregation ist reines (gewichtetes) Mitteln der Rohwerte —
  **richtungsunabhängig**, bleibt logisch fast gleich. Bekommt das System gereicht für den Clamp.
- `punkteZuNote` / `noteZuPunkte` ziehen aus `calc.ts` **raus** in die `de_0_15`-Systemdefinition
  (als `format`/`parse`). DE-spezifische Tendenz-Logik lebt dort.
- `benoetigtePunkte`: loopt künftig über die gültigen Werte des Systems (`min`→`max` in `step`),
  und der "Ziel erreicht"-Vergleich respektiert `richtung` (bei `niedriger_besser`: `wert <= ziel`).

### Plumbing zur UI
- Neuer **`NotensystemProvider`** (React Context) lädt das aktive System aus dem Profil.
- Hook **`useNotensystem()`** liefert das `Notensystem`-Objekt (`format`, `farbe`, `min/max`, …).
- Die ~8 Komponenten, die heute `punkteZuNote` **direkt** aus `calc.ts` importieren, ziehen die
  Formatierung künftig aus dem Hook. Das ist der größte mechanische Anteil der Umsetzung.
  Betroffen u.a.: `dashboard/schnitt-karte.tsx`, `notenrechner/{fach-card,jahres-tabelle,
  notenrechner-board,was-waere-wenn-panel}.tsx`, `was-waere-wenn-seite.tsx`,
  `app/demo/notenrechner/page.tsx` (Demo bleibt DE → nutzt fest `getNotensystem("de_0_15")`).

### Unverändert
- Kategorie-Modell (`Kategorie`, `GewichtungConfig`, `DEFAULT_GEWICHTUNG_CONFIG`) und die
  Gewichtungs-Logik in `fachSchnitt` — system-unabhängig.

## 6. Schnitt, Farbe, Was-wäre-wenn

- **Mitteln:** für alle Systeme identisch (gewichteter Durchschnitt der Rohwerte).
- **Farb-Coding** (`schnitt-farbe.ts`): wird system- und richtungsabhängig. Schwellen kommen aus
  `system.farbe()` / `farbSchwellen`. Bei `niedriger_besser` (DE 1–6, AT) invertiert sich grün/rot.
- **Was-wäre-wenn / `benoetigtePunkte`:** Suchraum = gültige Werte des Systems, Ziel-Vergleich
  richtungsabhängig.

## 7. System-Wechsel-Flow

- Einstellung im Profil (`/einstellungen` bzw. `/einstellungen/profil`).
- **Keine Noten vorhanden** → freier Wechsel, kein Dialog.
- **Noten vorhanden** → Warn-Dialog:
  > "Deine {N} bestehenden Noten wurden im System {alt} eingegeben. Ein Wechsel rechnet sie nicht
  > um — empfohlen nur, wenn du neu startest."
  Bestätigung nötig. **Keine** Auto-Konversion, keine Daten-Löschung (Rohwerte bleiben; sie können
  im neuen System ungültig wirken — das ist akzeptiert, da echter Wechsel selten).

## 8. Testing

- Pro System Unit-Tests (analog `systems.test.ts`, `calc.test.ts`):
  `format` / `parse` / `clamp` / `bestehtAb` / Schnitt.
- Richtungs-Tests: AT und DE-1-6 — Schnitt korrekt, Farbe korrekt invertiert.
- Roundtrip `parse(format(x)) === x` für gültige Werte je System.
- `benoetigtePunkte` je Richtung (höher- und niedriger-besser) inkl. `erreicht` / `unmoeglich`.

## 9. Offene Entscheidungen (im Design bestätigt)

- Spaltenname `punkte` bleibt (kein Rename).
- Demo-Notenrechner bleibt DE-only.
- Kategorie-/Gewichtungsmodell unangetastet.
- Sprache ≠ Notensystem (unabhängige Achsen) — Sprach-Spalte/Logik gehört in Subsystem-2-Spec.

## 10. Nächster Schritt

Implementierungsplan via `writing-plans` für genau dieses Subsystem. Danach separater Spec für
Subsystem 2 (i18n / EN-UI).
