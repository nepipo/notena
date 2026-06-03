# Notenrechner Schicht 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notenrechner vollständig machen: Fach-Konfiguration (GK/LK, Farbe, Gewichtung), 6 Kategorien mit Gruppen-Mapping, Schnitt-Farbe, Klausur-Countdown, Einstellungen-Seite und Onboarding-Wizard.

**Architecture:** Gleiche Architektur wie Schicht 1 (Server Components laden, Client hält State, Server Actions persistieren, optimistische Updates + Rollback). Neue Logik-Helfer in `lib/grades/` sind reine Funktionen mit Vitest-Tests. Neue UI-Komponenten folgen dem bestehenden Pattern (shadcn + Tailwind v4 + Theme-CSS-Vars).

**Tech Stack:** Next.js 16 App Router, Supabase RLS, TypeScript strict, Vitest, sonner (Toast), shadcn/ui, Tailwind v4.

---

## File Structure

**Neue Dateien:**
- `supabase/migrations/0004_kategorien_onboarding.sql`
- `lib/grades/schnitt-farbe.ts` — Schnitt → Farb-Helper (rein, testbar)
- `lib/grades/schnitt-farbe.test.ts`
- `components/notenrechner/fach-dialog.tsx` — ⚙ Fach-Konfigurations-Dialog
- `components/notenrechner/klausur-section.tsx` — Klausur anlegen + Liste
- `app/settings/page.tsx` — Einstellungen
- `app/settings/actions.ts` — updatePraeferenzen
- `app/onboarding/page.tsx` — Onboarding-Wizard (2 Steps)

**Geänderte Dateien:**
- `lib/grades/types.ts` — Kategorie-Typ erweitern, Fach um `farbe`/`niveau`
- `lib/grades/calc.ts` — `kategorieZurGruppe` + `fachSchnitt` auf Gruppen umstellen
- `lib/grades/calc.test.ts` — Tests für neue Kategorien + Gruppen
- `lib/grades/db.ts` — `farbe`/`niveau`/`bezeichnung`/`gewicht` in Mapping
- `lib/grades/db.test.ts` — Tests dafür
- `lib/supabase/database.types.ts` — nach Migration neu generiert
- `app/dashboard/actions.ts` — `updateFach`, `addKlausur`, `removeKlausur`, `completeOnboarding`; `addNote` um `bezeichnung`/`gewicht` erweitern
- `app/dashboard/page.tsx` — Klausuren laden, Onboarding-Check
- `components/notenrechner/fach-card.tsx` — Farbe, GK/LK-Badge, Countdown-Badge, 6 Kategorien, Bezeichnung, Gewicht, ⚙-Button
- `components/notenrechner/notenrechner-board.tsx` — FachDialog + KlausurSection + Schnitt-Farbe im Hero; `handleAddNote` um `bezeichnung`/`gewicht` erweitern

---

## Task 1: Migration 0004 — Kategorien + Onboarding-Flag

**Files:**
- Create: `supabase/migrations/0004_kategorien_onboarding.sql`
- Modify: `lib/supabase/database.types.ts` (neu generiert)

> Diese Task wird vom Controller-Agent (nicht Subagent) direkt ausgeführt, da Supabase MCP-Tools bereits geladen sind.

- [ ] **Step 1: Migrationsdatei anlegen**

Create `supabase/migrations/0004_kategorien_onboarding.sql`:
```sql
-- =====================================================================
-- Project X — Schicht 2: Erweiterte Kategorien + Onboarding-Flag
-- =====================================================================

-- Bestehende CHECK-Constraint für kategorie entfernen und neu setzen.
ALTER TABLE public.schule_note
  DROP CONSTRAINT IF EXISTS schule_note_kategorie_check;

ALTER TABLE public.schule_note
  ADD CONSTRAINT schule_note_kategorie_check
  CHECK (kategorie = ANY (ARRAY[
    'klausur'::text, 'muendlich'::text, 'sonstige'::text,
    'test'::text, 'referat'::text, 'hausaufgabe'::text
  ]));

-- Onboarding-Flag auf nutzer_profil
ALTER TABLE public.nutzer_profil
  ADD COLUMN IF NOT EXISTS onboarding_abgeschlossen boolean NOT NULL DEFAULT false;
```

- [ ] **Step 2: Migration via Supabase MCP anwenden**

Supabase MCP `apply_migration` (project_id: `rxmcexzlwocgfocyligd`, name: `kategorien_onboarding`).
Expected: `{"success":true}`.

- [ ] **Step 3: Verifizieren**

Supabase MCP `execute_sql`: `SELECT column_name FROM information_schema.columns WHERE table_name = 'nutzer_profil' AND column_name = 'onboarding_abgeschlossen';`
Expected: 1 Zeile.

- [ ] **Step 4: TS-Types neu generieren**

Supabase MCP `generate_typescript_types` (project_id: `rxmcexzlwocgfocyligd`) → Ergebnis komplett in `lib/supabase/database.types.ts` schreiben.

- [ ] **Step 5: Commit**

```bash
cd ~/project-x && git add supabase/migrations/0004_kategorien_onboarding.sql lib/supabase/database.types.ts
git commit -m "feat: Migration 0004 — erweiterte Kategorien + onboarding_abgeschlossen"
```

---

## Task 2: Typen erweitern + Kategorie-Gruppen in calc.ts (TDD)

**Files:**
- Modify: `lib/grades/types.ts`
- Modify: `lib/grades/calc.ts`
- Modify: `lib/grades/calc.test.ts`

> Kern-Änderung: `fachSchnitt` iteriert nicht mehr über exakte Kategorien, sondern über zwei Gruppen (klausur / muendlich). Alle Kategorien ausser 'klausur' zählen zur muendlich-Gruppe. `Kategoriegewichtung.sonstige` wird deprecated aber nicht entfernt (Abwärtskompatibilität).

- [ ] **Step 1: Failing Tests schreiben**

Ans Ende von `lib/grades/calc.test.ts` anhängen:
```ts
describe("kategorieZurGruppe", () => {
  it("mappt klausur auf klausur", () => {
    expect(kategorieZurGruppe("klausur")).toBe("klausur");
  });
  it("mappt muendlich, test, referat, hausaufgabe, sonstige auf muendlich", () => {
    expect(kategorieZurGruppe("muendlich")).toBe("muendlich");
    expect(kategorieZurGruppe("test")).toBe("muendlich");
    expect(kategorieZurGruppe("referat")).toBe("muendlich");
    expect(kategorieZurGruppe("hausaufgabe")).toBe("muendlich");
    expect(kategorieZurGruppe("sonstige")).toBe("muendlich");
  });
});

describe("fachSchnitt mit neuen Kategorien", () => {
  it("Test-Noten fliessen in die muendlich-Gruppe", () => {
    const noten: Note[] = [
      { punkte: 12, kategorie: "klausur" },
      { punkte: 8, kategorie: "test" }, // test → muendlich-Gruppe
    ];
    // 50/50 Gewichtung: klausur=12, muendlich-Gruppe=8 → Schnitt = 10
    const result = fachSchnitt(noten, { klausur: 0.5, muendlich: 0.5 });
    expect(result).toBeCloseTo(10, 5);
  });
  it("Referat + Mündlich kombinieren sich in der muendlich-Gruppe", () => {
    const noten: Note[] = [
      { punkte: 14, kategorie: "referat", gewicht: 2 },
      { punkte: 10, kategorie: "muendlich", gewicht: 1 },
    ];
    // muendlich-Gruppe: (14*2 + 10*1) / 3 = 12.67, keine Klausur → Schnitt = 12.67
    const result = fachSchnitt(noten);
    expect(result).toBeCloseTo(38 / 3, 5);
  });
});
```

