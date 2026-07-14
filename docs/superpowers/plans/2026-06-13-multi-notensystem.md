# Multi-Notensystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notena unterstützt fünf Notensysteme (DE 0–15, DE 1–6, CH 1–6, AT 1–5, IB 1–7) mit korrekter Eingabe, Anzeige, Schnitt-Berechnung, Was-wäre-wenn und Farb-Coding pro System.

**Architecture:** `lib/grades/systems.ts` wird Single Source of Truth — jedes System implementiert ein erweitertes `Notensystem`-Interface (Bereich, Richtung, Format, Parse, Farbe). `calc.ts` wird system-agnostisch (Clamp/Range/Richtung kommen aus dem System). Das aktive System wird per React-Context (`NotensystemProvider`) aus dem Profil an die UI gereicht. Noten werden roh als `numeric(4,2)` gespeichert; keine Cross-System-Umrechnung.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Supabase (Postgres + RLS), Vitest, Tailwind, zod.

**Spec:** `docs/superpowers/specs/2026-06-13-multi-notensystem-design.md`

---

## Datei-Struktur (was wird angefasst)

**Reine Logik (`lib/grades/`):**
- `systems.ts` — MODIFY: Interface erweitern, 4 neue Systeme, DE-Format/Parse hierher ziehen. Wird Single Source of Truth.
- `calc.ts` — MODIFY: `clampPunkte` → `clamp(wert, system)`; `fachSchnitt`/`gesamtSchnitt`/`benoetigtePunkte` system-aware (optionaler `system`-Param, default DE für Back-Compat). `punkteZuNote` bleibt als deprecated Re-Export.
- `schnitt-farbe.ts` — MODIFY: delegiert an `system.farbe()`.
- `systems.test.ts`, `calc.test.ts`, `schnitt-farbe.test.ts` — MODIFY/ADD: Tests pro System inkl. Richtung.

**DB:**
- `supabase/migrations/0018_multi_notensystem.sql` — CREATE.
- `lib/supabase/database.types.ts` — REGENERATE.

**Server (`lib/`):**
- `lib/validation.ts` — MODIFY: `AddNoteSchema.punkte` flexibler.
- `lib/actions/schule.ts` — MODIFY: `addNote`/`updateNote` system-aware Validierung; neue Action `setNotensystem`.

**UI:**
- `components/notensystem-provider.tsx` — CREATE: Context + `useNotensystem()`-Hook.
- `app/(app)/layout.tsx` — MODIFY: Provider mit Profil-System mounten.
- `components/notenrechner/{fach-card,jahres-tabelle,notenrechner-board,was-waere-wenn-panel}.tsx`, `components/was-waere-wenn-seite.tsx`, `components/dashboard/schnitt-karte.tsx` — MODIFY: `punkteZuNote`/lokales `fmt` → Hook.
- `app/demo/notenrechner/page.tsx` — MODIFY: fest `getNotensystem("de_0_15")` (Demo bleibt DE).
- `components/einstellungen/notensystem-wahl.tsx` — CREATE: Dropdown + Warn-Dialog.
- `app/(app)/einstellungen/page.tsx` — MODIFY: neue Komponente einbinden + `notensystem` laden.

---

## Annahmen (Domänen-Konventionen, im Zweifel mit Nepomuk gegenchecken)

- **DE 1–6 Tendenzen** werden als Dezimalnoten gespeichert (Standard-Konvention): `1−`=1.3, `2+`=1.7, `2`=2.0, `2−`=2.3, … `6+`=5.7. `1+` und `6−` sind ungültig.
- **CH** akzeptiert Werte 1–6 in 0.25-Schritten (4.5, 5.25). Schnitt-Anzeige 2 Nachkommastellen.
- **Bestehens-Schwellen** (für Farbe, nicht für Validierung): DE0-15 ≥5, DE1-6 ≤4, CH ≥4, AT ≤4, IB ≥4.
- **Farb-Schwellen** (gut/mittel): DE0-15 ≥10/≥7 · CH ≥5/≥4 · IB ≥5/≥4 · AT ≤2/≤4 · DE1-6 ≤2/≤4.

---

## Task 1: Notensystem-Interface erweitern + DE_0_15 als Single Source

**Files:**
- Modify: `lib/grades/systems.ts`
- Modify: `lib/grades/calc.ts`
- Test: `lib/grades/systems.test.ts`

- [ ] **Step 1: Failing test für neue DE-Methoden schreiben**

In `lib/grades/systems.test.ts` ans Ende einfügen:

```ts
describe("DE_0_15 erweitert", () => {
  it("hat Bereich/Richtung/Schwellen", () => {
    expect(DE_0_15.min).toBe(0);
    expect(DE_0_15.max).toBe(15);
    expect(DE_0_15.step).toBe(1);
    expect(DE_0_15.richtung).toBe("hoeher_besser");
    expect(DE_0_15.bestehtAb).toBe(5);
  });
  it("formatNote gibt Tendenz-Note", () => {
    expect(DE_0_15.formatNote(15)).toBe("1+");
    expect(DE_0_15.formatNote(13)).toBe("1−");
    expect(DE_0_15.formatNote(0)).toBe("6");
  });
  it("formatSchnitt rundet auf 1 Nachkommastelle, de-DE", () => {
    expect(DE_0_15.formatSchnitt(11.73)).toBe("11,7");
  });
  it("parse akzeptiert Note und rohe Punkte", () => {
    expect(DE_0_15.parse("2+")).toBe(12);
    expect(DE_0_15.parse("14")).toBe(14);
    expect(DE_0_15.parse("99")).toBeNull();
  });
  it("farbe nach Schwellen", () => {
    expect(DE_0_15.farbe(11)).toBe("var(--success)");
    expect(DE_0_15.farbe(8)).toBe("#f59e0b");
    expect(DE_0_15.farbe(3)).toBe("var(--destructive)");
  });
});
```

- [ ] **Step 2: Test ausführen, Fehlschlag bestätigen**

Run: `npx vitest run lib/grades/systems.test.ts`
Expected: FAIL (`min`/`formatNote`/… existieren nicht).

- [ ] **Step 3: `systems.ts` neu schreiben (DE-Logik herziehen, Interface erweitern)**

Ersetze den gesamten Inhalt von `lib/grades/systems.ts`:

