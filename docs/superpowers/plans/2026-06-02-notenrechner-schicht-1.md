# Notenrechner Schicht 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aus der in-memory-Demo einen echten, persistenten Notenrechner im eingeloggten Dashboard machen — Fächer + Noten in Supabase, Live-Gesamtschnitt, Anzeige Punkte groß + Note klein.

**Architecture:** Server Component (`app/dashboard/page.tsx`) lädt Profil/Fächer/Noten aus Supabase. Eine Client-Komponente hält die Daten im State und rechnet den Schnitt live mit `lib/grades/calc.ts`. Mutationen laufen über Server Actions mit optimistischem UI-Update und Rollback+Toast bei Fehler.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase (`@supabase/ssr`, RLS), TypeScript strict, Vitest (Tests), sonner (Toasts), Tailwind v4.

**Scope:** Nur Schicht 1 aus der Spec (`docs/superpowers/specs/2026-06-02-notenrechner-dashboard-design.md`). Notensystem-Interface wird angelegt, aber nur DE 0–15 implementiert. Gewichtungs-UI, Onboarding, Halbjahr-Switcher, Was-wäre-wenn und Jahresübersicht sind spätere Schichten.

---

## File Structure

- `package.json` — Vitest + sonner als Dependencies, `test`-Script.
- `vitest.config.ts` — Vitest-Konfiguration (Node-Environment, reine Logik-Tests).
- `app/layout.tsx` — `<Toaster />` von sonner einhängen.
- `supabase/migrations/0003_profil_praeferenzen.sql` — Doku der Profil-Migration (real via MCP angewendet).
- `lib/grades/systems.ts` — Notensystem-Interface + DE-0-15-Implementierung (`punkteZuNote` wiederverwendet aus `calc.ts`, neue `noteZuPunkte`).
- `lib/grades/systems.test.ts` — Tests fürs DE-System (Umkehrung punkte↔note).
- `lib/grades/db.ts` — reine Mapping-Funktionen DB-Row → `calc.ts`-Typen.
- `lib/grades/db.test.ts` — Tests fürs Mapping.
- `app/dashboard/actions.ts` — Server Actions: `addFach`, `removeFach`, `addNote`, `removeNote`.
- `components/notenrechner/notenrechner-board.tsx` — Client-Komponente: State, Live-Schnitt, optimistische Mutationen.
- `components/notenrechner/fach-card.tsx` — eine Fach-Karte (Noten-Pills + AddNote).
- `app/dashboard/page.tsx` — Server Component: lädt Daten, rendert Board oder Empty State.

---

## Task 1: Test-Setup (Vitest) + sonner installieren

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Pakete installieren**

Run:
```bash
cd ~/project-x && npm install -D vitest && npm install sonner
```
Expected: beide ohne Fehler, `package.json` + `package-lock.json` aktualisiert.

- [ ] **Step 2: test-Script ergänzen**

In `package.json` im `"scripts"`-Block ergänzen (nach `"lint": "eslint"` ein Komma setzen):
```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

- [ ] **Step 3: Vitest-Config anlegen**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Bestehende calc-Tests laufen lassen**

Run: `cd ~/project-x && npm test`
Expected: PASS — die vorhandene `lib/grades/calc.test.ts` läuft jetzt grün durch.

- [ ] **Step 5: Toaster ins Layout einhängen**

In `app/layout.tsx`: Import oben ergänzen und `<Toaster />` in den `<body>` einsetzen.
```tsx
import { Toaster } from "sonner";
```
```tsx
      <body className="min-h-full">
        {children}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