Importzeile oben in calc.test.ts ergänzen (kategorieZurGruppe importieren, Note importieren):
```ts
import {
  clampPunkte, runde, punkteZuNote, kategorieSchnitt,
  fachSchnitt, fachSchnittGerundet, gesamtSchnitt, wasWaereWenn,
  kategorieZurGruppe,
} from "./calc";
import type { Fach, Note } from "./types";
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

Run: `cd ~/project-x && npx vitest run lib/grades/calc.test.ts`
Expected: FAIL ("kategorieZurGruppe is not a function").

- [ ] **Step 3: types.ts erweitern**

`lib/grades/types.ts` komplett ersetzen:
```ts
/**
 * Datenmodell für den Notenrechner (deutsche Oberstufe, 0–15-Punkte-System).
 * Reine Typen — keine Logik, kein React, keine DB.
 */

/**
 * Kategorie einer Leistung.
 * Gruppen: klausur = schriftlich, alle anderen = mündlich.
 */
export type Kategorie =
  | "klausur"
  | "muendlich"
  | "test"
  | "referat"
  | "hausaufgabe"
  | "sonstige";

/** Eine einzelne Note/Leistung. */
export interface Note {
  id?: string;
  /** Punktwert 0–15 (15 = sehr gut+, 0 = ungenügend). */
  punkte: number;
  kategorie: Kategorie;
  /** ISO-Datum, optional (für Sortierung/Verlauf). */
  datum?: string;
  /** Einzelgewicht innerhalb der Gruppe (z.B. 2 für doppelt zählende Klausur). Default 1. */
  gewicht?: number;
  /** Freitext-Bezeichnung (z.B. "1. Klausur", "Referat Klimawandel"). */
  bezeichnung?: string;
}

/** Gewichtung der zwei Gruppen für den Fach-Schnitt (wird normalisiert). */
export interface Kategoriegewichtung {
  klausur: number;
  muendlich: number;
  /** @deprecated Nicht mehr verwendet. Alle Nicht-Klausur-Kategorien zählen zur muendlich-Gruppe. */
  sonstige: number;
}

/** Ein Fach mit seinen Noten und seiner Gewichtungs-Konfiguration. */
export interface Fach {
  id: string;
  name: string;
  noten: Note[];
  /** Kategoriegewichtung; fehlende Werte fallen auf den Default (50/50). */
  gewichtung?: Partial<Kategoriegewichtung>;
  /** Gewicht des Fachs im Gesamtschnitt (LK = 2, GK = 1). Default 1. */
  fachGewicht?: number;
  /** Hex-Farbe für UI-Akzent. */
  farbe?: string | null;
  /** 'grund' = GK, 'erhoeht' = LK. */
  niveau?: string;
}

/** Standard-Gewichtung: 50% Klausur, 50% mündlich. */
export const DEFAULT_GEWICHTUNG: Kategoriegewichtung = {
  klausur: 0.5,
  muendlich: 0.5,
  sonstige: 0,
};
```

- [ ] **Step 4: calc.ts aktualisieren**

`lib/grades/calc.ts` komplett ersetzen:
```ts
/**
 * Notenrechner-Kernlogik (0–15-Punkte-System, deutsche Oberstufe).
 *
 * Reine Funktionen, vollständig ohne Seiteneffekte — leicht testbar.
 * Regeln:
 *  - Alle Kategorien außer 'klausur' zählen zur muendlich-Gruppe.
 *  - Innerhalb einer Gruppe: gewichteter Durchschnitt (Note.gewicht).
 *  - Fach-Schnitt: gewichtete Kombination der zwei Gruppen. Gruppen OHNE Noten
 *    werden ignoriert und die Gewichte der verbleibenden renormalisiert.
 *  - Gesamt-Schnitt: über die Fächer, gewichtet mit fachGewicht.
 */

import {
  type Fach,
  type Kategorie,
  type Kategoriegewichtung,
  type Note,
  DEFAULT_GEWICHTUNG,
} from "./types";

/** Begrenzt einen Punktwert auf den gültigen Bereich 0–15. */
export function clampPunkte(punkte: number): number {
  if (Number.isNaN(punkte)) return 0;
  return Math.min(15, Math.max(0, punkte));
}

/** Rundet einen Wert auf n Dezimalstellen (Standard: 1). */
export function runde(wert: number, dezimal = 1): number {
  const f = 10 ** dezimal;
  return Math.round(wert * f) / f;
}

/**
 * Wandelt Punkte (0–15) in die klassische Notendarstellung um (z.B. 13 → "1−").
 */
export function punkteZuNote(punkte: number): string {
  const p = Math.round(clampPunkte(punkte));
  if (p === 0) return "6";
  const grundnote = 6 - Math.ceil(p / 3);
  const rest = (p - 1) % 3;
  const tendenz = rest === 2 ? "+" : rest === 0 ? "−" : "";
  return `${grundnote}${tendenz}`;
}

/**
 * Ordnet eine Kategorie einer der zwei Gruppen zu.
 * Nur 'klausur' ist schriftlich — alles andere ist mündlich.
 */
export function kategorieZurGruppe(k: Kategorie): "klausur" | "muendlich" {
  return k === "klausur" ? "klausur" : "muendlich";
}

/**
 * Gewichteter Durchschnitt der Noten EINER exakten Kategorie.
 * Wird für Detailansichten verwendet; fachSchnitt nutzt Gruppen.
 * @returns Schnitt (0–15) oder null, wenn keine Noten in der Kategorie.
 */
export function kategorieSchnitt(
  noten: Note[],
  kategorie: Kategorie,
): number | null {
  const relevant = noten.filter((n) => n.kategorie === kategorie);
  if (relevant.length === 0) return null;

  let summe = 0;
  let gewichtSumme = 0;
  for (const n of relevant) {
    const g = n.gewicht ?? 1;
    summe += clampPunkte(n.punkte) * g;
    gewichtSumme += g;
  }
  if (gewichtSumme === 0) return null;
  return summe / gewichtSumme;
}

/** Führt die konfigurierte Gewichtung mit dem Default zusammen. */
function aufloesenGewichtung(
  gewichtung?: Partial<Kategoriegewichtung>,
): Kategoriegewichtung {
  return { ...DEFAULT_GEWICHTUNG, ...gewichtung };
}

/**
 * Schnitt eines Fachs über zwei Gruppen (klausur / muendlich).
 * Alle Noten werden per kategorieZurGruppe einer Gruppe zugeordnet.
 * Gruppen ohne Noten werden ignoriert, die übrigen Gewichte renormalisiert.
 */