```ts
/**
 * Notensystem-Abstraktion. Single Source of Truth für alle Systeme.
 * Jedes System kapselt Bereich, Richtung, Format, Parse und Farb-Logik.
 * Diese Datei importiert NICHT aus calc.ts (sonst Zyklus) — die DE-Note-Logik
 * lebt hier.
 */

export type NotensystemId = "de_0_15" | "de_1_6" | "ch_1_6" | "at_1_5" | "ib_1_7";
export type Richtung = "hoeher_besser" | "niedriger_besser";

export interface Notensystem {
  id: NotensystemId;
  label: string;
  min: number;
  max: number;
  /** Schrittweite gültiger Eingaben (1 = Ganzzahl, 0.25 = CH-Viertel). */
  step: number;
  richtung: Richtung;
  /** Schwelle „bestanden" (mit richtung interpretiert). Nur für Anzeige/Farbe. */
  bestehtAb: number;
  /** Nachkommastellen der Schnitt-Anzeige. */
  schnittDezimal: number;
  /** Einzelnote/Label, z.B. 13 -> "1−" (DE) oder 4.5 -> "4,5" (CH). */
  formatNote(wert: number): string;
  /** Schnitt mit fixen Nachkommastellen, de-DE. */
  formatSchnitt(wert: number): string;
  /** Eingabe-String -> gespeicherter Wert, oder null bei ungültig. */
  parse(eingabe: string): number | null;
  /** CSS-Farbe für einen Schnitt (richtungsabhängig). */
  farbe(schnitt: number): string;
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────

function deFix(wert: number, dezimal: number): string {
  return wert.toLocaleString("de-DE", {
    minimumFractionDigits: dezimal,
    maximumFractionDigits: dezimal,
  });
}

/** Natürliche Zahl-Darstellung ohne erzwungene Nachkommastellen (max 2). */
function deNum(wert: number): string {
  return wert.toLocaleString("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Farb-Logik nach Richtung: bei hoeher_besser ist großer Wert gut, bei
 * niedriger_besser ist kleiner Wert gut. `gut`/`mittel` sind Schwellen in
 * Richtung „besser".
 */
function farbeNachRichtung(
  schnitt: number,
  richtung: Richtung,
  gut: number,
  mittel: number,
): string {
  const istGut = richtung === "hoeher_besser" ? schnitt >= gut : schnitt <= gut;
  const istMittel = richtung === "hoeher_besser" ? schnitt >= mittel : schnitt <= mittel;
  if (istGut) return "var(--success)";
  if (istMittel) return "#f59e0b";
  return "var(--destructive)";
}

function clampZu(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}

// ── DE Oberstufe (0–15) ────────────────────────────────────────────────────

/** Punkte -> Tendenz-Note (15 -> "1+", 13 -> "1−", 0 -> "6"). */
function de0_15FormatNote(punkte: number): string {
  const p = Math.round(clampZu(punkte, 0, 15));
  if (p === 0) return "6";
  const grundnote = 6 - Math.ceil(p / 3);
  const rest = (p - 1) % 3;
  const tendenz = rest === 2 ? "+" : rest === 0 ? "−" : "";
  return `${grundnote}${tendenz}`;
}

/** Note ("2+") -> Punkte. Akzeptiert auch rohe Ganzzahl-Punkte ("14"). */
function de0_15Parse(eingabe: string): number | null {
  const n = eingabe.trim().replace(",", ".");
  if (n === "") return null;
  // Rohe Punkte?
  if (/^\d{1,2}$/.test(n)) {
    const p = Number(n);
    return p >= 0 && p <= 15 ? p : null;
  }
  if (n === "6") return 0;
  // Tendenz-Note. Akzeptiere Bindestrich (U+002D) und Minus (U+2212).
  const match = /^([1-5])([+\-−]?)$/.exec(n);
  if (!match) return null;
  const grundnote = Number(match[1]);
  const tendenz = match[2];
  const hoechster = (6 - grundnote) * 3; // 1->15, 2->12, ... 5->3
  const punkte =
    tendenz === "+" ? hoechster : tendenz === "-" || tendenz === "−" ? hoechster - 2 : hoechster - 1;
  return clampZu(punkte, 0, 15);
}

export const DE_0_15: Notensystem = {
  id: "de_0_15",
  label: "Deutschland — Oberstufe (0–15 Punkte)",
  min: 0,
  max: 15,
  step: 1,
  richtung: "hoeher_besser",
  bestehtAb: 5,
  schnittDezimal: 1,
  formatNote: de0_15FormatNote,
  formatSchnitt: (w) => deFix(w, 1),
  parse: de0_15Parse,
  farbe: (s) => farbeNachRichtung(s, "hoeher_besser", 10, 7),
};

const ALLE: Record<NotensystemId, Notensystem> = {
  de_0_15: DE_0_15,
  // weitere Systeme folgen in den nächsten Tasks
} as Record<NotensystemId, Notensystem>;

/** Liefert das Notensystem zur Id, fällt auf DE zurück. */
export function getNotensystem(id: string): Notensystem {
  return ALLE[id as NotensystemId] ?? DE_0_15;
}
```

Die nächsten Tasks fügen ihre Systeme jeweils mit einer Zeile zum `ALLE`-Record hinzu.

- [ ] **Step 4: `calc.ts` anpassen — clamp generalisieren, punkteZuNote als Re-Export**

In `lib/grades/calc.ts` den Kopf und `clampPunkte`/`punkteZuNote` ersetzen:

```ts
/**
 * Notenrechner-Kernlogik. System-agnostisch: Bereich/Richtung kommen über das
 * Notensystem rein (default DE für Back-Compat).
 */

import {
  type Fach,
  type Kategorie,
  type GewichtungConfig,
  type Note,
  DEFAULT_GEWICHTUNG_CONFIG,
} from "./types";
import { DE_0_15, type Notensystem } from "./systems";

/** Begrenzt einen Wert auf den gültigen Bereich des Systems. */
export function clamp(wert: number, system: Notensystem = DE_0_15): number {
  if (Number.isNaN(wert)) return system.min;
  return Math.min(system.max, Math.max(system.min, wert));
}

/** @deprecated Nutze clamp(wert, system). Bleibt für Alt-Aufrufer. */
export function clampPunkte(punkte: number): number {
  return clamp(punkte, DE_0_15);
}

export function runde(wert: number, dezimal = 1): number {
  const f = 10 ** dezimal;
  return Math.round(wert * f) / f;
}

/** @deprecated Nutze system.formatNote(). Re-Export auf DE für Alt-Komponenten. */
export function punkteZuNote(punkte: number): string {
  return DE_0_15.formatNote(punkte);
}
```

Dann in `fachSchnitt`, `kategorieSchnitt` und überall sonst `clampPunkte(n.punkte)` durch `clamp(n.punkte, system)` ersetzen und den Funktionen einen optionalen letzten Parameter `system: Notensystem = DE_0_15` geben. Konkret die Signaturen:

```ts
export function kategorieSchnitt(noten: Note[], kategorie: Kategorie, system: Notensystem = DE_0_15): number | null {
  // ... clampPunkte(n.punkte) -> clamp(n.punkte, system)
}
export function fachSchnitt(noten: Note[], config?: GewichtungConfig, system: Notensystem = DE_0_15): number | null {
  // ... clampPunkte(n.punkte) -> clamp(n.punkte, system)
}
export function fachSchnittGerundet(noten: Note[], config?: GewichtungConfig, system: Notensystem = DE_0_15): number | null {
  const s = fachSchnitt(noten, config, system);
  return s === null ? null : runde(s);
}
export function gesamtSchnitt(faecher: Fach[], system: Notensystem = DE_0_15): number | null {
  // ... fachSchnitt(fach.noten, fach.gewichtungConfig, system)
}
export function gesamtSchnittGerundet(faecher: Fach[], system: Notensystem = DE_0_15): number | null {
  const s = gesamtSchnitt(faecher, system);
  return s === null ? null : runde(s);
}
```

- [ ] **Step 5: `benoetigtePunkte` system-aware machen**

In `lib/grades/calc.ts` `benoetigtePunkte` ersetzen:

```ts
export function benoetigtePunkte(
  noten: Note[],
  config: GewichtungConfig | undefined,
  kategorie: Kategorie,
  gewicht: number,
  ziel: number,
  system: Notensystem = DE_0_15,
): number | "erreicht" | "unmoeglich" {
  const aktuell = fachSchnitt(noten, config, system);
  const zielErreicht = (s: number) =>
    system.richtung === "hoeher_besser" ? runde(s) >= ziel : runde(s) <= ziel;
  if (aktuell !== null && zielErreicht(aktuell)) return "erreicht";

  // Gültige Werte aufsteigend erzeugen.
  const werte: number[] = [];
  for (let v = system.min; v <= system.max + 1e-9; v += system.step) {
    werte.push(Math.round(v / system.step) * system.step);
  }
  // hoeher_besser: kleinste ausreichende Note zuerst -> aufsteigend durchsuchen.
  // niedriger_besser: größte noch ausreichende Note zuerst -> absteigend.
  const reihe = system.richtung === "hoeher_besser" ? werte : [...werte].reverse();
  for (const v of reihe) {
    const mitProbe = fachSchnitt([...noten, { punkte: v, kategorie, gewicht }], config, system);
    if (mitProbe !== null && zielErreicht(mitProbe)) return v;
  }
  return "unmoeglich";
}
```

Ziel ist die *gerade noch ausreichende* Note (geringster Aufwand): bei `hoeher_besser` die kleinste, die das Ziel erreicht; bei `niedriger_besser` die größte (numerisch schlechteste), die noch reicht. Daher die Suchrichtung. Verifiziere mit Test in Step 6.

- [ ] **Step 6: Bestehenden calc-Test laufen lassen (Back-Compat)**

Run: `npx vitest run lib/grades/`
Expected: PASS — alle Alt-Tests grün (DE-Default verändert nichts), neue DE-Tests aus Step 1 grün.

- [ ] **Step 7: Commit**

```bash
git add lib/grades/systems.ts lib/grades/calc.ts lib/grades/systems.test.ts
git commit -m "refactor: Notensystem-Interface erweitern, calc system-agnostisch (DE-Default)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: DE-Schulnoten-System (1–6, Tendenz, niedriger=besser)

**Files:**
- Modify: `lib/grades/systems.ts`
- Test: `lib/grades/systems.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { DE_1_6 } from "./systems";

describe("DE_1_6", () => {
  it("Bereich + Richtung", () => {
    expect(DE_1_6.min).toBe(1);
    expect(DE_1_6.max).toBe(6);
    expect(DE_1_6.richtung).toBe("niedriger_besser");
  });
  it("parse Tendenz -> Dezimalnote", () => {
    expect(DE_1_6.parse("2")).toBe(2);
    expect(DE_1_6.parse("2+")).toBe(1.7);
    expect(DE_1_6.parse("2-")).toBe(2.3);
    expect(DE_1_6.parse("1-")).toBe(1.3);
    expect(DE_1_6.parse("1+")).toBeNull(); // besser als 1 unmöglich
    expect(DE_1_6.parse("6-")).toBeNull(); // schlechter als 6 unmöglich
    expect(DE_1_6.parse("7")).toBeNull();
  });
  it("formatNote zurück zu Tendenz", () => {
    expect(DE_1_6.formatNote(2)).toBe("2");
    expect(DE_1_6.formatNote(1.7)).toBe("2+");
    expect(DE_1_6.formatNote(2.3)).toBe("2−");
  });
  it("farbe invertiert (klein = gut)", () => {
    expect(DE_1_6.farbe(1.5)).toBe("var(--success)");
    expect(DE_1_6.farbe(3.5)).toBe("#f59e0b");
    expect(DE_1_6.farbe(5)).toBe("var(--destructive)");
  });
});
```

- [ ] **Step 2: Test ausführen → FAIL** (`DE_1_6` nicht exportiert).
Run: `npx vitest run lib/grades/systems.test.ts`

- [ ] **Step 3: DE_1_6 implementieren** — in `systems.ts` vor dem `ALLE`-Record einfügen:

```ts
// ── DE Schulnoten (1–6, Tendenz, niedriger = besser) ───────────────────────

const DE_1_6_TENDENZ: Record<string, number> = { "+": -0.3, "-": 0.3, "−": 0.3, "": 0 };

function de1_6Parse(eingabe: string): number | null {
  const n = eingabe.trim();
  const m = /^([1-6])([+\-−]?)$/.exec(n);
  if (!m) return null;
  const basis = Number(m[1]);
  const delta = DE_1_6_TENDENZ[m[2]] ?? 0;
  const wert = Math.round((basis + delta) * 10) / 10;
  if (wert < 1 || wert > 6) return null; // 1+ / 6- ausschließen
  return wert;
}

function de1_6FormatNote(wert: number): string {
  const basis = Math.round(wert);
  const diff = Math.round((wert - basis) * 10) / 10;
  const tendenz = diff <= -0.3 ? "+" : diff >= 0.3 ? "−" : "";
  return `${basis}${tendenz}`;
}