```

- [ ] **Step 6: Build prüfen + committen**

Run: `cd ~/project-x && npm run build`
Expected: Build erfolgreich.
```bash
git add package.json package-lock.json vitest.config.ts app/layout.tsx
git commit -m "chore: Vitest + sonner einrichten (Test-Runner, Toaster im Layout)"
```

---

## Task 2: Migration 0003 — Profil-Präferenzen

**Files:**
- Create: `supabase/migrations/0003_profil_praeferenzen.sql`
- DB: real via Supabase MCP `apply_migration`

- [ ] **Step 1: Migrationsdatei schreiben**

Create `supabase/migrations/0003_profil_praeferenzen.sql`:
```sql
-- =====================================================================
-- Project X — Profil-Praeferenzen: Notensystem + Eingabe-Modus.
-- Notensystem ist vorbereitet fuer spaetere Erweiterung (CH/AT/IB),
-- jetzt nur 'de_0_15' erlaubt.
-- =====================================================================
alter table public.nutzer_profil
  add column if not exists notensystem text not null default 'de_0_15'
    check (notensystem in ('de_0_15')),
  add column if not exists eingabe_modus text not null default 'punkte'
    check (eingabe_modus in ('punkte', 'note'));
```

- [ ] **Step 2: Migration anwenden (via MCP)**

Mit Supabase MCP `apply_migration` (project_id `rxmcexzlwocgfocyligd`, name `profil_praeferenzen`) den SQL-Inhalt aus Step 1 anwenden.
Expected: `{"success":true}`.

- [ ] **Step 3: Verifizieren**

Mit Supabase MCP `list_tables` (schema `public`, verbose true) prüfen, dass `nutzer_profil` jetzt die Spalten `notensystem` und `eingabe_modus` hat.

- [ ] **Step 4: TS-Types neu generieren**

Mit Supabase MCP `generate_typescript_types` (project_id `rxmcexzlwocgfocyligd`) und das Ergebnis nach `lib/supabase/database.types.ts` schreiben (Datei komplett ersetzen).

- [ ] **Step 5: Committen**

```bash
cd ~/project-x && git add supabase/migrations/0003_profil_praeferenzen.sql lib/supabase/database.types.ts
git commit -m "feat: Migration 0003 — Profil-Praeferenzen (notensystem, eingabe_modus)"
```

---

## Task 3: Notensystem-Interface + DE 0–15

**Files:**
- Create: `lib/grades/systems.ts`
- Test: `lib/grades/systems.test.ts`

- [ ] **Step 1: Failing Test schreiben**

Create `lib/grades/systems.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { DE_0_15, getNotensystem } from "./systems";

describe("DE_0_15.noteZuPunkte", () => {
  it("mappt Tendenz-Noten auf Punkte", () => {
    expect(DE_0_15.noteZuPunkte("1+")).toBe(15);
    expect(DE_0_15.noteZuPunkte("1")).toBe(14);
    expect(DE_0_15.noteZuPunkte("1-")).toBe(13);
    expect(DE_0_15.noteZuPunkte("2+")).toBe(12);
    expect(DE_0_15.noteZuPunkte("5-")).toBe(1);
    expect(DE_0_15.noteZuPunkte("6")).toBe(0);
  });
  it("ist invers zu punkteZuNote fuer alle 0-15", () => {
    for (let p = 0; p <= 15; p++) {
      expect(DE_0_15.noteZuPunkte(DE_0_15.punkteZuNote(p))).toBe(p);
    }
  });
  it("gibt null bei ungueltiger Note", () => {
    expect(DE_0_15.noteZuPunkte("7")).toBeNull();
    expect(DE_0_15.noteZuPunkte("quatsch")).toBeNull();
  });
});

describe("getNotensystem", () => {
  it("liefert DE als Default", () => {
    expect(getNotensystem("de_0_15").id).toBe("de_0_15");
    expect(getNotensystem("unbekannt").id).toBe("de_0_15");
  });
});
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ~/project-x && npx vitest run lib/grades/systems.test.ts`
Expected: FAIL ("Cannot find module './systems'").

- [ ] **Step 3: systems.ts implementieren**

Create `lib/grades/systems.ts`:
```ts
/**
 * Notensystem-Abstraktion. Macht den Notenrechner system-faehig.
 * Jetzt nur Deutschland (0-15 Punkte). CH/AT/IB folgen spaeter als
 * weitere Implementierungen desselben Interfaces.
 */