export function fachSchnitt(
  noten: Note[],
  gewichtung?: Partial<Kategoriegewichtung>,
): number | null {
  const g = aufloesenGewichtung(gewichtung);
  const gruppen = ["klausur", "muendlich"] as const;

  let summe = 0;
  let gewichtSumme = 0;

  for (const gruppe of gruppen) {
    const gruppenNoten = noten.filter(
      (n) => kategorieZurGruppe(n.kategorie) === gruppe,
    );
    if (gruppenNoten.length === 0) continue;

    let gruppeSumme = 0;
    let gruppeGewicht = 0;
    for (const n of gruppenNoten) {
      const gew = n.gewicht ?? 1;
      gruppeSumme += clampPunkte(n.punkte) * gew;
      gruppeGewicht += gew;
    }
    if (gruppeGewicht === 0) continue;

    const gruppenSchnitt = gruppeSumme / gruppeGewicht;
    const katGewicht = g[gruppe];
    if (katGewicht <= 0) continue;

    summe += gruppenSchnitt * katGewicht;
    gewichtSumme += katGewicht;
  }

  if (gewichtSumme === 0) return null;
  return summe / gewichtSumme;
}

/** Wie `fachSchnitt`, aber gerundet auf 1 Dezimalstelle (für die Anzeige). */
export function fachSchnittGerundet(
  noten: Note[],
  gewichtung?: Partial<Kategoriegewichtung>,
): number | null {
  const s = fachSchnitt(noten, gewichtung);
  return s === null ? null : runde(s);
}

/**
 * Gesamt-Schnitt über mehrere Fächer, gewichtet mit fachGewicht.
 * Fächer ohne Noten werden ignoriert.
 */
export function gesamtSchnitt(faecher: Fach[]): number | null {
  let summe = 0;
  let gewichtSumme = 0;
  for (const fach of faecher) {
    const schnitt = fachSchnitt(fach.noten, fach.gewichtung);
    if (schnitt === null) continue;
    const fg = fach.fachGewicht ?? 1;
    if (fg <= 0) continue;
    summe += schnitt * fg;
    gewichtSumme += fg;
  }
  if (gewichtSumme === 0) return null;
  return summe / gewichtSumme;
}

/** Gesamt-Schnitt gerundet auf 1 Dezimalstelle. */
export function gesamtSchnittGerundet(faecher: Fach[]): number | null {
  const s = gesamtSchnitt(faecher);
  return s === null ? null : runde(s);
}

/**
 * „Was-wäre-wenn": Fach-Schnitt, wenn eine hypothetische Note hinzukäme.
 */
export function wasWaereWenn(
  noten: Note[],
  hypothese: Note,
  gewichtung?: Partial<Kategoriegewichtung>,
): number | null {
  return fachSchnitt([...noten, hypothese], gewichtung);
}
```

- [ ] **Step 5: Tests laufen lassen — müssen bestehen**

Run: `cd ~/project-x && npx vitest run lib/grades/calc.test.ts`
Expected: PASS (alle Tests grün, inklusive der alten).

- [ ] **Step 6: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 7: Commit**

```bash
cd ~/project-x && git add lib/grades/types.ts lib/grades/calc.ts lib/grades/calc.test.ts
git commit -m "feat: Kategorie-Gruppen in calc.ts (test/referat/hausaufgabe → muendlich)"
```

---

## Task 3: Schnitt-Farbe Helper

**Files:**
- Create: `lib/grades/schnitt-farbe.ts`
- Create: `lib/grades/schnitt-farbe.test.ts`

- [ ] **Step 1: Failing Test**

Create `lib/grades/schnitt-farbe.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { schnittFarbe } from "./schnitt-farbe";

describe("schnittFarbe", () => {
  it("gibt text-dim zurück bei null", () => {
    expect(schnittFarbe(null)).toBe("var(--text-dim)");
  });
  it("gibt success bei >= 10", () => {
    expect(schnittFarbe(10)).toBe("var(--success)");
    expect(schnittFarbe(14.5)).toBe("var(--success)");
  });
  it("gibt amber bei 7-9.9", () => {
    expect(schnittFarbe(7)).toBe("#f59e0b");
    expect(schnittFarbe(9.9)).toBe("#f59e0b");
  });
  it("gibt destructive bei < 7", () => {
    expect(schnittFarbe(6.9)).toBe("var(--destructive)");
    expect(schnittFarbe(0)).toBe("var(--destructive)");
  });
});
```

- [ ] **Step 2: Tests fehlschlagen lassen**

Run: `cd ~/project-x && npx vitest run lib/grades/schnitt-farbe.test.ts`
Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Implementieren**

Create `lib/grades/schnitt-farbe.ts`:
```ts
/** Gibt die CSS-Farb-Variable für einen Schnitt zurück (für inline style). */
export function schnittFarbe(schnitt: number | null): string {
  if (schnitt === null) return "var(--text-dim)";
  if (schnitt >= 10) return "var(--success)";
  if (schnitt >= 7) return "#f59e0b";
  return "var(--destructive)";
}
```

- [ ] **Step 4: Tests grün**

Run: `cd ~/project-x && npx vitest run lib/grades/schnitt-farbe.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
cd ~/project-x && git add lib/grades/schnitt-farbe.ts lib/grades/schnitt-farbe.test.ts
git commit -m "feat: schnittFarbe Helper (gruen/amber/rot)"
```

---

## Task 4: db.ts + db.test.ts aktualisieren (farbe, niveau, bezeichnung, gewicht)

**Files:**
- Modify: `lib/grades/db.ts`
- Modify: `lib/grades/db.test.ts`

> `assembleFaecher` muss jetzt `farbe` und `niveau` auf das `Fach`-Objekt mappen. `mapNote` muss `bezeichnung` und `gewicht` übernehmen. `KlausurRow` Typ + `assembleKlausuren` werden neu hinzugefügt.

- [ ] **Step 1: Failing Tests schreiben**

`lib/grades/db.test.ts` komplett ersetzen:
```ts
import { describe, it, expect } from "vitest";
import {
  assembleFaecher,
  assembleKlausuren,
  type FachRow,
  type NoteRow,
  type KlausurRow,
} from "./db";

const fachRows: FachRow[] = [
  {
    id: "f1", user_id: "u", name: "Mathe", farbe: "#1da1ff", niveau: "erhoeht",
    halbjahr: "2025/26-2", fach_gewicht: 2, gewicht_klausur: 0.6,
    gewicht_muendlich: 0.4, gewicht_sonstige: 0, created_at: "",
  },
];
const noteRows: NoteRow[] = [
  {
    id: "n1", user_id: "u", fach_id: "f1", punkte: 11, kategorie: "klausur",
    gewicht: 1.5, bezeichnung: "1. Klausur", datum: null, created_at: "",
  },
  {
    id: "n2", user_id: "u", fach_id: "f1", punkte: 8, kategorie: "test",
    gewicht: 1, bezeichnung: null, datum: "2026-05-01", created_at: "",
  },
];

describe("assembleFaecher", () => {
  it("mappt farbe und niveau", () => {
    const faecher = assembleFaecher(fachRows, noteRows);
    expect(faecher[0].farbe).toBe("#1da1ff");
    expect(faecher[0].niveau).toBe("erhoeht");
  });
  it("mappt bezeichnung und gewicht auf Noten", () => {
    const faecher = assembleFaecher(fachRows, noteRows);
    const n = faecher[0].noten[0];
    expect(n.bezeichnung).toBe("1. Klausur");
    expect(n.gewicht).toBe(1.5);
  });
  it("akzeptiert neue Kategorien (test)", () => {
    const faecher = assembleFaecher(fachRows, noteRows);
    expect(faecher[0].noten[1].kategorie).toBe("test");
  });
});