export const DE_1_6: Notensystem = {
  id: "de_1_6",
  label: "Deutschland — Schulnoten (1–6)",
  min: 1,
  max: 6,
  step: 0.1,
  richtung: "niedriger_besser",
  bestehtAb: 4,
  schnittDezimal: 1,
  formatNote: de1_6FormatNote,
  formatSchnitt: (w) => deFix(w, 1),
  parse: de1_6Parse,
  farbe: (s) => farbeNachRichtung(s, "niedriger_besser", 2, 4),
};
```

Und im `ALLE`-Record ergänzen: `de_1_6: DE_1_6,`.

- [ ] **Step 4: Test ausführen → PASS**
Run: `npx vitest run lib/grades/systems.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/grades/systems.ts lib/grades/systems.test.ts
git commit -m "feat: DE-Schulnoten-System (1-6, Tendenz, niedriger=besser)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Schweiz-System (1–6, Kommastellen, höher=besser)

**Files:** Modify `lib/grades/systems.ts`; Test `lib/grades/systems.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { CH_1_6 } from "./systems";

describe("CH_1_6", () => {
  it("Bereich + Richtung + Step", () => {
    expect(CH_1_6.min).toBe(1);
    expect(CH_1_6.max).toBe(6);
    expect(CH_1_6.step).toBe(0.25);
    expect(CH_1_6.richtung).toBe("hoeher_besser");
  });
  it("parse Dezimal mit Komma und Punkt", () => {
    expect(CH_1_6.parse("4,5")).toBe(4.5);
    expect(CH_1_6.parse("5.25")).toBe(5.25);
    expect(CH_1_6.parse("6")).toBe(6);
    expect(CH_1_6.parse("4,1")).toBeNull(); // kein 0.25-Schritt
    expect(CH_1_6.parse("0,5")).toBeNull(); // unter min
  });
  it("formatNote mit Komma", () => {
    expect(CH_1_6.formatNote(4.5)).toBe("4,5");
    expect(CH_1_6.formatNote(5.25)).toBe("5,25");
  });
  it("farbe (>=4 gut genug)", () => {
    expect(CH_1_6.farbe(5)).toBe("var(--success)");
    expect(CH_1_6.farbe(4)).toBe("#f59e0b");
    expect(CH_1_6.farbe(3)).toBe("var(--destructive)");
  });
});
```

- [ ] **Step 2: Test ausführen → FAIL**
Run: `npx vitest run lib/grades/systems.test.ts`

- [ ] **Step 3: CH_1_6 implementieren** — in `systems.ts`:

```ts
// ── Schweiz (1–6, Viertelnoten, höher = besser) ────────────────────────────

function ch1_6Parse(eingabe: string): number | null {
  const n = eingabe.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(n)) return null;
  const wert = Number(n);
  if (wert < 1 || wert > 6) return null;
  // Auf 0.25-Schritt prüfen.
  if (Math.abs(wert * 4 - Math.round(wert * 4)) > 1e-9) return null;
  return Math.round(wert * 4) / 4;
}

export const CH_1_6: Notensystem = {
  id: "ch_1_6",
  label: "Schweiz (1–6)",
  min: 1,
  max: 6,
  step: 0.25,
  richtung: "hoeher_besser",
  bestehtAb: 4,
  schnittDezimal: 2,
  formatNote: (w) => deNum(w),
  formatSchnitt: (w) => deFix(w, 2),
  parse: ch1_6Parse,
  farbe: (s) => farbeNachRichtung(s, "hoeher_besser", 5, 4),
};
```

Und im `ALLE`-Record ergänzen: `ch_1_6: CH_1_6,`.

- [ ] **Step 4: Test ausführen → PASS**
Run: `npx vitest run lib/grades/systems.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/grades/systems.ts lib/grades/systems.test.ts
git commit -m "feat: Schweiz-Notensystem (1-6, Viertelnoten)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Österreich-System (1–5, niedriger=besser)

**Files:** Modify `lib/grades/systems.ts`; Test `lib/grades/systems.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { AT_1_5 } from "./systems";

describe("AT_1_5", () => {
  it("Bereich + Richtung", () => {
    expect(AT_1_5.min).toBe(1);
    expect(AT_1_5.max).toBe(5);
    expect(AT_1_5.richtung).toBe("niedriger_besser");
  });
  it("parse nur Ganzzahl 1-5", () => {
    expect(AT_1_5.parse("1")).toBe(1);
    expect(AT_1_5.parse("5")).toBe(5);
    expect(AT_1_5.parse("0")).toBeNull();
    expect(AT_1_5.parse("6")).toBeNull();
    expect(AT_1_5.parse("2,5")).toBeNull();
  });
  it("formatNote", () => {
    expect(AT_1_5.formatNote(2)).toBe("2");
  });
  it("farbe invertiert", () => {
    expect(AT_1_5.farbe(1.5)).toBe("var(--success)");
    expect(AT_1_5.farbe(5)).toBe("var(--destructive)");
  });
});
```

- [ ] **Step 2: Test ausführen → FAIL**
Run: `npx vitest run lib/grades/systems.test.ts`

- [ ] **Step 3: AT_1_5 implementieren** — in `systems.ts`:

```ts
// ── Österreich (1–5, niedriger = besser) ───────────────────────────────────

function ganzzahlParse(min: number, max: number) {
  return (eingabe: string): number | null => {
    const n = eingabe.trim();
    if (!/^\d+$/.test(n)) return null;
    const w = Number(n);
    return w >= min && w <= max ? w : null;
  };
}

export const AT_1_5: Notensystem = {
  id: "at_1_5",
  label: "Österreich (1–5)",
  min: 1,
  max: 5,
  step: 1,
  richtung: "niedriger_besser",
  bestehtAb: 4,
  schnittDezimal: 1,
  formatNote: (w) => deNum(w),
  formatSchnitt: (w) => deFix(w, 1),
  parse: ganzzahlParse(1, 5),
  farbe: (s) => farbeNachRichtung(s, "niedriger_besser", 2, 4),
};
```

Und im `ALLE`-Record ergänzen: `at_1_5: AT_1_5,`.

- [ ] **Step 4: Test ausführen → PASS**
Run: `npx vitest run lib/grades/systems.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/grades/systems.ts lib/grades/systems.test.ts
git commit -m "feat: Oesterreich-Notensystem (1-5)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: IB-System (1–7, höher=besser)

**Files:** Modify `lib/grades/systems.ts`; Test `lib/grades/systems.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { IB_1_7 } from "./systems";

describe("IB_1_7", () => {
  it("Bereich + Richtung", () => {
    expect(IB_1_7.min).toBe(1);
    expect(IB_1_7.max).toBe(7);
    expect(IB_1_7.richtung).toBe("hoeher_besser");
  });
  it("parse nur Ganzzahl 1-7", () => {
    expect(IB_1_7.parse("7")).toBe(7);
    expect(IB_1_7.parse("0")).toBeNull();
    expect(IB_1_7.parse("8")).toBeNull();
  });
  it("farbe (>=5 gut)", () => {
    expect(IB_1_7.farbe(6)).toBe("var(--success)");
    expect(IB_1_7.farbe(4)).toBe("#f59e0b");
    expect(IB_1_7.farbe(2)).toBe("var(--destructive)");
  });
});
```