import { clampPunkte, punkteZuNote } from "./calc";

export type NotensystemId = "de_0_15";

export interface Notensystem {
  id: NotensystemId;
  label: string;
  /** Kleinster gueltiger Punktwert. */
  min: number;
  /** Groesster gueltiger Punktwert. */
  max: number;
  /** Punkte -> Notendarstellung (z.B. 13 -> "1-"). */
  punkteZuNote(punkte: number): string;
  /** Notendarstellung -> Punkte, oder null bei ungueltiger Eingabe. */
  noteZuPunkte(note: string): number | null;
}

export const DE_0_15: Notensystem = {
  id: "de_0_15",
  label: "Deutschland — Oberstufe (0–15 Punkte)",
  min: 0,
  max: 15,
  punkteZuNote,
  noteZuPunkte(note: string): number | null {
    const n = note.trim();
    if (n === "6") return 0;
    const match = /^([1-5])([+-]?)$/.exec(n);
    if (!match) return null;
    const grundnote = Number(match[1]);
    const tendenz = match[2];
    const hoechster = (6 - grundnote) * 3; // 1->15, 2->12, ... 5->3
    const punkte =
      tendenz === "+" ? hoechster : tendenz === "-" ? hoechster - 2 : hoechster - 1;
    return clampPunkte(punkte);
  },
};

const ALLE: Record<NotensystemId, Notensystem> = {
  de_0_15: DE_0_15,
};

/** Liefert das Notensystem zur Id, faellt auf DE zurueck. */
export function getNotensystem(id: string): Notensystem {
  return ALLE[id as NotensystemId] ?? DE_0_15;
}
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ~/project-x && npx vitest run lib/grades/systems.test.ts`
Expected: PASS.

- [ ] **Step 5: Committen**

```bash
cd ~/project-x && git add lib/grades/systems.ts lib/grades/systems.test.ts
git commit -m "feat: Notensystem-Interface + DE-0-15 (noteZuPunkte invers zu punkteZuNote)"
```

---

## Task 4: DB-Mapping (Row → calc-Typen)

**Files:**
- Create: `lib/grades/db.ts`
- Test: `lib/grades/db.test.ts`

- [ ] **Step 1: Failing Test schreiben**

Create `lib/grades/db.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { assembleFaecher, type FachRow, type NoteRow } from "./db";

const fachRows: FachRow[] = [
  {
    id: "f1", user_id: "u", name: "Mathe", farbe: null, niveau: "erhoeht",
    halbjahr: "2025/26-2", fach_gewicht: 2, gewicht_klausur: 0.6,
    gewicht_muendlich: 0.4, gewicht_sonstige: 0, created_at: "",
  },
];
const noteRows: NoteRow[] = [
  { id: "n1", user_id: "u", fach_id: "f1", punkte: 11, kategorie: "klausur",
    gewicht: 1, bezeichnung: null, datum: null, created_at: "" },
  { id: "n2", user_id: "u", fach_id: "f1", punkte: 12, kategorie: "muendlich",
    gewicht: 1, bezeichnung: null, datum: "2026-05-01", created_at: "" },
];

describe("assembleFaecher", () => {
  it("baut Fach mit gemappter Gewichtung und Noten", () => {
    const faecher = assembleFaecher(fachRows, noteRows);
    expect(faecher).toHaveLength(1);
    const f = faecher[0];
    expect(f.id).toBe("f1");
    expect(f.name).toBe("Mathe");
    expect(f.fachGewicht).toBe(2);
    expect(f.gewichtung).toEqual({ klausur: 0.6, muendlich: 0.4, sonstige: 0 });
    expect(f.noten).toHaveLength(2);
    expect(f.noten[0]).toMatchObject({ id: "n1", punkte: 11, kategorie: "klausur" });
    expect(f.noten[1].datum).toBe("2026-05-01");
  });
  it("ordnet einem Fach ohne Noten ein leeres Array zu", () => {
    const faecher = assembleFaecher(fachRows, []);
    expect(faecher[0].noten).toEqual([]);
  });
});
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `cd ~/project-x && npx vitest run lib/grades/db.test.ts`
Expected: FAIL ("Cannot find module './db'").