describe("assembleKlausuren", () => {
  const klausurRows: KlausurRow[] = [
    {
      id: "k1", user_id: "u", fach_id: "f1", titel: "Mathe-Klausur",
      datum: "2026-06-15T08:00:00+00:00", vorbereitung_prozent: 30,
      notiz: null, created_at: "",
    },
  ];
  it("gibt Map fach_id -> naechste Klausur zurück", () => {
    const map = assembleKlausuren(klausurRows);
    expect(map.get("f1")?.titel).toBe("Mathe-Klausur");
  });
  it("gibt leere Map zurück bei leerer Liste", () => {
    expect(assembleKlausuren([]).size).toBe(0);
  });
});
```

- [ ] **Step 2: Tests fehlschlagen lassen**

Run: `cd ~/project-x && npx vitest run lib/grades/db.test.ts`
Expected: FAIL (fehlende Exports).

- [ ] **Step 3: db.ts aktualisieren**

`lib/grades/db.ts` komplett ersetzen:
```ts
/**
 * Mapping zwischen Supabase-Rows und den reinen calc.ts-Typen.
 * Reine Funktionen, keine DB-Aufrufe — dadurch testbar.
 */
import type { Fach, Kategorie, Note } from "./types";

export interface FachRow {
  id: string;
  user_id: string;
  name: string;
  farbe: string | null;
  niveau: string;
  halbjahr: string | null;
  fach_gewicht: number;
  gewicht_klausur: number;
  gewicht_muendlich: number;
  gewicht_sonstige: number;
  created_at: string;
}

export interface NoteRow {
  id: string;
  user_id: string;
  fach_id: string;
  punkte: number;
  kategorie: string;
  gewicht: number;
  bezeichnung: string | null;
  datum: string | null;
  created_at: string;
}

export interface KlausurRow {
  id: string;
  user_id: string;
  fach_id: string | null;
  titel: string;
  datum: string;
  vorbereitung_prozent: number;
  notiz: string | null;
  created_at: string;
}

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    punkte: row.punkte,
    kategorie: row.kategorie as Kategorie,
    gewicht: row.gewicht,
    datum: row.datum ?? undefined,
    bezeichnung: row.bezeichnung ?? undefined,
  };
}

/** Gruppiert Noten nach Fach und baut die calc-Fach-Objekte. */
export function assembleFaecher(
  fachRows: FachRow[],
  noteRows: NoteRow[],
): Fach[] {
  const notenProFach = new Map<string, Note[]>();
  for (const n of noteRows) {
    const list = notenProFach.get(n.fach_id) ?? [];
    list.push(mapNote(n));
    notenProFach.set(n.fach_id, list);
  }
  return fachRows.map((f) => ({
    id: f.id,
    name: f.name,
    noten: notenProFach.get(f.id) ?? [],
    gewichtung: {
      klausur: f.gewicht_klausur,
      muendlich: f.gewicht_muendlich,
      sonstige: f.gewicht_sonstige,
    },
    fachGewicht: f.fach_gewicht,
    farbe: f.farbe,
    niveau: f.niveau,
  }));
}

/**
 * Baut eine Map fach_id → nächste Klausur.
 * Pro Fach wird nur die zeitlich erste Klausur gemerkt (Rows kommen sortiert an).
 */