- [ ] **Step 2: Test ausführen → FAIL**
Run: `npx vitest run lib/grades/systems.test.ts`

- [ ] **Step 3: IB_1_7 implementieren** — in `systems.ts` (nutzt `ganzzahlParse` aus Task 4):

```ts
// ── IB (1–7, höher = besser) ───────────────────────────────────────────────

export const IB_1_7: Notensystem = {
  id: "ib_1_7",
  label: "International Baccalaureate (1–7)",
  min: 1,
  max: 7,
  step: 1,
  richtung: "hoeher_besser",
  bestehtAb: 4,
  schnittDezimal: 1,
  formatNote: (w) => deNum(w),
  formatSchnitt: (w) => deFix(w, 1),
  parse: ganzzahlParse(1, 7),
  farbe: (s) => farbeNachRichtung(s, "hoeher_besser", 5, 4),
};
```

Und im `ALLE`-Record ergänzen: `ib_1_7: IB_1_7,`. Danach den Helfer `_registriere` aus Task 1 entfernen (nicht mehr gebraucht, alle Systeme statisch registriert).

- [ ] **Step 4: Test ausführen → PASS**
Run: `npx vitest run lib/grades/systems.test.ts`

- [ ] **Step 5: `ALLE_SYSTEME`-Liste für UI exportieren** — ans Ende von `systems.ts`:

```ts
/** Alle Systeme als Liste (für Dropdowns), DE zuerst. */
export const ALLE_SYSTEME: Notensystem[] = [DE_0_15, DE_1_6, CH_1_6, AT_1_5, IB_1_7];
```

- [ ] **Step 6: Commit**

```bash
git add lib/grades/systems.ts lib/grades/systems.test.ts
git commit -m "feat: IB-Notensystem (1-7) + ALLE_SYSTEME-Liste

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `schnitt-farbe.ts` an System delegieren

**Files:** Modify `lib/grades/schnitt-farbe.ts`, `lib/grades/schnitt-farbe.test.ts`

- [ ] **Step 1: Failing test** — `schnitt-farbe.test.ts` ersetzen:

```ts
import { describe, it, expect } from "vitest";
import { schnittFarbe } from "./schnitt-farbe";
import { DE_0_15, AT_1_5 } from "./systems";

describe("schnittFarbe", () => {
  it("null -> dim", () => {
    expect(schnittFarbe(null)).toBe("var(--text-dim)");
  });
  it("DE default unverändert", () => {
    expect(schnittFarbe(11)).toBe("var(--success)");
    expect(schnittFarbe(3)).toBe("var(--destructive)");
  });
  it("system-aware (AT invertiert)", () => {
    expect(schnittFarbe(1.5, AT_1_5)).toBe("var(--success)");
    expect(schnittFarbe(5, AT_1_5)).toBe("var(--destructive)");
    expect(schnittFarbe(11, DE_0_15)).toBe("var(--success)");
  });
});
```

- [ ] **Step 2: Test ausführen → FAIL** (zweiter Parameter unbekannt).
Run: `npx vitest run lib/grades/schnitt-farbe.test.ts`

- [ ] **Step 3: `schnitt-farbe.ts` ersetzen**

```ts
import { DE_0_15, type Notensystem } from "./systems";

/** CSS-Farb-Variable für einen Schnitt, richtungsabhängig je System. */
export function schnittFarbe(schnitt: number | null, system: Notensystem = DE_0_15): string {
  if (schnitt === null) return "var(--text-dim)";
  return system.farbe(schnitt);
}
```

- [ ] **Step 4: Test ausführen → PASS**
Run: `npx vitest run lib/grades/schnitt-farbe.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/grades/schnitt-farbe.ts lib/grades/schnitt-farbe.test.ts
git commit -m "refactor: schnittFarbe delegiert an system.farbe (richtungsabhängig)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: DB-Migration — numeric + CHECK-Erweiterung

**Files:** Create `supabase/migrations/0018_multi_notensystem.sql`; Regenerate `lib/supabase/database.types.ts`

- [ ] **Step 1: Migration schreiben** — `supabase/migrations/0018_multi_notensystem.sql`:

```sql
-- =====================================================================
-- Notena — Multi-Notensystem.
-- punkte: smallint -> numeric(4,2) (CH-Kommanoten). Coarse-Guard bleibt.
-- notensystem-CHECK um DE-1-6/CH/AT/IB erweitern.
-- Bestehende Daten (0-15, de_0_15) bleiben gültig — kein Backfill.
-- =====================================================================

alter table public.schule_note
  alter column punkte type numeric(4,2) using punkte::numeric;

alter table public.schule_note
  drop constraint if exists schule_note_punkte_check;
alter table public.schule_note
  add constraint schule_note_punkte_check check (punkte >= 0 and punkte <= 15);

alter table public.nutzer_profil
  drop constraint if exists nutzer_profil_notensystem_check;
alter table public.nutzer_profil
  add constraint nutzer_profil_notensystem_check
    check (notensystem in ('de_0_15','de_1_6','ch_1_6','at_1_5','ib_1_7'));
```

Hinweis: Der genaue Name des alten punkte-CHECK-Constraints kann abweichen. Vor dem Anwenden prüfen mit:
`select conname from pg_constraint where conrelid = 'public.schule_note'::regclass and contype = 'c';`
und ggf. den `drop constraint if exists`-Namen anpassen.

- [ ] **Step 2: Migration anwenden** (Supabase MCP)

Tool: `mcp__claude_ai_Supabase__apply_migration`
- `name`: `0018_multi_notensystem`
- `query`: Inhalt aus Step 1
Vorher mit `list_tables` (Projekt `rxmcexzlwocgfocyligd`) den aktuellen Spaltentyp/Constraint verifizieren.

- [ ] **Step 3: Erfolg prüfen**

Tool: `mcp__claude_ai_Supabase__execute_sql`
Query: `select data_type, numeric_precision, numeric_scale from information_schema.columns where table_name='schule_note' and column_name='punkte';`
Expected: `numeric`, precision 4, scale 2.

- [ ] **Step 4: TS-Typen regenerieren**