- [ ] **Step 3: db.ts implementieren**

Create `lib/grades/db.ts`:
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

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    punkte: row.punkte,
    kategorie: row.kategorie as Kategorie,
    gewicht: row.gewicht,
    datum: row.datum ?? undefined,
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
  }));
}
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `cd ~/project-x && npx vitest run lib/grades/db.test.ts`
Expected: PASS.

- [ ] **Step 5: Committen**

```bash
cd ~/project-x && git add lib/grades/db.ts lib/grades/db.test.ts
git commit -m "feat: DB-Mapping assembleFaecher (Row -> calc-Typen)"
```

---

## Task 5: Server Actions (Fach- und Noten-CRUD)

**Files:**
- Create: `app/dashboard/actions.ts`

> Hinweis: Diese Actions schreiben in die DB. `user_id` wird explizit aus den Claims gesetzt, damit die RLS-Policy `with check (auth.uid() = user_id)` greift. Getestet wird dieser Layer manuell über die UI (Task 8) — reine DB-Roundtrips werden nicht unit-getestet.

- [ ] **Step 1: actions.ts schreiben**

Create `app/dashboard/actions.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Kategorie } from "@/lib/grades/types";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Nicht angemeldet.");
  return sub;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addFach(
  name: string,
  halbjahr: string,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Bitte einen Fachnamen eingeben." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_fach")
      .insert({ user_id: userId, name: trimmed, halbjahr });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeFach(fachId: string): Promise<ActionResult> {
  try {
    await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_fach")
      .delete()
      .eq("id", fachId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function addNote(
  fachId: string,
  punkte: number,
  kategorie: Kategorie,
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
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeNote(noteId: string): Promise<ActionResult> {
  try {
    await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("schule_note")
      .delete()
      .eq("id", noteId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Committen**

```bash
cd ~/project-x && git add app/dashboard/actions.ts
git commit -m "feat: Server Actions fuer Fach- und Noten-CRUD (RLS-konform)"
```

---

## Task 6: Fach-Karte (Client-Komponente)

**Files:**
- Create: `components/notenrechner/fach-card.tsx`

> Optik ist aus `app/demo/notenrechner/page.tsx` abgeleitet (gleiche Pills, AddNote-Zeile, Theme-Klassen). Neu: Persistenz-Callbacks statt In-Memory, Note klein neben dem Schnitt über `punkteZuNote`.

- [ ] **Step 1: fach-card.tsx schreiben**

Create `components/notenrechner/fach-card.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fachSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import type { Fach, Kategorie } from "@/lib/grades/types";

const KAT_KUERZEL: Record<Kategorie, string> = {
  klausur: "K", muendlich: "M", sonstige: "S",
};

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  });
}