export function assembleKlausuren(
  rows: KlausurRow[],
): Map<string, KlausurRow> {
  const map = new Map<string, KlausurRow>();
  for (const k of rows) {
    if (k.fach_id && !map.has(k.fach_id)) {
      map.set(k.fach_id, k);
    }
  }
  return map;
}
```

- [ ] **Step 4: Tests grün**

Run: `cd ~/project-x && npx vitest run lib/grades/db.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd ~/project-x && git add lib/grades/db.ts lib/grades/db.test.ts
git commit -m "feat: db.ts — farbe/niveau/bezeichnung/gewicht + assembleKlausuren"
```

---

## Task 5: actions.ts erweitern (updateFach, addKlausur, removeKlausur, addNote-Erweiterung)

**Files:**
- Modify: `app/dashboard/actions.ts`

- [ ] **Step 1: actions.ts erweitern**

An das Ende von `app/dashboard/actions.ts` die neuen Actions anhängen, und `addNote` um `bezeichnung`/`gewicht` erweitern:

```ts
// addNote-Signature ändern (vorhandene Funktion ersetzen):
export async function addNote(
  fachId: string,
  punkte: number,
  kategorie: Kategorie,
  bezeichnung?: string,
  gewicht?: number,
): Promise<ActionResult> {
  if (!Number.isFinite(punkte) || punkte < 0 || punkte > 15) {
    return { ok: false, error: "Punkte muessen zwischen 0 und 15 liegen." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase.from("schule_note").insert({
      user_id: userId,
      fach_id: fachId,
      punkte: Math.round(punkte),
      kategorie,
      bezeichnung: bezeichnung?.trim() || null,
      gewicht: gewicht ?? 1,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

// Neue Actions ans Ende:
export async function updateFach(
  fachId: string,
  updates: {
    niveau?: string;
    farbe?: string | null;
    gewicht_klausur?: number;
    gewicht_muendlich?: number;
    fach_gewicht?: number;
  },
): Promise<ActionResult> {
  try {
    await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_fach")
      .update(updates)
      .eq("id", fachId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function addKlausur(
  titel: string,
  datum: string,
  fachId?: string,
): Promise<ActionResult> {
  const trimmed = titel.trim();
  if (!trimmed) return { ok: false, error: "Bitte einen Titel eingeben." };
  if (!datum) return { ok: false, error: "Bitte ein Datum angeben." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase.from("schule_klausur").insert({
      user_id: userId,
      titel: trimmed,
      datum,
      fach_id: fachId ?? null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeKlausur(klausurId: string): Promise<ActionResult> {
  try {
    await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_klausur")
      .delete()
      .eq("id", klausurId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function updatePraeferenzen(
  eingabeModus: "punkte" | "note",
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ eingabe_modus: eingabeModus })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function completeOnboarding(
  eingabeModus: "punkte" | "note",
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ onboarding_abgeschlossen: true, eingabe_modus: eingabeModus })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Step 2: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
cd ~/project-x && git add app/dashboard/actions.ts
git commit -m "feat: actions — updateFach, addKlausur, removeKlausur, updatePraeferenzen, completeOnboarding"
```

---

## Task 6: shadcn Dialog + Fach-Dialog Komponente

**Files:**
- Create: `components/notenrechner/fach-dialog.tsx`

> ⚠️ shadcn Dialog benötigt evtl. `@radix-ui/react-dialog`. Vor `npx shadcn add dialog` prüfen ob das Paket schon installiert ist: `ls node_modules/@radix-ui/react-dialog 2>/dev/null`. Falls nicht vorhanden: den Controller-Agent fragen, bevor npm install läuft.

- [ ] **Step 1: Prüfen ob Dialog-Dep vorhanden**

Run: `cd ~/project-x && ls node_modules/@radix-ui/react-dialog 2>/dev/null && echo "vorhanden" || echo "fehlt"`

Falls "fehlt": **NEEDS_CONTEXT** — Controller-Agent informieren, damit npm install genehmigt wird.
Falls "vorhanden": weiter mit Step 2.

- [ ] **Step 2: shadcn Dialog-Komponente hinzufügen**

Run: `cd ~/project-x && npx shadcn add dialog --overwrite`
Expected: `components/ui/dialog.tsx` angelegt, keine Fehler.

- [ ] **Step 3: fach-dialog.tsx anlegen**

Create `components/notenrechner/fach-dialog.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateFach } from "@/app/dashboard/actions";
import type { Fach } from "@/lib/grades/types";

const PRESET_FARBEN = [
  "#1da1ff", // brand blau
  "#5b6eff", // indigo
  "#5bff8a", // grün
  "#f59e0b", // amber
  "#ff3050", // rot
  "#e879f9", // pink
];

export function FachDialog({
  fach,
  open,
  onClose,
  onUpdate,
}: {
  fach: Fach;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Fach>) => void;
}) {
  const [niveau, setNiveau] = useState(fach.niveau ?? "grund");
  const [farbe, setFarbe] = useState(fach.farbe ?? null);
  const [klausurProzent, setKlausurProzent] = useState(
    Math.round((fach.gewichtung?.klausur ?? 0.5) * 100),
  );
  const [, startTransition] = useTransition();

  function save() {
    const kl = Math.min(100, Math.max(0, klausurProzent));
    const fachGewicht = niveau === "erhoeht" ? 2 : 1;
    const updates = {
      niveau,
      farbe,
      fachGewicht,
      gewichtung: { klausur: kl / 100, muendlich: (100 - kl) / 100, sonstige: 0 },
    };
    onUpdate(updates);
    onClose();
    startTransition(async () => {
      const res = await updateFach(fach.id, {
        niveau,
        farbe,
        fach_gewicht: fachGewicht,
        gewicht_klausur: kl / 100,
        gewicht_muendlich: (100 - kl) / 100,
      });
      if (!res.ok) toast.error(`Konnte nicht gespeichert werden: ${res.error}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-border bg-surface-1 text-foreground sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-extrabold">
            {fach.name} konfigurieren
          </DialogTitle>
        </DialogHeader>

        {/* Niveau */}
        <div className="mt-4">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
            Niveau
          </div>
          <div className="flex gap-2">
            {(["grund", "erhoeht"] as const).map((n) => (
              <button
                key={n}
                onClick={() => setNiveau(n)}
                className={`flex-1 rounded-xl border px-4 py-2.5 font-display font-bold transition-colors ${
                  niveau === n
                    ? "border-brand bg-brand text-black"
                    : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"
                }`}
              >
                {n === "grund" ? "GK" : "LK"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-text-mute">
            LK zählt doppelt im Gesamtschnitt.
          </p>
        </div>

        {/* Gewichtung */}
        <div className="mt-4">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
            Gewichtung
          </div>
          <div className="flex items-center gap-3">
            <span className="w-20 font-mono text-sm text-text-dim">Klausur</span>
            <input
              type="range"
              min={0}
              max={100}
              value={klausurProzent}
              onChange={(e) => setKlausurProzent(Number(e.target.value))}
              className="flex-1 accent-brand"
            />
            <span className="w-12 text-right font-mono text-sm font-bold text-brand">
              {klausurProzent}%
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="w-20 font-mono text-sm text-text-dim">Mündlich</span>
            <div className="flex-1 h-1 rounded bg-surface-3" />
            <span className="w-12 text-right font-mono text-sm text-text-dim">
              {100 - klausurProzent}%
            </span>
          </div>
        </div>

        {/* Farbe */}
        <div className="mt-4">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
            Farbe
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setFarbe(null)}
              className={`size-8 rounded-full border-2 transition-transform ${
                farbe === null
                  ? "scale-110 border-foreground"
                  : "border-border"
              } bg-surface-3`}
              title="Keine Farbe"
            />
            {PRESET_FARBEN.map((f) => (
              <button
                key={f}
                onClick={() => setFarbe(f)}
                className={`size-8 rounded-full border-2 transition-transform ${
                  farbe === f ? "scale-110 border-foreground" : "border-transparent"
                }`}
                style={{ background: f }}
                title={f}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-border bg-surface-2">
            Abbrechen
          </Button>
          <Button onClick={save} className="font-display font-bold">
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 5: Commit**

```bash
cd ~/project-x && git add components/ui/dialog.tsx components/notenrechner/fach-dialog.tsx
git commit -m "feat: FachDialog — GK/LK, Farbe, Klausur/Muendlich-Gewichtung"
```

---

## Task 7: FachCard + NotenrechnerBoard aktualisieren

**Files:**
- Modify: `components/notenrechner/fach-card.tsx`
- Modify: `components/notenrechner/notenrechner-board.tsx`

> FachCard: 6 Kategorien, Gewicht, Bezeichnung, ⚙-Button, Farb-Akzent, GK/LK-Badge, Schnitt-Farbe, Countdown-Badge. Board: handleAddNote-Signature erweitern, FachDialog-State, Schnitt-Farbe im Hero. Klausur-Countdown kommt als Prop von außen (vom Dashboard geladen).

- [ ] **Step 1: fach-card.tsx komplett ersetzen**

`components/notenrechner/fach-card.tsx` komplett ersetzen:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fachSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import type { Fach, Kategorie } from "@/lib/grades/types";

const KAT_KUERZEL: Record<Kategorie, string> = {
  klausur: "K", muendlich: "M", test: "T",
  referat: "R", hausaufgabe: "H", sonstige: "S",
};
const KAT_LABEL: Record<Kategorie, string> = {
  klausur: "Klausur", muendlich: "Mündlich", test: "Test",
  referat: "Referat", hausaufgabe: "Hausaufgabe", sonstige: "Sonstige",
};

const ALLE_KATEGORIEN: Kategorie[] = [
  "klausur", "test", "muendlich", "referat", "hausaufgabe", "sonstige",
];

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  });
}

function tageBis(datumIso: string): number {
  const diff = new Date(datumIso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function FachCard({
  fach,
  index,
  naechsteKlausur,
  onAddNote,
  onRemoveNote,
  onOpenDialog,
}: {
  fach: Fach;
  index: number;
  naechsteKlausur?: { id: string; titel: string; datum: string } | null;
  onAddNote: (
    fachId: string,
    punkte: number,
    kategorie: Kategorie,
    bezeichnung?: string,
    gewicht?: number,
  ) => void;
  onRemoveNote: (fachId: string, noteId: string) => void;
  onOpenDialog: (fachId: string) => void;
}) {
  const schnitt = fachSchnittGerundet(fach.noten, fach.gewichtung);
  const farbe = schnittFarbe(schnitt);
  const tage = naechsteKlausur ? tageBis(naechsteKlausur.datum) : null;

  return (
    <section
      className="lift animate-fade-up rounded-3xl border border-border p-6"
      style={{
        background: "var(--card-grad)",
        animationDelay: `${0.1 + index * 0.07}s`,
        borderLeftColor: fach.farbe ?? undefined,
        borderLeftWidth: fach.farbe ? "3px" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {fach.farbe && (
            <span
              className="mt-0.5 inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: fach.farbe }}
            />
          )}
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">
            {fach.name}
          </h2>
          {fach.niveau && (
            <span
              className={`font-mono text-[9px] font-semibold uppercase tracking-[.1em] px-1.5 py-0.5 rounded-md ${
                fach.niveau === "erhoeht"
                  ? "bg-brand/15 text-brand"
                  : "bg-surface-3 text-text-dim"
              }`}
            >
              {fach.niveau === "erhoeht" ? "LK" : "GK"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span
              className="font-display text-2xl font-extrabold"
              style={{ color: farbe }}
            >
              {fmt(schnitt)}
            </span>
            {schnitt !== null && (
              <span className="ml-1.5 font-mono text-xs text-text-dim">
                {punkteZuNote(schnitt)}
              </span>
            )}
          </div>
          <button
            onClick={() => onOpenDialog(fach.id)}
            title="Fach konfigurieren"
            className="ml-1 text-text-mute transition-colors hover:text-foreground"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Countdown-Badge */}
      {tage !== null && tage >= 0 && tage <= 14 && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-[11px] text-destructive">
          <span>⏰</span>
          <span>
            {tage === 0
              ? "Klausur heute!"
              : tage === 1
              ? "Klausur morgen"
              : `Klausur in ${tage} Tagen`}
          </span>
        </div>
      )}

      {/* Noten-Pills */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {fach.noten.length === 0 && (
          <span className="font-mono text-xs text-text-mute">Noch keine Noten</span>
        )}
        {fach.noten.map((n) => (
          <button
            key={n.id}
            onClick={() => onRemoveNote(fach.id, n.id!)}
            title={`${n.bezeichnung ?? KAT_LABEL[n.kategorie]}${n.gewicht && n.gewicht !== 1 ? ` (×${n.gewicht})` : ""} — klick zum Löschen`}
            className="group inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs transition-colors hover:border-destructive/40 hover:bg-destructive/10"
          >
            <span className="font-semibold">{n.punkte}</span>
            <span className="text-text-mute">{KAT_KUERZEL[n.kategorie]}</span>
            {n.bezeichnung && (
              <span className="text-text-mute">·{n.bezeichnung.slice(0, 8)}</span>
            )}
            <span className="text-text-mute group-hover:text-destructive">×</span>
          </button>
        ))}
      </div>

      <AddNote
        onAdd={(p, k, bez, gew) => onAddNote(fach.id, p, k, bez, gew)}
      />
    </section>
  );
}

function AddNote({
  onAdd,
}: {
  onAdd: (
    punkte: number,
    kategorie: Kategorie,
    bezeichnung?: string,
    gewicht?: number,
  ) => void;
}) {
  const [punkte, setPunkte] = useState("");
  const [kategorie, setKategorie] = useState<Kategorie>("klausur");
  const [bezeichnung, setBezeichnung] = useState("");
  const [gewicht, setGewicht] = useState("1");
  const [erweitert, setErweitert] = useState(false);

  function submit() {
    const p = Number(punkte);
    if (Number.isNaN(p) || punkte === "") return;
    const g = Number(gewicht);
    onAdd(
      Math.min(15, Math.max(0, p)),
      kategorie,
      bezeichnung.trim() || undefined,
      Number.isFinite(g) && g > 0 ? g : 1,
    );
    setPunkte("");
    setBezeichnung("");
    setGewicht("1");
  }

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      {/* Kategorie-Chips */}
      <div className="flex flex-wrap gap-1">
        {ALLE_KATEGORIEN.map((k) => (
          <button
            key={k}
            onClick={() => setKategorie(k)}
            className={`rounded-lg px-2 py-1 font-mono text-[11px] transition-colors ${
              kategorie === k
                ? "bg-brand text-black font-semibold"
                : "bg-surface-2 text-text-dim hover:bg-surface-3"
            }`}
          >
            {KAT_LABEL[k]}
          </button>
        ))}
      </div>

      {/* Eingabe-Zeile */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={15}
          value={punkte}
          onChange={(e) => setPunkte(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="0–15"
          className="h-9 w-20 bg-surface-2 font-mono"
        />
        <button
          onClick={() => setErweitert(!erweitert)}
          className="font-mono text-[11px] text-text-mute hover:text-text-dim"
        >
          {erweitert ? "weniger ▲" : "mehr ▼"}
        </button>
        <Button onClick={submit} size="sm" className="ml-auto font-display font-bold">
          + Note
        </Button>
      </div>

      {/* Erweiterte Felder */}
      {erweitert && (
        <div className="flex gap-2">
          <Input
            value={bezeichnung}
            onChange={(e) => setBezeichnung(e.target.value)}
            placeholder="Bezeichnung (z. B. 1. Klausur)"
            className="h-8 flex-1 bg-surface-2 font-mono text-xs"
          />
          <Input
            type="number"
            min={0.1}
            step={0.5}
            value={gewicht}
            onChange={(e) => setGewicht(e.target.value)}
            placeholder="Gewicht"
            title="Gewicht (Standard = 1)"
            className="h-8 w-20 bg-surface-2 font-mono text-xs"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: notenrechner-board.tsx aktualisieren**

`components/notenrechner/notenrechner-board.tsx` komplett ersetzen:
```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FachCard } from "./fach-card";
import { FachDialog } from "./fach-dialog";
import { addFach, removeNote, addNote, updateFach } from "@/app/dashboard/actions";
import { gesamtSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import type { Fach, Kategorie } from "@/lib/grades/types";
import type { KlausurRow } from "@/lib/grades/db";

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  });
}

let tempCounter = 0;
const tempId = () => `temp-${tempCounter++}`;
const isTempId = (id: string) => id.startsWith("temp-");

export function NotenrechnerBoard({
  initialFaecher,
  halbjahr,
  initialKlausuren,
}: {
  initialFaecher: Fach[];
  halbjahr: string;
  initialKlausuren: KlausurRow[];
}) {
  const [faecher, setFaecher] = useState<Fach[]>(initialFaecher);
  const [klausuren] = useState<KlausurRow[]>(initialKlausuren);
  const [neuesFach, setNeuesFach] = useState("");
  const [dialogFachId, setDialogFachId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const gesamt = gesamtSchnittGerundet(faecher);
  const gestaltFarbe = schnittFarbe(gesamt);
  const dialogFach = faecher.find((f) => f.id === dialogFachId) ?? null;

  // Map fach_id → naechste Klausur
  const klausurByFach = new Map(
    klausuren.map((k) => [k.fach_id, k]),
  );

  function handleAddFach() {
    const name = neuesFach.trim();
    if (!name) return;
    const snapshot = faecher;
    const optimistic: Fach = { id: tempId(), name, noten: [] };
    setFaecher((prev) => [...prev, optimistic]);
    setNeuesFach("");
    startTransition(async () => {
      const res = await addFach(name, halbjahr);
      if (!res.ok) {
        setFaecher(snapshot);
        toast.error(`Fach konnte nicht angelegt werden: ${res.error}`);
      } else {
        setFaecher((prev) =>
          prev.map((f) => (f.id === optimistic.id ? { ...f, id: res.id } : f)),
        );
      }
    });
  }

  function handleAddNote(
    fachId: string,
    punkte: number,
    kategorie: Kategorie,
    bezeichnung?: string,
    gewicht?: number,
  ) {
    if (isTempId(fachId)) {
      toast.error("Fach wird noch gespeichert — bitte einen Moment warten.");
      return;
    }
    const snapshot = faecher;
    const optId = tempId();
    setFaecher((prev) =>
      prev.map((f) =>
        f.id === fachId
          ? { ...f, noten: [...f.noten, { id: optId, punkte, kategorie, bezeichnung, gewicht }] }
          : f,
      ),
    );
    startTransition(async () => {
      const res = await addNote(fachId, punkte, kategorie, bezeichnung, gewicht);
      if (!res.ok) {
        setFaecher(snapshot);
        toast.error(`Note konnte nicht gespeichert werden: ${res.error}`);
      }
    });
  }

  function handleRemoveNote(fachId: string, noteId: string) {
    const snapshot = faecher;
    setFaecher((prev) =>
      prev.map((f) =>
        f.id === fachId ? { ...f, noten: f.noten.filter((n) => n.id !== noteId) } : f,
      ),
    );
    startTransition(async () => {
      const res = await removeNote(noteId);
      if (!res.ok) {
        setFaecher(snapshot);
        toast.error(`Note konnte nicht gelöscht werden: ${res.error}`);
      }
    });
  }

  function handleUpdateFach(fachId: string, updates: Partial<Fach>) {
    setFaecher((prev) =>
      prev.map((f) => (f.id === fachId ? { ...f, ...updates } : f)),
    );
  }

  return (
    <>
      {/* Hero */}
      <section
        className="lift animate-fade-up relative overflow-hidden rounded-[28px] border-2 p-8"
        style={{
          background: "var(--hero-grad)",
          borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
          animationDelay: "0.05s",
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }}
        />
        <div className="relative z-[2]">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Gesamtschnitt
          </div>
          <div className="mt-3 flex items-end">
            <span
              className="font-display text-[110px] font-extrabold leading-[0.85] tracking-[-0.06em]"
              style={{ color: gestaltFarbe }}
            >
              {fmt(gesamt)}
            </span>
            <span className="mb-3 ml-1 text-3xl font-medium text-text-mute">/15</span>
          </div>
          {gesamt !== null && (
            <div className="mt-2 font-mono text-sm text-text-dim">
              Note {punkteZuNote(gesamt)} · {faecher.length} Fächer
            </div>
          )}
        </div>
      </section>

      {/* Fächer-Grid */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {faecher.map((fach, i) => (
          <FachCard
            key={fach.id}
            fach={fach}
            index={i}
            naechsteKlausur={klausurByFach.get(fach.id) ?? null}
            onAddNote={handleAddNote}
            onRemoveNote={handleRemoveNote}
            onOpenDialog={(id) => setDialogFachId(id)}
          />
        ))}

        {/* Fach hinzufügen */}
        <section
          className="animate-fade-up flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed p-6"
          style={{
            borderColor: "color-mix(in srgb, var(--brand) 35%, transparent)",
            background: "color-mix(in srgb, var(--brand) 4%, transparent)",
            animationDelay: `${0.1 + faecher.length * 0.07}s`,
          }}
        >
          <Input
            value={neuesFach}
            onChange={(e) => setNeuesFach(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddFach()}
            placeholder="Neues Fach, z. B. Mathe"
            className="h-9 bg-surface-2 text-center font-mono"
          />
          <Button onClick={handleAddFach} className="font-display font-bold">
            + Fach hinzufügen
          </Button>
        </section>
      </div>

      {/* Fach-Dialog */}
      {dialogFach && (
        <FachDialog
          fach={dialogFach}
          open={dialogFachId !== null}
          onClose={() => setDialogFachId(null)}
          onUpdate={(updates) => handleUpdateFach(dialogFach.id, updates)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 4: Commit**

```bash
cd ~/project-x && git add components/notenrechner/fach-card.tsx components/notenrechner/notenrechner-board.tsx
git commit -m "feat: FachCard + Board — 6 Kategorien, Schnitt-Farbe, FachDialog, Countdown-Badge"
```

---

## Task 8: Dashboard-Page aktualisieren (Klausuren laden + Onboarding-Check)

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: dashboard/page.tsx aktualisieren**

`app/dashboard/page.tsx` komplett ersetzen:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { NotenrechnerBoard } from "@/components/notenrechner/notenrechner-board";
import { assembleFaecher, assembleKlausuren, type FachRow, type NoteRow, type KlausurRow } from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const email = typeof claims.email === "string" ? claims.email : "Account";

  // Profil laden (onboarding + halbjahr)
  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("aktuelles_halbjahr, onboarding_abgeschlossen")
    .single();

  // Onboarding noch nicht abgeschlossen → weiterleiten
  if (profil && profil.onboarding_abgeschlossen === false) {
    redirect("/onboarding");
  }

  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();

  // Fächer + Noten für aktuelles Halbjahr
  const { data: fachRows } = await supabase
    .from("schule_fach")
    .select("*")
    .eq("halbjahr", halbjahr)
    .order("created_at", { ascending: true });

  const fachIds = (fachRows ?? []).map((f) => f.id);
  const { data: noteRows } = fachIds.length
    ? await supabase.from("schule_note").select("*").in("fach_id", fachIds)
    : { data: [] as NoteRow[] };

  // Upcoming Klausuren (nächste 14 Tage genügen für Badge)
  const { data: klausurRows } = await supabase
    .from("schule_klausur")
    .select("*")
    .gte("datum", new Date().toISOString())
    .order("datum", { ascending: true })
    .limit(20);

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );
  const klausurMap = assembleKlausuren((klausurRows ?? []) as KlausurRow[]);
  // Flache Liste für Board (Map → Array)
  const klausuren = Array.from(klausurMap.values()) as KlausurRow[];

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            <span className="inline-block size-1.5 rounded-full bg-success" />
            Dashboard · Schule
          </div>
          <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">
            Dein Notenrechner.
          </h1>
          <p className="mt-2 text-sm text-text-dim">
            {email} · Halbjahr {halbjahr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="rounded-xl border border-border bg-surface-2 px-4 py-2 font-sans text-sm hover:bg-surface-3 transition-colors"
          >
            Einstellungen
          </Link>
          <form action={signOut}>
            <Button variant="outline" className="border-border bg-surface-2 hover:bg-surface-3">
              Abmelden
            </Button>
          </form>
        </div>
      </header>

      <NotenrechnerBoard
        initialFaecher={faecher}
        halbjahr={halbjahr}
        initialKlausuren={klausuren}
      />
    </main>
  );
}
```

- [ ] **Step 2: TypeCheck + Build**

Run: `cd ~/project-x && npx tsc --noEmit && npm run build`
Expected: beide grün.

- [ ] **Step 3: Commit**

```bash
cd ~/project-x && git add app/dashboard/page.tsx
git commit -m "feat: Dashboard — Klausuren laden, Onboarding-Check, Einstellungen-Link"
```

---

## Task 9: Einstellungen-Seite

**Files:**
- Create: `app/settings/page.tsx`

- [ ] **Step 1: settings/page.tsx anlegen**

Create `app/settings/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePraeferenzen } from "@/app/dashboard/actions";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("eingabe_modus, notensystem")
    .single();

  const eingabeModus = profil?.eingabe_modus ?? "punkte";

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[600px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          Einstellungen
        </div>
        <h1 className="text-4xl font-extrabold leading-none">Einstellungen.</h1>
        <Link
          href="/dashboard"
          className="mt-3 inline-block font-mono text-sm text-text-dim hover:text-foreground"
        >
          ← Zurück zum Dashboard
        </Link>
      </header>

      {/* Eingabe-Modus */}
      <section
        className="animate-fade-up rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.05s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Eingabe-Modus
        </div>
        <p className="mt-1 text-sm text-text-dim">
          Wie möchtest du Noten eingeben?
        </p>
        <form className="mt-4 flex gap-3">
          {(["punkte", "note"] as const).map((modus) => (
            <button
              key={modus}
              formAction={async () => {
                "use server";
                await updatePraeferenzen(modus);
              }}
              className={`flex-1 rounded-xl border px-4 py-3 font-display font-bold transition-colors ${
                eingabeModus === modus
                  ? "border-brand bg-brand text-black"
                  : "border-border bg-surface-2 text-foreground hover:bg-surface-3"
              }`}
            >
              {modus === "punkte" ? "Punkte (0–15)" : "Noten (1+ bis 6)"}
            </button>
          ))}
        </form>
        <p className="mt-3 font-mono text-[11px] text-text-mute">
          Aktuell: <strong>{eingabeModus === "punkte" ? "Punkte (0–15)" : "Noten"}</strong>
        </p>
      </section>

      {/* Notensystem */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Notensystem
        </div>
        <p className="mt-1 text-sm text-text-dim">
          Deutschland — Oberstufe (0–15 Punkte)
        </p>
        <p className="mt-2 font-mono text-[11px] text-text-mute">
          Weitere Systeme (Schweiz, Österreich, IB) folgen in einer späteren Version.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: TypeCheck + Build**

Run: `cd ~/project-x && npx tsc --noEmit && npm run build`
Expected: grün.

- [ ] **Step 3: Commit**

```bash
cd ~/project-x && git add app/settings/page.tsx
git commit -m "feat: Einstellungen-Seite (Eingabe-Modus umschalten)"
```

---

## Task 10: Onboarding

**Files:**
- Create: `app/onboarding/page.tsx`
- Modify: `lib/supabase/proxy.ts` (onboarding Route freischalten)

- [ ] **Step 1: proxy.ts — onboarding Route hinzufügen**

In `lib/supabase/proxy.ts` die `isPublic`-Zeile erweitern:
```ts
  const isPublic =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/auth") ||
    path.startsWith("/demo") ||
    path.startsWith("/onboarding");
```

- [ ] **Step 2: onboarding/page.tsx anlegen**

Create `app/onboarding/page.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeOnboarding } from "@/app/dashboard/actions";

type Modus = "punkte" | "note";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [eingabeModus, setEingabeModus] = useState<Modus>("punkte");
  const [, startTransition] = useTransition();
  const router = useRouter();

  function finish() {
    startTransition(async () => {
      const res = await completeOnboarding(eingabeModus);
      if (!res.ok) {
        toast.error(`Fehler: ${res.error}`);
      } else {
        router.push("/dashboard");
      }
    });
  }

  return (
    <main className="relative z-[5] flex min-h-screen flex-col items-center justify-center px-5 py-12">
      {/* Progress dots */}
      <div className="mb-10 flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`size-2 rounded-full transition-colors ${
              step >= s ? "bg-brand" : "bg-surface-3"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="w-full max-w-md animate-fade-up text-center">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Schritt 1 von 2
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Wie möchtest du Noten eingeben?
          </h1>
          <p className="mt-3 text-sm text-text-dim">
            Du kannst das jederzeit in den Einstellungen ändern.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {(["punkte", "note"] as Modus[]).map((m) => (
              <button
                key={m}
                onClick={() => setEingabeModus(m)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  eingabeModus === m
                    ? "border-brand bg-brand/10"
                    : "border-border bg-surface-2 hover:bg-surface-3"
                }`}
              >
                <div className="font-display font-extrabold">
                  {m === "punkte" ? "Punkte (0–15)" : "Noten (1+ bis 6)"}
                </div>
                <div className="mt-1 font-mono text-sm text-text-dim">
                  {m === "punkte"
                    ? "Das Oberstufen-System — du gibst 0 bis 15 Punkte ein."
                    : "Klassische Schulnoten — du gibst 1+, 2, 3− usw. ein."}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="mt-6 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90"
          >
            Weiter →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-md animate-fade-up text-center">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Schritt 2 von 2
          </div>
          <div className="text-6xl">🎯</div>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">
            Dein erster Schnitt wartet.
          </h1>
          <p className="mt-3 text-sm text-text-dim">
            Leg Fächer an, trag Noten ein — der Schnitt rechnet sich live.
            Kein Abo, kein Bullshit.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4 text-left">
            <div className="font-mono text-[10px] uppercase tracking-[.15em] text-text-mute">
              Deine Einstellung
            </div>
            <div className="mt-1 font-display font-bold">
              Eingabe: {eingabeModus === "punkte" ? "Punkte (0–15)" : "Noten"}
            </div>
          </div>

          <button
            onClick={finish}
            className="mt-6 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90"
          >
            Los geht's →
          </button>
          <button
            onClick={() => setStep(1)}
            className="mt-3 font-mono text-sm text-text-mute hover:text-text-dim"
          >
            ← Zurück
          </button>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: TypeCheck + Build + alle Tests**

Run: `cd ~/project-x && npx tsc --noEmit && npm test && npm run build`
Expected: alle 3 grün. Tests: 26+ bestehen.

- [ ] **Step 4: Commit**

```bash
cd ~/project-x && git add app/onboarding/page.tsx lib/supabase/proxy.ts
git commit -m "feat: Onboarding-Wizard (2 Steps: Eingabe-Modus + Los-geht's)"
```

---

## Self-Review

**Spec-Abdeckung Schicht 2:**
- ⚙ Fach-Dialog (GK/LK, Farbe, Gewichtung %) → Task 6 ✓
- 6 Kategorien mit Gruppen-Mapping → Tasks 2+7 ✓
- Gewicht + Bezeichnung pro Note → Tasks 5+7 ✓
- Schnitt-Farbe → Tasks 3+7 ✓
- Klausur-Countdown-Badge → Task 7 ✓
- Einstellungen-Seite → Task 9 ✓
- Onboarding → Task 10 ✓
- DB-Migration → Task 1 ✓

**Klausur-Countdown-Formular (addKlausur UI):** Bewusst aus diesem Plan ausgelassen. `addKlausur`/`removeKlausur` Actions existieren (Task 5), die UI dafür kommt in Schicht 3 (Halbjahr-Switcher + Klausur-Verwaltung). Der Countdown-Badge auf der FachCard funktioniert sobald Klausuren via SQL oder späterer UI eingetragen werden.

**Typ-Konsistenz geprüft:** `KlausurRow` in db.ts exportiert und in board.tsx + dashboard/page.tsx korrekt importiert. `handleAddNote`-Signature (5 Parameter) konsistent in board.tsx und fach-card.tsx. `updateFach` nimmt DB-Spalten-Namen (`gewicht_klausur` etc.), `handleUpdateFach` nimmt Fach-Typ-Felder (`gewichtung` etc.) — korrekte Trennung.