Tool: `mcp__claude_ai_Supabase__generate_typescript_types` → Inhalt in `lib/supabase/database.types.ts` schreiben.
Hinweis: `schule_note.punkte` bleibt im generierten Typ `number` (Supabase mappt numeric → number). `mapNote`/`NoteRow` brauchen daher keine Änderung.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0018_multi_notensystem.sql lib/supabase/database.types.ts
git commit -m "feat(db): punkte numeric(4,2) + notensystem-CHECK fuer DE16/CH/AT/IB

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Server Actions + Validierung system-aware

**Files:** Modify `lib/validation.ts`, `lib/actions/schule.ts`

- [ ] **Step 1: `AddNoteSchema.punkte` lockern** — in `lib/validation.ts`:

```ts
export const AddNoteSchema = z.object({
  fachId: FachIdSchema,
  punkte: z.number().min(0).max(15), // .int() entfällt (CH-Kommas); Per-System-Check in der Action
  kategorie: KategorieSchema,
  bezeichnung: z.string().max(200).optional(),
  gewicht: z.number().positive().max(10).optional(),
});
```

- [ ] **Step 2: Helper „aktives System des Users laden" + Validierung in `addNote`/`updateNote`**

In `lib/actions/schule.ts` oben importieren:

```ts
import { getNotensystem } from "@/lib/grades/systems";
```

Helper einfügen (nahe `requireUserId`):

```ts
async function userNotensystem(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("nutzer_profil")
    .select("notensystem")
    .eq("id", userId)
    .single();
  return getNotensystem(data?.notensystem ?? "de_0_15");
}

/** Prüft Wert gegen System (Bereich + Schritt). Toleranz 1e-6 wegen Float-Division (z.B. 1.7/0.1). */
function wertGueltig(wert: number, system: ReturnType<typeof getNotensystem>): boolean {
  if (!Number.isFinite(wert) || wert < system.min || wert > system.max) return false;
  const gerundet = Math.round(wert / system.step) * system.step;
  return Math.abs(gerundet - wert) < 1e-6;
}
```

In `addNote` die Validierung/Insert ersetzen:

```ts
export async function addNote(
  fachId: string,
  punkte: number,
  kategorie: Kategorie,
  bezeichnung?: string,
  gewicht?: number,
): Promise<AddNoteResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const system = await userNotensystem(supabase, userId);
    if (!wertGueltig(punkte, system)) {
      return { ok: false, error: `Note muss zwischen ${system.min} und ${system.max} liegen.` };
    }
    const { data, error } = await supabase.from("schule_note").insert({
      user_id: userId,
      fach_id: fachId,
      punkte, // roh speichern, KEIN Math.round
      kategorie,
      bezeichnung: bezeichnung?.trim() || null,
      gewicht: gewicht ?? 1,
    }).select("id").single();
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}
```

In `updateNote` analog: `userNotensystem` laden, `wertGueltig` prüfen, `punkte` roh (ohne `Math.round`) updaten. Die alte `if (!Number.isFinite(punkte) || punkte < 0 || punkte > 15)`-Prüfung und das `Math.round(punkte)` entfernen.

- [ ] **Step 3: `setNotensystem`-Action + Noten-Zähler**

Ans Ende von `lib/actions/schule.ts`:

```ts
/** Anzahl bestehender Noten des Users (für Wechsel-Warnung). */
export async function noteAnzahl(): Promise<number> {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { count } = await supabase
    .from("schule_note")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

const NOTENSYSTEM_IDS = ["de_0_15", "de_1_6", "ch_1_6", "at_1_5", "ib_1_7"] as const;

export async function setNotensystem(id: string): Promise<ActionResult> {
  if (!(NOTENSYSTEM_IDS as readonly string[]).includes(id)) {
    return { ok: false, error: "Unbekanntes Notensystem." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ notensystem: id })
      .eq("id", userId);
    if (error) return { ok: false, error: dbError(error) };
    revalidatePath("/noten");
    revalidatePath("/dashboard");
    revalidatePath("/einstellungen");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: dbError(e) };
  }
}
```

- [ ] **Step 4: Build/Typecheck**

Run: `npm run build`
Expected: kompiliert ohne Typfehler.

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts lib/actions/schule.ts
git commit -m "feat: Noten-Actions system-aware (roh speichern) + setNotensystem

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: NotensystemProvider + useNotensystem-Hook

**Files:** Create `components/notensystem-provider.tsx`; Modify `app/(app)/layout.tsx`

- [ ] **Step 1: Provider schreiben** — `components/notensystem-provider.tsx`:

```tsx
"use client";

import { createContext, useContext } from "react";
import { getNotensystem, type Notensystem } from "@/lib/grades/systems";

const NotensystemContext = createContext<Notensystem>(getNotensystem("de_0_15"));

export function NotensystemProvider({
  systemId,
  children,
}: {
  systemId: string;
  children: React.ReactNode;
}) {
  return (
    <NotensystemContext.Provider value={getNotensystem(systemId)}>
      {children}
    </NotensystemContext.Provider>
  );
}

export function useNotensystem(): Notensystem {
  return useContext(NotensystemContext);
}
```

- [ ] **Step 2: Provider im App-Layout mounten** — `app/(app)/layout.tsx`

Lies die Datei zuerst. Das Layout ist eine async Server-Komponente mit Auth/Onboarding-Check. Lade dort das Profil-Feld `notensystem` (falls noch nicht geladen) und wickle den vorhandenen Children-Baum in `<NotensystemProvider systemId={notensystem}>`. Konkret:

```tsx
import { NotensystemProvider } from "@/components/notensystem-provider";
// ... im bestehenden supabase-Query das Feld ergänzen:
//   .select("onboarding_completed, notensystem")   (vorhandene Felder beibehalten!)
const notensystem = profil?.notensystem ?? "de_0_15";
// ... return:
return (
  <NotensystemProvider systemId={notensystem}>
    {/* bestehender Layout-JSX-Baum unverändert */}
  </NotensystemProvider>
);
```

Hinweis: Falls das Layout aktuell kein Profil lädt, den vorhandenen Supabase-Client nutzen und einen `.select("notensystem")`-Query ergänzen (eine Query, kein N+1).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: kompiliert.

- [ ] **Step 4: Commit**