export function FachCard({
  fach, index, onAddNote, onRemoveNote,
}: {
  fach: Fach;
  index: number;
  onAddNote: (fachId: string, punkte: number, kategorie: Kategorie) => void;
  onRemoveNote: (fachId: string, noteId: string) => void;
}) {
  const schnitt = fachSchnittGerundet(fach.noten, fach.gewichtung);
  return (
    <section
      className="lift animate-fade-up rounded-3xl border border-border p-6"
      style={{ background: "var(--card-grad)", animationDelay: `${0.1 + index * 0.07}s` }}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">{fach.name}</h2>
        <div className="text-right">
          <span className="font-display text-2xl font-extrabold text-brand">{fmt(schnitt)}</span>
          {schnitt !== null && (
            <span className="ml-1.5 font-mono text-xs text-text-dim">{punkteZuNote(schnitt)}</span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {fach.noten.length === 0 && (
          <span className="font-mono text-xs text-text-mute">Noch keine Noten</span>
        )}
        {fach.noten.map((n) => (
          <button
            key={n.id}
            onClick={() => onRemoveNote(fach.id, n.id!)}
            title="Klick zum Löschen"
            className="group inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs transition-colors hover:border-destructive/40 hover:bg-destructive/10"
          >
            <span className="font-semibold">{n.punkte}</span>
            <span className="text-text-mute">{KAT_KUERZEL[n.kategorie]}</span>
            <span className="text-text-mute group-hover:text-destructive">×</span>
          </button>
        ))}
      </div>

      <AddNote onAdd={(p, k) => onAddNote(fach.id, p, k)} />
    </section>
  );
}

function AddNote({ onAdd }: { onAdd: (punkte: number, kategorie: Kategorie) => void }) {
  const [punkte, setPunkte] = useState("");
  const [kategorie, setKategorie] = useState<Kategorie>("klausur");

  function submit() {
    const p = Number(punkte);
    if (Number.isNaN(p) || punkte === "") return;
    onAdd(Math.min(15, Math.max(0, p)), kategorie);
    setPunkte("");
  }

  return (
    <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
      <Input
        type="number" min={0} max={15} value={punkte}
        onChange={(e) => setPunkte(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="0–15"
        className="h-9 w-20 bg-surface-2 font-mono"
      />
      <div className="flex overflow-hidden rounded-lg border border-border">
        {(["klausur", "muendlich"] as Kategorie[]).map((k) => (
          <button
            key={k}
            onClick={() => setKategorie(k)}
            className={`px-2.5 py-1.5 font-mono text-xs transition-colors ${
              kategorie === k
                ? "bg-brand text-primary-foreground"
                : "bg-surface-2 text-text-dim hover:bg-surface-3"
            }`}
          >
            {k === "klausur" ? "Klausur" : "Mündl."}
          </button>
        ))}
      </div>
      <Button onClick={submit} size="sm" className="ml-auto font-display font-bold">+ Note</Button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Committen**

```bash
cd ~/project-x && git add components/notenrechner/fach-card.tsx
git commit -m "feat: FachCard-Komponente (Noten-Pills, AddNote, Schnitt + Note)"
```

---

## Task 7: Board-Komponente (State + optimistische Mutationen)

**Files:**
- Create: `components/notenrechner/notenrechner-board.tsx`

> Hält die Fächer im State, rechnet den Gesamtschnitt live, ruft die Server Actions auf und macht bei Fehler ein Rollback + Toast. Enthält Hero, Fächer-Grid, "Fach hinzufügen" und den Empty State.

- [ ] **Step 1: notenrechner-board.tsx schreiben**

Create `components/notenrechner/notenrechner-board.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FachCard } from "./fach-card";
import { addFach, removeNote, addNote } from "@/app/dashboard/actions";
import { gesamtSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import type { Fach, Kategorie } from "@/lib/grades/types";

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  });
}

let tempCounter = 0;
const tempId = () => `temp-${tempCounter++}`;

export function NotenrechnerBoard({
  initialFaecher, halbjahr,
}: {
  initialFaecher: Fach[];
  halbjahr: string;
}) {
  const [faecher, setFaecher] = useState<Fach[]>(initialFaecher);
  const [neuesFach, setNeuesFach] = useState("");
  const [, startTransition] = useTransition();

  const gesamt = gesamtSchnittGerundet(faecher);

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
      }
    });
  }

  function handleAddNote(fachId: string, punkte: number, kategorie: Kategorie) {
    const snapshot = faecher;
    const optId = tempId();
    setFaecher((prev) => prev.map((f) =>
      f.id === fachId ? { ...f, noten: [...f.noten, { id: optId, punkte, kategorie }] } : f,
    ));
    startTransition(async () => {
      const res = await addNote(fachId, punkte, kategorie);
      if (!res.ok) {
        setFaecher(snapshot);
        toast.error(`Note konnte nicht gespeichert werden: ${res.error}`);
      }
    });
  }

  function handleRemoveNote(fachId: string, noteId: string) {
    const snapshot = faecher;
    setFaecher((prev) => prev.map((f) =>
      f.id === fachId ? { ...f, noten: f.noten.filter((n) => n.id !== noteId) } : f,
    ));
    startTransition(async () => {
      const res = await removeNote(noteId);
      if (!res.ok) {
        setFaecher(snapshot);
        toast.error(`Note konnte nicht gelöscht werden: ${res.error}`);
      }
    });
  }

  return (
    <>
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
              style={{
                background: "var(--num-grad)", WebkitBackgroundClip: "text",
                backgroundClip: "text", WebkitTextFillColor: "transparent",
              }}
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

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {faecher.map((fach, i) => (
          <FachCard
            key={fach.id} fach={fach} index={i}
            onAddNote={handleAddNote} onRemoveNote={handleRemoveNote}
          />
        ))}

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
          <Button onClick={handleAddFach} className="font-display font-bold">+ Fach hinzufügen</Button>
        </section>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Committen**

```bash
cd ~/project-x && git add components/notenrechner/notenrechner-board.tsx
git commit -m "feat: NotenrechnerBoard (Live-Schnitt, optimistische Mutationen, Empty State)"
```

---

## Task 8: Dashboard-Page lädt echte Daten

**Files:**
- Modify: `app/dashboard/page.tsx` (komplett ersetzen)

> Bestimmt das aktuelle Halbjahr (aus Profil, sonst aus Datum abgeleitet), lädt Fächer + Noten dieses Halbjahrs, mappt mit `assembleFaecher` und rendert das Board.

- [ ] **Step 1: aktuelles Halbjahr — Hilfsfunktion**

Create `lib/grades/halbjahr.ts`:
```ts
/** Leitet das aktuelle Halbjahr im Format JJJJ/JJ-N aus einem Datum ab.
 *  Schuljahr beginnt im August. HJ-1 = Aug–Jan, HJ-2 = Feb–Jul. */
export function aktuellesHalbjahr(now: Date = new Date()): string {
  const m = now.getMonth(); // 0 = Jan
  const jahr = now.getFullYear();
  const startjahr = m >= 7 ? jahr : jahr - 1; // ab August neues Schuljahr
  const kurz = String((startjahr + 1) % 100).padStart(2, "0");
  const hj = m >= 7 || m <= 0 ? 1 : 2; // Aug(7)–Jan(0) => HJ1, sonst HJ2
  return `${startjahr}/${kurz}-${hj}`;
}
```

- [ ] **Step 2: Test fuers Halbjahr**

Create `lib/grades/halbjahr.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { aktuellesHalbjahr } from "./halbjahr";

describe("aktuellesHalbjahr", () => {
  it("Juni 2026 -> 2025/26-2", () => {
    expect(aktuellesHalbjahr(new Date("2026-06-02"))).toBe("2025/26-2");
  });
  it("September 2026 -> 2026/27-1", () => {
    expect(aktuellesHalbjahr(new Date("2026-09-15"))).toBe("2026/27-1");
  });
  it("Januar 2026 -> 2025/26-1", () => {
    expect(aktuellesHalbjahr(new Date("2026-01-10"))).toBe("2025/26-1");
  });
});
```

- [ ] **Step 3: Tests laufen lassen**

Run: `cd ~/project-x && npx vitest run lib/grades/halbjahr.test.ts`
Expected: zuerst FAIL (Modul fehlt) — nach Step 1 PASS. (Step 1 vor Step 3 ausführen.)

- [ ] **Step 4: dashboard/page.tsx ersetzen**

Replace `app/dashboard/page.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { NotenrechnerBoard } from "@/components/notenrechner/notenrechner-board";
import { assembleFaecher, type FachRow, type NoteRow } from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const email = typeof claims.email === "string" ? claims.email : "Account";

  // Aktuelles Halbjahr: aus Profil, sonst aus Datum.
  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("aktuelles_halbjahr")
    .single();
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();

  const { data: fachRows } = await supabase
    .from("schule_fach")
    .select("*")
    .eq("halbjahr", halbjahr)
    .order("created_at", { ascending: true });

  const fachIds = (fachRows ?? []).map((f) => f.id);
  const { data: noteRows } = fachIds.length
    ? await supabase.from("schule_note").select("*").in("fach_id", fachIds)
    : { data: [] as NoteRow[] };

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            <span className="inline-block size-1.5 rounded-full bg-success" />
            Dashboard · Schule
          </div>
          <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">Dein Notenrechner.</h1>
          <p className="mt-2 text-sm text-text-dim">
            Angemeldet als <span className="font-mono text-foreground">{email}</span> · Halbjahr {halbjahr}
          </p>
        </div>
        <form action={signOut}>
          <Button variant="outline" className="border-border bg-surface-2 hover:bg-surface-3">Abmelden</Button>
        </form>
      </header>

      <NotenrechnerBoard initialFaecher={faecher} halbjahr={halbjahr} />
    </main>
  );
}
```

- [ ] **Step 5: Build + Typecheck**

Run: `cd ~/project-x && npx tsc --noEmit && npm run build`
Expected: beide erfolgreich.

- [ ] **Step 6: Committen**

```bash
cd ~/project-x && git add app/dashboard/page.tsx lib/grades/halbjahr.ts lib/grades/halbjahr.test.ts
git commit -m "feat: Dashboard laedt echte Faecher/Noten + aktuelles Halbjahr"
```

---

## Task 9: Manuelle Verifikation (End-to-End)

**Files:** keine — Verhaltensprüfung im echten Dashboard.

- [ ] **Step 1: Dev-Server sicherstellen**

Run: `cd ~/project-x && curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard`
Expected: `200` (oder `307`/Redirect, falls Session abgelaufen — dann im Browser neu einloggen).

- [ ] **Step 2: Smoke-Test im Browser** (Nepomuk)

Auf `http://localhost:3000/dashboard`:
1. Leerer Zustand zeigt das "Fach hinzufügen"-Feld.
2. Fach "Mathe" anlegen → Karte erscheint sofort.
3. Note 11 (Klausur) + 12 (Mündlich) eintragen → Pills erscheinen, Fach-Schnitt zeigt z. B. 11,5 mit Note daneben.
4. Hero-Gesamtschnitt aktualisiert sich live.
5. **Seite neu laden** → Fach + Noten + Schnitt sind noch da (Persistenz!).
6. Eine Note-Pill anklicken → verschwindet, Schnitt aktualisiert, übersteht Reload.

- [ ] **Step 3: DB-Gegenprobe (via Supabase MCP)**

Mit `execute_sql` (project_id `rxmcexzlwocgfocyligd`) prüfen:
```sql
select f.name, n.punkte, n.kategorie
from public.schule_note n join public.schule_fach f on f.id = n.fach_id
order by n.created_at desc limit 10;
```
Expected: die gerade eingegebenen Noten erscheinen.

- [ ] **Step 4: Alle Tests + Build final**

Run: `cd ~/project-x && npm test && npm run build`
Expected: alle Tests grün, Build erfolgreich.

---

## Self-Review-Notiz

- **Spec-Abdeckung Schicht 1:** Migration 0003 (Task 2), systems.ts (Task 3), db.ts (Task 4), Server Actions (Task 5), Dashboard mit Karten/Pills/+Note/Hero und Anzeige Punkte+Note (Tasks 6–8), Empty State (Task 7). ✓
- **Bewusst NICHT in Schicht 1:** Gewichtungs-UI (⚙), Onboarding/Settings für Notensystem+Eingabe-Modus, Halbjahr-Switcher, Was-wäre-wenn, Jahresübersicht — spätere Schichten. Die DB-Felder (notensystem, eingabe_modus) werden angelegt, aber noch nicht über UI verändert (Default DE/punkte).
- **Eingabe-Modus:** In Schicht 1 nur Punkte-Eingabe (laut Spec). Das Profilfeld existiert bereits für Schicht 2.
- **Typen-Konsistenz:** `FachRow`/`NoteRow` in db.ts definiert, in page.tsx importiert; `assembleFaecher`, `addFach/addNote/removeNote` einheitlich benannt.