```bash
git add components/notensystem-provider.tsx "app/(app)/layout.tsx"
git commit -m "feat: NotensystemProvider + useNotensystem-Hook

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Komponenten auf Hook umstellen (Anzeige)

**Files:** Modify `components/notenrechner/{notenrechner-board,fach-card,jahres-tabelle,was-waere-wenn-panel}.tsx`, `components/was-waere-wenn-seite.tsx`, `components/dashboard/schnitt-karte.tsx`

Ziel: Jeder direkte Import von `punkteZuNote` aus `@/lib/grades/calc` und jedes lokale `fmt(schnitt)` (toLocaleString) wird durch den Hook ersetzt. Schnitt-Berechnungen, die `gesamtSchnittGerundet`/`fachSchnittGerundet`/`benoetigtePunkte` aufrufen, bekommen das `system` als Argument.

- [ ] **Step 1: `notenrechner-board.tsx` umstellen**

```tsx
// Import ergänzen:
import { useNotensystem } from "@/components/notensystem-provider";
// Import von punkteZuNote aus calc ENTFERNEN; gesamtSchnittGerundet bleibt:
import { gesamtSchnittGerundet } from "@/lib/grades/calc";

// In der Komponente, oben:
const system = useNotensystem();

// lokales fmt() ersetzen durch system.formatSchnitt:
//   fmt(x)            -> (x === null ? "–" : system.formatSchnitt(x))
// gesamt-Berechnung:
const gesamt = gesamtSchnittGerundet(aktiveFaecher, system);
const gesamtFarbe = schnittFarbe(gesamt, system);
// "Note {punkteZuNote(gesamt)}" -> "Note {gesamt === null ? "–" : system.formatNote(gesamt)}"
```

Den lokalen `fmt`-Helper entweder löschen (wenn nur fürs Board) oder durch eine Inline-Nutzung von `system.formatSchnitt` ersetzen. `schnittFarbe`-Aufrufe bekommen `, system`.

- [ ] **Step 2: `fach-card.tsx` umstellen**

```tsx
import { useNotensystem } from "@/components/notensystem-provider";
// punkteZuNote-Import aus calc ENTFERNEN.
const system = useNotensystem();
// Alle punkteZuNote(x) -> system.formatNote(x)
// Einzelnoten-Anzeige {n.punkte} -> {system.formatNote(n.punkte)}
// fachSchnittGerundet(...)/kategorieSchnitt(...) Aufrufe: , system ergänzen
// schnittFarbe(n.punkte) -> schnittFarbe(n.punkte, system)
// Balken-Höhe (n.punkte / 15) -> ((n.punkte - system.min) / (system.max - system.min))
```

Wichtig: Die Balken-Normalisierung `(n.punkte / 15)` muss auf `((n.punkte - system.min) / (system.max - system.min))` umgestellt werden, sonst sind CH/AT/IB-Balken falsch skaliert.

- [ ] **Step 3: `jahres-tabelle.tsx` umstellen**

```tsx
import { useNotensystem } from "@/components/notensystem-provider";
const system = useNotensystem();
// {punkteZuNote(wert)} -> {system.formatNote(wert)}
// {punkteZuNote(uebersicht.gesamtJahr)} -> {system.formatNote(uebersicht.gesamtJahr)}
// Zahl-Anzeige der Schnitte ggf. system.formatSchnitt
```

- [ ] **Step 4: `was-waere-wenn-panel.tsx` + `was-waere-wenn-seite.tsx` umstellen**

```tsx
import { useNotensystem } from "@/components/notensystem-provider";
const system = useNotensystem();
// punkteZuNote(x) -> system.formatNote(x)
// fachSchnitt/wasWaereWenn/benoetigtePunkte Aufrufe: , system als letzten Param
// Eingabe-Slider/Range min={system.min} max={system.max} step={system.step}
```

In `was-waere-wenn-seite.tsx` zusätzlich: alle hartkodierten `0..15`-Bereiche (Slider, Schleifen) auf `system.min`/`system.max`/`system.step` umstellen.

- [ ] **Step 5: `dashboard/schnitt-karte.tsx` umstellen**

```tsx
import { useNotensystem } from "@/components/notensystem-provider";
const system = useNotensystem();
// "Note {punkteZuNote(gesamt)}" -> "Note {gesamt === null ? "–" : system.formatNote(gesamt)}"
```

Falls `schnitt-karte.tsx` eine Server-Komponente ist (kein `"use client"`): Dann kann der Hook dort nicht genutzt werden. In dem Fall das `notensystem` als Prop von der ladenden Page reinreichen und `getNotensystem(systemId)` direkt aufrufen. Vor dem Editieren `head -5 components/dashboard/schnitt-karte.tsx` prüfen.

- [ ] **Step 6: Build + Tests**

Run: `npm run build && npx vitest run`
Expected: kompiliert, alle Tests grün.

- [ ] **Step 7: Commit**

```bash
git add components/
git commit -m "refactor: Noten-Komponenten nutzen useNotensystem statt fester DE-Anzeige

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Demo-Notenrechner fixiert auf DE

**Files:** Modify `app/demo/notenrechner/page.tsx`

- [ ] **Step 1: Demo nutzt explizit DE-System**

Die öffentliche Demo hat keinen eingeloggten User → kein Provider. `punkteZuNote`-Importe bleiben hier funktional (Re-Export auf DE existiert weiter), ODER expliziter machen:

```tsx
import { getNotensystem } from "@/lib/grades/systems";
const system = getNotensystem("de_0_15");
// punkteZuNote(x) -> system.formatNote(x)
```

Minimal-Variante: nichts ändern (der deprecated `punkteZuNote`-Re-Export in calc.ts bleibt für genau diesen Fall). Dann diesen Task nur als Verifikation behandeln.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: kompiliert.

- [ ] **Step 3: Commit (falls geändert)**

```bash
git add app/demo/notenrechner/page.tsx
git commit -m "chore: Demo-Notenrechner explizit auf DE-System

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Einstellungen — System-Wahl mit Warn-Dialog

**Files:** Create `components/einstellungen/notensystem-wahl.tsx`; Modify `app/(app)/einstellungen/page.tsx`

- [ ] **Step 1: Komponente schreiben** — `components/einstellungen/notensystem-wahl.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ALLE_SYSTEME } from "@/lib/grades/systems";
import { setNotensystem } from "@/lib/actions/schule";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function NotensystemWahl({
  aktuell,
  noteAnzahl,
}: {
  aktuell: string;
  noteAnzahl: number;
}) {
  const [wert, setWert] = useState(aktuell);
  const [pending, start] = useTransition();
  const [zielId, setZielId] = useState<string | null>(null);

  function speichern(id: string) {
    start(async () => {
      const res = await setNotensystem(id);
      if (res.ok) {
        setWert(id);
        toast.success("Notensystem geändert.");
      } else {
        toast.error(res.error);
      }
      setZielId(null);
    });
  }

  function onChange(id: string) {
    if (id === wert) return;
    if (noteAnzahl > 0) {
      setZielId(id); // Warn-Dialog
    } else {
      speichern(id);
    }
  }

  return (
    <>
      <select
        value={wert}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
      >
        {ALLE_SYSTEME.map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>

      <AlertDialog open={zielId !== null} onOpenChange={(o) => !o && setZielId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notensystem wechseln?</AlertDialogTitle>
            <AlertDialogDescription>
              Deine {noteAnzahl} bestehenden Noten wurden im aktuellen System eingegeben.
              Ein Wechsel rechnet sie nicht um — empfohlen nur, wenn du neu startest.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => zielId && speichern(zielId)}>
              Trotzdem wechseln
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

Hinweis: Prüfe ob `components/ui/alert-dialog.tsx` existiert (`ls components/ui/alert-dialog.tsx`). Falls nicht, via shadcn hinzufügen — das erfordert eine npm/CLI-Aktion, daher **vorher Nepomuk fragen** (CLAUDE.md: keine Paket-Installation ohne Rückfrage). Alternativ den vorhandenen Dialog (`components/ui/dialog.tsx`) nutzen statt AlertDialog.

- [ ] **Step 2: In Einstellungen einbinden** — `app/(app)/einstellungen/page.tsx`

```tsx
import { NotensystemWahl } from "@/components/einstellungen/notensystem-wahl";
import { noteAnzahl } from "@/lib/actions/schule";
// Im bestehenden Profil-Query notensystem ergänzen:
//   .select("name, klasse, schule, eingabe_modus, ..., notensystem")
const aktuellesSystem = profil?.notensystem ?? "de_0_15";
const anzahl = await noteAnzahl();
// Im JSX, in Abschnitt B (Schule) oder E (Darstellung):
<NotensystemWahl aktuell={aktuellesSystem} noteAnzahl={anzahl} />
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: kompiliert.

- [ ] **Step 4: Commit**

```bash
git add components/einstellungen/notensystem-wahl.tsx "app/(app)/einstellungen/page.tsx"
git commit -m "feat: Notensystem-Wahl in Einstellungen mit Wechsel-Warnung

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 13: Noten-Eingabe respektiert System (parse + Bereich)

**Files:** Modify `components/notenrechner/fach-card.tsx`

Die Eingabe-Formulare (`NoteForm`/Edit in `fach-card.tsx`) parsen aktuell mit `Number(punkte)`. Sie müssen `system.parse()` nutzen, damit Noten ("2+"), CH-Kommas ("4,5") und Bereichsgrenzen korrekt sind.

- [ ] **Step 1: Eingabe über system.parse leiten**

In `fach-card.tsx` in den Submit-Handlern (`onSave`/Add, ~Zeile 465 und 536):

```tsx
const system = useNotensystem(); // bereits aus Task 10 vorhanden
// vorher: const p = Number(punkte);  if (Number.isNaN(p) || punkte === "") return;
const p = system.parse(punkte);
if (p === null) {
  toast.error(`Ungültige Note. Erlaubt: ${system.min}–${system.max}.`);
  return;
}
// p an onSave/addNote übergeben
```

Input-Attribute anpassen: `inputMode={system.step < 1 ? "decimal" : "numeric"}`, Platzhalter `placeholder={`z.B. ${system.formatNote(system.richtung === "hoeher_besser" ? system.max : system.min)}`}`.

- [ ] **Step 2: Build + manueller Test**

Run: `npm run build`
Dann lokal (`npm run dev`): CH-System in Einstellungen wählen, Note „4,5" eintragen → wird gespeichert und als „4,5" angezeigt; Schnitt korrekt. DE-System: „2+" eintragen → 12 Punkte.

- [ ] **Step 3: Commit**

```bash
git add components/notenrechner/fach-card.tsx
git commit -m "feat: Noten-Eingabe nutzt system.parse (Noten/Kommas/Bereich)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 14: Vollständige Verifikation

**Files:** keine

- [ ] **Step 1: Alle Tests**

Run: `npx vitest run`
Expected: alle grün.

- [ ] **Step 2: Production-Build**

Run: `npm run build`
Expected: erfolgreich, keine Typfehler.

- [ ] **Step 3: Manueller Smoke-Test pro System** (`npm run dev`)

Für jedes der 5 Systeme einmal in Einstellungen umschalten (mit leerem Noten-Stand testen, sonst Warn-Dialog):
- Note eintragen (System-typisch: DE „2+", DE1-6 „3", CH „4,5", AT „2", IB „6").
- Fach-Schnitt + Gesamt-Schnitt erscheinen korrekt formatiert.
- Farbe stimmt richtungsgemäß (AT/DE1-6: kleine Note = grün).
- Was-wäre-wenn-Slider hat korrekten Bereich.
- Dashboard-Schnitt-Karte zeigt korrektes Format.

- [ ] **Step 4: Wechsel-Warnung testen**

Mit ≥1 Note ein System wechseln → Warn-Dialog erscheint mit korrekter Anzahl; „Abbrechen" lässt System unverändert; „Trotzdem wechseln" ändert es.

- [ ] **Step 5: Abschluss-Commit (falls offene Änderungen)**

```bash
git add -A
git commit -m "test: Multi-Notensystem manuell verifiziert

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Hinweise für den Umsetzer

- **Reihenfolge wichtig:** Tasks 1–6 (reine Logik) sind die Basis und vollständig per Vitest testbar — hier nicht abkürzen, das ist das Fundament. Tasks 9–13 (UI) bauen darauf auf.
- **Keine npm-Installs ohne Rückfrage** (CLAUDE.md). Betrifft Task 12 (AlertDialog) — erst prüfen ob vorhanden.
- **Migration (Task 7)** ist die einzige nicht-reversible Aktion. Vorher mit `list_tables` den Ist-Zustand verifizieren. Auf der kleinen Beta-DB unkritisch.
- **Cross-System-Umrechnung gibt es bewusst nicht.** Wer das System wechselt, dessen Roh-Noten bleiben stehen.
- **i18n ist NICHT Teil dieses Plans** — separater Spec/Plan (Subsystem 2).
- **Bekannte Mini-Limitation (DE 1–6):** Dessen gültige Werte (1.0/1.3/1.7/2.0/…) sind nicht gleichmäßig gesteppt. `benoetigtePunkte` (Was-wäre-wenn) nutzt `step=0.1` und kann daher theoretisch einen nicht-kanonischen Zwischenwert (z.B. 1.2) als „benötigte Note" vorschlagen. Für v1 akzeptiert. Falls störend: später eine optionale `gueltigeWerte: number[]`-Property aufs System legen und die Schleife darüber laufen lassen.
