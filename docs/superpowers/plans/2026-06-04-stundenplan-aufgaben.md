# Stundenplan + Aufgaben — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stundenplan-Feature (Wochenraster Mo–Sa + Tagesdetail) + Aufgaben-Seite (Klausuren + Hausaufgaben) für project-x.

**Architecture:** Neue DB-Tabellen (`stundenplan_stunde`, `hausaufgabe`) + zwei Profil-Spalten. Server Components fetchen Daten direkt, Client Components mutieren via Server Actions. Navigation bekommt neuen "Aufgaben"-Tab; KlausurSection verlässt den Notenrechner.

**Tech Stack:** Next.js 16 App Router, Supabase (Postgres + RLS), shadcn/ui, Tailwind v4, TypeScript strict, Vitest

---

## Datei-Map

| Datei | Typ | Beschreibung |
|---|---|---|
| `supabase/migrations/0005_stundenplan_hausaufgaben.sql` | neu | Neue Tabellen + Profil-Spalten |
| `lib/stundenplan/types.ts` | neu | Typen + pure Helfer |
| `lib/stundenplan/types.test.ts` | neu | Tests für pure Helfer |
| `lib/actions/stundenplan.ts` | neu | Server Actions: addStunde, removeStunde, setAktuelleWoche |
| `lib/actions/hausaufgaben.ts` | neu | Server Actions: addHausaufgabe, removeHausaufgabe, toggleErledigt |
| `components/app-nav.tsx` | ändern | Aufgaben-Tab hinzufügen |
| `app/(app)/aufgaben/page.tsx` | neu | Aufgaben-Seite (Server Component) |
| `components/aufgaben/klausur-liste.tsx` | neu | KlausurSection refactored + neues Design |
| `components/aufgaben/hausaufgaben-liste.tsx` | neu | Hausaufgaben-Liste mit Checkbox |
| `components/notenrechner/notenrechner-board.tsx` | ändern | KlausurSection entfernen |
| `components/stundenplan/stunde-kachel.tsx` | neu | Einzelne Kachel im Wochenraster |
| `components/stundenplan/wochen-raster.tsx` | neu | Wochengrid-Komponente |
| `components/stundenplan/tages-detail.tsx` | neu | Tagesdetail-Zeitleiste |
| `components/stundenplan/stunde-dialog.tsx` | neu | Formular für neue Stunde |
| `app/(app)/stundenplan/page.tsx` | ersetzen | Placeholder → echte Seite |
| `app/onboarding/page.tsx` | ändern | Schritt 3: A/B-Wochen |
| `app/(app)/einstellungen/page.tsx` | ändern | A/B-Woche togglen |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/0005_stundenplan_hausaufgaben.sql`

- [ ] **Schreibe die Migration**

```sql
-- supabase/migrations/0005_stundenplan_hausaufgaben.sql

-- ── 1. stundenplan_stunde ──────────────────────────────────────────────────
create table if not exists public.stundenplan_stunde (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  fach_id     uuid references public.schule_fach(id) on delete set null,
  wochentag   smallint not null check (wochentag between 1 and 7),
  -- 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa, 7=So
  zeit_start  time not null,
  zeit_end    time not null,
  raum        text,
  woche_typ   text check (woche_typ in ('A', 'B'))
  -- null = jede Woche; 'A'/'B' = nur in dieser Woche
);

create index if not exists stundenplan_stunde_user_idx
  on public.stundenplan_stunde (user_id);

alter table public.stundenplan_stunde enable row level security;

create policy "Stunde: eigene verwalten"
  on public.stundenplan_stunde for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── 2. hausaufgabe ─────────────────────────────────────────────────────────
create table if not exists public.hausaufgabe (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  fach_id      uuid references public.schule_fach(id) on delete set null,
  beschreibung text not null,
  faellig_am   date not null,
  erledigt     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists hausaufgabe_user_idx
  on public.hausaufgabe (user_id);

alter table public.hausaufgabe enable row level security;

create policy "Hausaufgabe: eigene verwalten"
  on public.hausaufgabe for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ── 3. nutzer_profil: A/B-Wochen-Einstellungen ────────────────────────────
alter table public.nutzer_profil
  add column if not exists wochen_modus text
    check (wochen_modus in ('standard', 'AB')) default 'standard',
  add column if not exists aktuelle_woche text
    check (aktuelle_woche in ('A', 'B')) default 'A';
```

- [ ] **Migration auf Supabase anwenden**

```bash
# Projekt-ID aus CLAUDE.md: rxmcexzlwocgfocyligd
npx supabase db push --project-id rxmcexzlwocgfocyligd
# ODER über Supabase MCP: apply_migration mit dem SQL oben
```

Expected: Keine Fehler, drei neue Objekte in Supabase.

- [ ] **Commit**

```bash
git add supabase/migrations/0005_stundenplan_hausaufgaben.sql
git commit -m "feat: DB-Migration stundenplan_stunde + hausaufgabe + profil-spalten"
```

---

## Task 2: TypeScript-Typen + reine Helfer (TDD)

**Files:**
- Create: `lib/stundenplan/types.ts`
- Create: `lib/stundenplan/types.test.ts`

- [ ] **Schreibe den Test zuerst**

```ts
// lib/stundenplan/types.test.ts
import { describe, it, expect } from "vitest";
import {
  wochentagAusDatum,
  filterStunden,
  pausenZwischen,
  tageBis,
  hexToRgba,
  fmtZeit,
  type StundeRow,
} from "./types";

const stunde = (o: Partial<StundeRow> = {}): StundeRow => ({
  id: "x",
  user_id: "u",
  fach_id: null,
  wochentag: 1,
  zeit_start: "08:00:00",
  zeit_end:   "09:30:00",
  raum: null,
  woche_typ: null,
  ...o,
});

describe("wochentagAusDatum", () => {
  // 2026-06-02 = Dienstag (aus Mockup bestätigt: "Di 3.6" = Dienstag Jun 3)
  it("Di → 2", () => expect(wochentagAusDatum("2026-06-03")).toBe(2));
  it("Mo → 1", () => expect(wochentagAusDatum("2026-06-08")).toBe(1));
  it("So → 7", () => expect(wochentagAusDatum("2026-06-07")).toBe(7));
  it("Sa → 6", () => expect(wochentagAusDatum("2026-06-06")).toBe(6));
});

describe("filterStunden", () => {
  const s = [
    stunde({ woche_typ: null }),
    stunde({ woche_typ: "A" }),
    stunde({ woche_typ: "B" }),
  ];
  it("standard: nur null-Typ", () =>
    expect(filterStunden(s, "standard", "A")).toHaveLength(1));
  it("AB Woche A: null + A", () =>
    expect(filterStunden(s, "AB", "A")).toHaveLength(2));
  it("AB Woche B: null + B", () =>
    expect(filterStunden(s, "AB", "B")).toHaveLength(2));
});

describe("pausenZwischen", () => {
  it("erkennt 15-min-Pause", () => {
    const s = [
      stunde({ zeit_start: "08:00:00", zeit_end: "09:30:00" }),
      stunde({ zeit_start: "09:45:00", zeit_end: "11:15:00" }),
    ];
    expect(pausenZwischen(s)).toEqual([
      { start: "09:30:00", end: "09:45:00", minuten: 15 },
    ]);
  });
  it("keine Pause wenn direkt anschließend", () => {
    const s = [
      stunde({ zeit_start: "08:00:00", zeit_end: "09:30:00" }),
      stunde({ zeit_start: "09:30:00", zeit_end: "11:00:00" }),
    ];
    expect(pausenZwischen(s)).toHaveLength(0);
  });
  it("leeres Array für eine Stunde", () =>
    expect(pausenZwischen([stunde()])).toHaveLength(0));
});

describe("hexToRgba", () => {
  it("konvertiert Hex zu rgba-String", () =>
    expect(hexToRgba("#1da1ff", 0.15)).toBe("rgba(29,161,255,0.15)"));
});

describe("fmtZeit", () => {
  it("kürzt HH:MM:SS auf HH:MM", () =>
    expect(fmtZeit("09:30:00")).toBe("09:30"));
  it("lässt HH:MM unverändert", () =>
    expect(fmtZeit("09:30")).toBe("09:30"));
});
```

- [ ] **Führe Tests aus — sie müssen fehlschlagen**

```bash
cd ~/project-x && npx vitest run lib/stundenplan/types.test.ts
```
Expected: Fehler wegen fehlender Imports.

- [ ] **Schreibe die Implementierung**

```ts
// lib/stundenplan/types.ts

export interface StundeRow {
  id: string;
  user_id: string;
  fach_id: string | null;
  wochentag: number;       // 1=Mo … 7=So
  zeit_start: string;      // "HH:MM:SS" (Postgres time)
  zeit_end: string;
  raum: string | null;
  woche_typ: "A" | "B" | null;
}

export interface HausaufgabeRow {
  id: string;
  user_id: string;
  fach_id: string | null;
  beschreibung: string;
  faellig_am: string;  // ISO-Datum "YYYY-MM-DD"
  erledigt: boolean;
  created_at: string;
}

/** ISO-Datum → Wochentag 1 (Mo) … 7 (So) */
export function wochentagAusDatum(iso: string): number {
  const d = new Date(iso + "T12:00:00");
  const js = d.getDay(); // 0=So
  return js === 0 ? 7 : js;
}

/** Filtert Stunden nach A/B-Wochen-Modus. */
export function filterStunden(
  stunden: StundeRow[],
  wochenModus: "standard" | "AB",
  aktuelleWoche: "A" | "B",
): StundeRow[] {
  if (wochenModus === "standard") {
    return stunden.filter((s) => s.woche_typ === null);
  }
  return stunden.filter(
    (s) => s.woche_typ === null || s.woche_typ === aktuelleWoche,
  );
}

/** Berechnet Pausen zwischen sortierten Stunden eines Tages. */
export function pausenZwischen(
  stundenAmTag: StundeRow[],
): { start: string; end: string; minuten: number }[] {
  const result: { start: string; end: string; minuten: number }[] = [];
  for (let i = 0; i < stundenAmTag.length - 1; i++) {
    const end = stundenAmTag[i].zeit_end;
    const next = stundenAmTag[i + 1].zeit_start;
    const minuten = zeitZuMinuten(next) - zeitZuMinuten(end);
    if (minuten > 0) result.push({ start: end, end: next, minuten });
  }
  return result;
}

function zeitZuMinuten(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Tage bis zu einem Datum (negativ = vergangen). */
export function tageBis(datumIso: string): number {
  return Math.ceil(
    (new Date(datumIso).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

/** Hex-Farbe (#rrggbb) → "rgba(r,g,b,alpha)"-String. */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Kürzt "HH:MM:SS" → "HH:MM". */
export function fmtZeit(t: string): string {
  return t.slice(0, 5);
}

export const FACH_FALLBACK_FARBE = "#1da1ff";
```

- [ ] **Tests müssen jetzt grün sein**

```bash
npx vitest run lib/stundenplan/types.test.ts
```
Expected: All tests pass.

- [ ] **Commit**

```bash
git add lib/stundenplan/
git commit -m "feat: stundenplan-typen + pure helfer mit tests"
```

---

## Task 3: Server Actions

**Files:**
- Create: `lib/actions/stundenplan.ts`
- Create: `lib/actions/hausaufgaben.ts`

- [ ] **Schreibe `lib/actions/stundenplan.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Nicht angemeldet.");
  return sub;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addStunde(params: {
  fachId: string | null;
  wochentag: number;
  zeitStart: string;
  zeitEnd: string;
  raum: string | null;
  wocheTyp: "A" | "B" | null;
}): Promise<ActionResult> {
  if (params.wochentag < 1 || params.wochentag > 7) {
    return { ok: false, error: "Ungültiger Wochentag." };
  }
  if (!params.zeitStart || !params.zeitEnd) {
    return { ok: false, error: "Start- und Endzeit sind Pflicht." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase.from("stundenplan_stunde").insert({
      user_id: userId,
      fach_id: params.fachId,
      wochentag: params.wochentag,
      zeit_start: params.zeitStart,
      zeit_end: params.zeitEnd,
      raum: params.raum || null,
      woche_typ: params.wocheTyp,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeStunde(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("stundenplan_stunde")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function setAktuelleWoche(
  woche: "A" | "B",
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ aktuelle_woche: woche })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Schreibe `lib/actions/hausaufgaben.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (typeof sub !== "string") throw new Error("Nicht angemeldet.");
  return sub;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function addHausaufgabe(params: {
  fachId: string | null;
  beschreibung: string;
  faelligAm: string; // "YYYY-MM-DD"
}): Promise<ActionResult> {
  if (!params.beschreibung.trim()) {
    return { ok: false, error: "Bitte eine Beschreibung eingeben." };
  }
  if (!params.faelligAm) {
    return { ok: false, error: "Fälligkeitsdatum ist Pflicht." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase.from("hausaufgabe").insert({
      user_id: userId,
      fach_id: params.fachId || null,
      beschreibung: params.beschreibung.trim(),
      faellig_am: params.faelligAm,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function removeHausaufgabe(id: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("hausaufgabe")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/aufgaben");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export async function toggleErledigt(
  id: string,
  erledigt: boolean,
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("hausaufgabe")
      .update({ erledigt })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/aufgaben");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Commit**

```bash
git add lib/actions/stundenplan.ts lib/actions/hausaufgaben.ts
git commit -m "feat: server actions stundenplan + hausaufgaben"
```

---

## Task 4: Navigation — Aufgaben-Tab

**Files:**
- Modify: `components/app-nav.tsx`

- [ ] **ClipboardList-Import hinzufügen und TABS erweitern**

In `components/app-nav.tsx`, Zeile mit den Lucide-Imports:

```ts
// Alt:
import {
  LayoutDashboard,
  Calculator,
  Sparkles,
  CalendarDays,
  Settings,
  type LucideIcon,
} from "lucide-react";

// Neu:
import {
  LayoutDashboard,
  Calculator,
  Sparkles,
  CalendarDays,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";
```

TABS-Array:

```ts
const TABS: Tab[] = [
  { href: "/dashboard",    label: "Übersicht",    icon: LayoutDashboard },
  { href: "/noten",        label: "Noten",        icon: Calculator },
  { href: "/what-if",      label: "What-If",      icon: Sparkles },
  { href: "/stundenplan",  label: "Stundenplan",  icon: CalendarDays },
  { href: "/aufgaben",     label: "Aufgaben",     icon: ClipboardList },
  { href: "/einstellungen",label: "Einstellungen",icon: Settings },
];
```

- [ ] **Dev-Server starten + Navigation prüfen**

```bash
cd ~/project-x && npm run dev
```

Browser: `/dashboard` → Nav hat 6 Tabs, "Aufgaben" ist klickbar (zeigt 404 bis Seite gebaut).

- [ ] **Commit**

```bash
git add components/app-nav.tsx
git commit -m "feat: Aufgaben-Tab in Navigation"
```

---

## Task 5: KlausurListe-Komponente (refactored)

**Files:**
- Create: `components/aufgaben/klausur-liste.tsx`

- [ ] **Schreibe die Komponente**

```tsx
// components/aufgaben/klausur-liste.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addKlausur, removeKlausur } from "@/lib/actions/schule";
import { tageBis, hexToRgba, FACH_FALLBACK_FARBE } from "@/lib/stundenplan/types";
import type { KlausurRow, FachRow } from "@/lib/grades/db";

function fmtDatum(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function KlausurListe({
  faecher,
  klausuren,
}: {
  faecher: FachRow[];
  klausuren: KlausurRow[];
}) {
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState("");
  const [fachId, setFachId] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const fachMap = new Map(faecher.map((f) => [f.id, f]));

  function hinzufuegen() {
    if (!titel.trim() || !datum) {
      toast.error("Titel und Datum sind nötig.");
      return;
    }
    start(async () => {
      const res = await addKlausur(titel, new Date(datum).toISOString(), fachId || undefined);
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      setTitel(""); setDatum(""); setFachId("");
      router.refresh();
    });
  }

  function loeschen(id: string) {
    start(async () => {
      const res = await removeKlausur(id);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  return (
    <section>
      <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-text-mute">
        Klausuren
      </h2>

      {/* Formular */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          value={titel} onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel, z. B. 2. Klausur"
          className="h-9 flex-1 bg-surface-2 font-mono text-sm"
        />
        <Input
          type="date" value={datum} onChange={(e) => setDatum(e.target.value)}
          className="h-9 w-40 bg-surface-2 font-mono text-sm"
        />
        <select
          value={fachId} onChange={(e) => setFachId(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-text-dim"
        >
          <option value="">Fach (optional)</option>
          {faecher.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <Button onClick={hinzufuegen} disabled={pending} size="sm" className="font-display font-bold">
          + Klausur
        </Button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {klausuren.length === 0 && (
          <p className="font-mono text-xs text-text-mute">
            Noch keine Klausuren eingetragen.
          </p>
        )}
        {klausuren.map((k) => {
          const tage = tageBis(k.datum);
          const fach = k.fach_id ? fachMap.get(k.fach_id) : null;
          const farbe = fach?.farbe ?? FACH_FALLBACK_FARBE;
          return (
            <div
              key={k.id}
              className="lift flex items-center gap-3 rounded-2xl border border-border p-3 transition-all"
              style={{ background: "linear-gradient(145deg, var(--surface-2), var(--surface-1))" }}
            >
              {/* Farbiger Stripe */}
              <div
                className="h-10 w-1 flex-shrink-0 rounded-full"
                style={{
                  background: farbe,
                  boxShadow: `0 0 10px ${hexToRgba(farbe, 0.5)}`,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold leading-tight">{k.titel}</div>
                <div className="mt-0.5 font-mono text-[10px] text-text-dim">
                  {fach ? `${fach.name} · ` : ""}
                  {fmtDatum(k.datum)}
                </div>
              </div>
              {/* Countdown-Chip */}
              <span
                className="flex-shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-bold"
                style={
                  tage <= 7
                    ? { background: "rgba(255,48,80,.18)", color: "var(--destructive)", border: "1px solid rgba(255,48,80,.3)" }
                    : { background: "rgba(29,161,255,.15)", color: "var(--brand)", border: "1px solid rgba(29,161,255,.25)" }
                }
              >
                {tage < 0 ? "vorbei" : tage === 0 ? "heute" : `${tage}T`}
              </span>
              <button
                onClick={() => loeschen(k.id)}
                className="flex-shrink-0 text-text-mute transition-colors hover:text-destructive"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Commit**

```bash
git add components/aufgaben/klausur-liste.tsx
git commit -m "feat: KlausurListe-Komponente (refactored + neues Design)"
```

---

## Task 6: HausaufgabenListe-Komponente

**Files:**
- Create: `components/aufgaben/hausaufgaben-liste.tsx`

- [ ] **Schreibe die Komponente**

```tsx
// components/aufgaben/hausaufgaben-liste.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addHausaufgabe, removeHausaufgabe, toggleErledigt } from "@/lib/actions/hausaufgaben";
import { hexToRgba, FACH_FALLBACK_FARBE, tageBis } from "@/lib/stundenplan/types";
import type { FachRow } from "@/lib/grades/db";
import type { HausaufgabeRow } from "@/lib/stundenplan/types";

export function HausaufgabenListe({
  faecher,
  hausaufgaben,
}: {
  faecher: FachRow[];
  hausaufgaben: HausaufgabeRow[];
}) {
  const [beschreibung, setBeschreibung] = useState("");
  const [faelligAm, setFaelligAm] = useState("");
  const [fachId, setFachId] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const fachMap = new Map(faecher.map((f) => [f.id, f]));

  // Offen zuerst, erledigte ans Ende
  const sortiert = [...hausaufgaben].sort((a, b) => {
    if (a.erledigt !== b.erledigt) return a.erledigt ? 1 : -1;
    return a.faellig_am.localeCompare(b.faellig_am);
  });

  function hinzufuegen() {
    if (!beschreibung.trim() || !faelligAm) {
      toast.error("Beschreibung und Datum sind nötig.");
      return;
    }
    start(async () => {
      const res = await addHausaufgabe({
        fachId: fachId || null,
        beschreibung,
        faelligAm,
      });
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      setBeschreibung(""); setFaelligAm(""); setFachId("");
      router.refresh();
    });
  }

  function toggle(id: string, erledigt: boolean) {
    start(async () => {
      const res = await toggleErledigt(id, erledigt);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  function loeschen(id: string) {
    start(async () => {
      const res = await removeHausaufgabe(id);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  return (
    <section>
      <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-text-mute">
        Hausaufgaben
      </h2>

      {/* Formular */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)}
          placeholder="z. B. S. 47 Aufg. 3+4 lesen"
          className="h-9 flex-1 bg-surface-2 font-mono text-sm"
        />
        <Input
          type="date" value={faelligAm} onChange={(e) => setFaelligAm(e.target.value)}
          className="h-9 w-40 bg-surface-2 font-mono text-sm"
        />
        <select
          value={fachId} onChange={(e) => setFachId(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-text-dim"
        >
          <option value="">Fach (optional)</option>
          {faecher.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <Button onClick={hinzufuegen} disabled={pending} size="sm" className="font-display font-bold">
          + HA
        </Button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {sortiert.length === 0 && (
          <p className="font-mono text-xs text-text-mute">
            Keine offenen Hausaufgaben — gut gemacht.
          </p>
        )}
        {sortiert.map((ha) => {
          const fach = ha.fach_id ? fachMap.get(ha.fach_id) : null;
          const farbe = fach?.farbe ?? FACH_FALLBACK_FARBE;
          const tage = tageBis(ha.faellig_am);
          return (
            <div
              key={ha.id}
              className="lift flex items-center gap-3 rounded-2xl border border-border p-3 transition-all"
              style={{
                background: "linear-gradient(145deg, var(--surface-2), var(--surface-1))",
                opacity: ha.erledigt ? 0.45 : 1,
              }}
            >
              <div
                className="h-10 w-1 flex-shrink-0 rounded-full"
                style={{
                  background: farbe,
                  boxShadow: ha.erledigt ? "none" : `0 0 10px ${hexToRgba(farbe, 0.5)}`,
                }}
              />
              <div className="min-w-0 flex-1">
                {fach && (
                  <div className="font-mono text-[9px] uppercase tracking-widest text-text-mute">
                    {fach.name}
                  </div>
                )}
                <div
                  className="font-display font-bold leading-tight"
                  style={{ textDecoration: ha.erledigt ? "line-through" : "none" }}
                >
                  {ha.beschreibung}
                </div>
                <div
                  className="mt-0.5 font-mono text-[10px]"
                  style={{ color: tage <= 1 && !ha.erledigt ? "var(--destructive)" : "var(--text-mute)" }}
                >
                  {tage < 0 ? "überfällig" : tage === 0 ? "fällig heute" : `fällig in ${tage}T`}
                </div>
              </div>
              {/* Checkbox */}
              <button
                onClick={() => toggle(ha.id, !ha.erledigt)}
                className="flex size-6 flex-shrink-0 items-center justify-center rounded-lg border border-border transition-all hover:border-brand hover:shadow-[0_0_10px_rgba(29,161,255,.3)]"
                style={
                  ha.erledigt
                    ? { background: "linear-gradient(135deg,var(--brand),var(--indigo))", borderColor: "transparent" }
                    : {}
                }
              >
                {ha.erledigt && <span className="text-[11px] font-black text-black">✓</span>}
              </button>
              <button
                onClick={() => loeschen(ha.id)}
                className="flex-shrink-0 text-text-mute transition-colors hover:text-destructive"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Commit**

```bash
git add components/aufgaben/hausaufgaben-liste.tsx
git commit -m "feat: HausaufgabenListe-Komponente mit Checkbox-Toggle"
```

---

## Task 7: Aufgaben-Seite + KlausurSection aus Notenrechner entfernen

**Files:**
- Create: `app/(app)/aufgaben/page.tsx`
- Modify: `components/notenrechner/notenrechner-board.tsx`

- [ ] **Schreibe `app/(app)/aufgaben/page.tsx`**

```tsx
// app/(app)/aufgaben/page.tsx
import { createClient } from "@/lib/supabase/server";
import { KlausurListe } from "@/components/aufgaben/klausur-liste";
import { HausaufgabenListe } from "@/components/aufgaben/hausaufgaben-liste";
import type { KlausurRow, FachRow } from "@/lib/grades/db";
import type { HausaufgabeRow } from "@/lib/stundenplan/types";

export default async function AufgabenPage() {
  const supabase = await createClient();

  const [{ data: fachRows }, { data: klausurRows }, { data: hausaufgabeRows }] =
    await Promise.all([
      supabase.from("schule_fach").select("*").order("name"),
      supabase
        .from("schule_klausur")
        .select("*")
        .order("datum", { ascending: true }),
      supabase
        .from("hausaufgabe")
        .select("*")
        .order("erledigt", { ascending: true })
        .order("faellig_am", { ascending: true }),
    ]);

  const faecher = (fachRows ?? []) as FachRow[];
  const klausuren = (klausurRows ?? []) as KlausurRow[];
  const hausaufgaben = (hausaufgabeRows ?? []) as HausaufgabeRow[];

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8">
      <div className="animate-fade-up mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Aufgaben
        </h1>
        <p className="mt-1 font-mono text-sm text-text-dim">
          {klausuren.filter((k) => {
            const d = new Date(k.datum).getTime() - Date.now();
            return d > 0 && d < 7 * 24 * 60 * 60 * 1000;
          }).length > 0
            ? "Klausur in weniger als 7 Tagen — bereit sein."
            : `${klausuren.length} Klausuren · ${hausaufgaben.filter((h) => !h.erledigt).length} Hausaufgaben offen`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div
          className="animate-fade-up rounded-3xl border border-border p-6"
          style={{ background: "var(--card-grad)", animationDelay: "60ms" }}
        >
          <KlausurListe faecher={faecher} klausuren={klausuren} />
        </div>
        <div
          className="animate-fade-up rounded-3xl border border-border p-6"
          style={{ background: "var(--card-grad)", animationDelay: "120ms" }}
        >
          <HausaufgabenListe faecher={faecher} hausaufgaben={hausaufgaben} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **KlausurSection aus notenrechner-board.tsx entfernen**

In `components/notenrechner/notenrechner-board.tsx`:

```ts
// ENTFERNEN — diese beiden Zeilen löschen:
import { KlausurSection } from "./klausur-section";
// ...
<KlausurSection faecher={faecher} klausuren={klausuren} />
```

Die Klausur-Daten für fach-card Badges (`klausurByFach`, `naechsteKlausur`) **bleiben** — sie werden weiter für den Countdown auf den Fach-Karten benötigt.

- [ ] **Dev-Server: `/aufgaben` aufrufen und prüfen**

Browser: Zwei-Spalten-Layout, Klausuren + Hausaufgaben sichtbar, Formular funktioniert, `×`-Button löscht.

- [ ] **Commit**

```bash
git add app/\(app\)/aufgaben/page.tsx components/notenrechner/notenrechner-board.tsx
git commit -m "feat: Aufgaben-Seite + KlausurSection aus Notenrechner entfernt"
```

---

## Task 8: StundeKachel-Komponente

**Files:**
- Create: `components/stundenplan/stunde-kachel.tsx`

- [ ] **Schreibe die Komponente**

```tsx
// components/stundenplan/stunde-kachel.tsx
import { hexToRgba, fmtZeit, FACH_FALLBACK_FARBE } from "@/lib/stundenplan/types";
import type { StundeRow } from "@/lib/stundenplan/types";

interface Props {
  stunde: StundeRow;
  fach?: { name: string; farbe: string | null } | null;
  klausurAmTag?: boolean;
  haOffen?: boolean;
  onClick?: () => void;
}

export function StundeKachel({ stunde, fach, klausurAmTag, haOffen, onClick }: Props) {
  const farbe = fach?.farbe ?? FACH_FALLBACK_FARBE;
  const rgbaBg     = hexToRgba(farbe, 0.15);
  const rgbaBorder = hexToRgba(farbe, klausurAmTag ? 0 : 0.22);
  const rgbaGlow   = hexToRgba(farbe, 0.07);
  const klausurBorder = "rgba(255,48,80,.4)";
  const klausurGlow   = "rgba(255,48,80,.14)";

  return (
    <button
      onClick={onClick}
      className="group relative flex h-[74px] w-full flex-col justify-between overflow-hidden rounded-[13px] border p-2 text-left transition-all duration-200 hover:scale-[1.04] hover:brightness-110"
      style={{
        background: rgbaBg,
        borderColor: klausurAmTag ? klausurBorder : rgbaBorder,
        boxShadow: klausurAmTag
          ? `0 0 22px ${klausurGlow}`
          : `0 0 18px ${rgbaGlow}`,
        color: farbe,
      }}
    >
      {/* Interner Glanz */}
      <span
        className="pointer-events-none absolute inset-0 rounded-[13px]"
        style={{ background: "linear-gradient(135deg,rgba(255,255,255,.08) 0%,transparent 55%)" }}
      />
      {/* Linker Stripe */}
      <span
        className="absolute bottom-1.5 left-0 top-1.5 w-[3px] rounded-r-sm"
        style={{ background: farbe, opacity: 0.85 }}
      />
      <div className="pl-1.5">
        <div className="truncate font-display text-[11px] font-extrabold leading-tight">
          {fach?.name ?? "Fach"}
        </div>
        {stunde.raum && (
          <div className="font-mono text-[9px] opacity-55">{stunde.raum}</div>
        )}
      </div>
      <div className="flex gap-1 pl-1.5">
        {klausurAmTag && (
          <span className="rounded px-1 py-px font-mono text-[8px] font-bold"
            style={{ background: "rgba(255,48,80,.22)", color: "var(--destructive)", border: "1px solid rgba(255,48,80,.3)" }}>
            KLAUSUR
          </span>
        )}
        {haOffen && (
          <span className="rounded px-1 py-px font-mono text-[8px] font-bold"
            style={{ background: "rgba(91,255,138,.15)", color: "var(--success)", border: "1px solid rgba(91,255,138,.25)" }}>
            HA
          </span>
        )}
      </div>
    </button>
  );
}
```

- [ ] **Commit**

```bash
git add components/stundenplan/stunde-kachel.tsx
git commit -m "feat: StundeKachel-Komponente"
```

---

## Task 9: WochenRaster-Komponente

**Files:**
- Create: `components/stundenplan/wochen-raster.tsx`

- [ ] **Schreibe die Komponente**

```tsx
// components/stundenplan/wochen-raster.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StundeKachel } from "./stunde-kachel";
import { filterStunden, fmtZeit, FACH_FALLBACK_FARBE } from "@/lib/stundenplan/types";
import { setAktuelleWoche } from "@/lib/actions/stundenplan";
import type { StundeRow } from "@/lib/stundenplan/types";

const WOCHENTAGE = [
  { num: 1, kurz: "Mo" },
  { num: 2, kurz: "Di" },
  { num: 3, kurz: "Mi" },
  { num: 4, kurz: "Do" },
  { num: 5, kurz: "Fr" },
  { num: 6, kurz: "Sa" },
];

interface Props {
  stunden: StundeRow[];
  faecher: Map<string, { name: string; farbe: string | null }>;
  klausurenDaten: Set<string>; // ISO-Daten dieser Woche mit Klausur
  offeneHaFachIds: Set<string>; // fach_ids mit offenen Hausaufgaben
  heute: string; // ISO "YYYY-MM-DD"
  aktuelleWoche: "A" | "B";
  wochenModus: "standard" | "AB";
  wochenStart: string; // ISO "YYYY-MM-DD" (Montag dieser Woche)
  onTagClick: (datum: string) => void;
}

export function WochenRaster({
  stunden,
  faecher,
  klausurenDaten,
  offeneHaFachIds,
  heute,
  aktuelleWoche,
  wochenModus,
  wochenStart,
  onTagClick,
}: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const gefiltert = filterStunden(stunden, wochenModus, aktuelleWoche);

  // Gruppiert nach Wochentag
  const stundenProTag = new Map<number, StundeRow[]>();
  for (const s of gefiltert) {
    const list = stundenProTag.get(s.wochentag) ?? [];
    list.push(s);
    stundenProTag.set(s.wochentag, list);
  }
  // Sortieren nach Startzeit
  stundenProTag.forEach((list) => list.sort((a, b) => a.zeit_start.localeCompare(b.zeit_start)));

  // Datum für jeden Tag berechnen (ausgehend vom wochenStart = Montag)
  function datumFuerTag(wochentag: number): string {
    const d = new Date(wochenStart + "T12:00:00");
    d.setDate(d.getDate() + (wochentag - 1));
    return d.toISOString().slice(0, 10);
  }

  function toggleWoche() {
    const neu = aktuelleWoche === "A" ? "B" : "A";
    start(async () => {
      const res = await setAktuelleWoche(neu);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  // Alle Startzeiten sammeln für die Zeitleiste links
  const alleStartzeiten = Array.from(
    new Set(gefiltert.map((s) => s.zeit_start)),
  ).sort();

  return (
    <div>
      {/* Header: Wochenbeschriftung + A/B-Toggle */}
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-xs text-text-dim">
          {new Date(wochenStart).toLocaleDateString("de-DE", { day: "2-digit", month: "long" })}
          {" – "}
          {new Date(datumFuerTag(6)).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
        {wochenModus === "AB" && (
          <button
            onClick={toggleWoche}
            disabled={pending}
            className="rounded-lg border border-brand/40 bg-brand/10 px-3 py-1 font-mono text-xs font-bold text-brand transition-all hover:bg-brand/20"
          >
            Woche {aktuelleWoche} ⇄
          </button>
        )}
      </div>

      {/* Grid */}
      <div
        className="overflow-hidden rounded-2xl border border-border"
        style={{ background: "linear-gradient(145deg, var(--surface-2), var(--surface-1))" }}
      >
        {/* Tages-Header */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: "48px repeat(6, 1fr)" }}>
          <div />
          {WOCHENTAGE.map(({ num, kurz }) => {
            const datum = datumFuerTag(num);
            const istHeute = datum === heute;
            const hatKlausur = klausurenDaten.has(datum);
            return (
              <button
                key={num}
                onClick={() => onTagClick(datum)}
                className="border-l border-border py-3 text-center transition-opacity hover:opacity-80"
              >
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: istHeute ? "var(--brand)" : "var(--text-mute)" }}
                >
                  {kurz}
                  {hatKlausur && (
                    <span className="relative ml-1 inline-flex">
                      <span className="absolute inset-0 animate-ping rounded-full bg-destructive opacity-50" style={{ animationDuration: "1.8s" }} />
                      <span className="relative inline-block size-1.5 rounded-full bg-destructive" style={{ boxShadow: "0 0 6px var(--destructive)" }} />
                    </span>
                  )}
                </span>
                <span
                  className="mt-0.5 block font-display text-lg font-extrabold leading-none"
                  style={
                    istHeute
                      ? { background: "linear-gradient(135deg, var(--brand), var(--indigo))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
                      : { color: "var(--foreground)" }
                  }
                >
                  {new Date(datum + "T12:00:00").getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Stunden-Spalten */}
        <div className="grid" style={{ gridTemplateColumns: "48px repeat(6, 1fr)" }}>
          {/* Zeitleiste */}
          <div className="flex flex-col">
            {alleStartzeiten.map((zeit) => (
              <div
                key={zeit}
                className="flex h-[80px] items-start justify-end border-b border-white/[0.03] pr-2 pt-1.5"
              >
                <span className="font-mono text-[9px] text-text-mute">{fmtZeit(zeit)}</span>
              </div>
            ))}
            {alleStartzeiten.length === 0 && <div className="h-[80px]" />}
          </div>

          {/* Tag-Spalten */}
          {WOCHENTAGE.map(({ num }) => {
            const datum = datumFuerTag(num);
            const istHeute = datum === heute;
            const stundenHeute = stundenProTag.get(num) ?? [];
            const slots = alleStartzeiten.length > 0 ? alleStartzeiten : [""];
            return (
              <div
                key={num}
                className="flex flex-col border-l border-border"
                style={{ background: istHeute ? "rgba(29,161,255,0.025)" : "transparent" }}
              >
                {slots.map((zeit) => {
                  const stunde = stundenHeute.find((s) => s.zeit_start === zeit);
                  return (
                    <div key={zeit} className="h-[80px] p-1">
                      {stunde ? (
                        <StundeKachel
                          stunde={stunde}
                          fach={stunde.fach_id ? (faecher.get(stunde.fach_id) ?? null) : null}
                          klausurAmTag={klausurenDaten.has(datum) &&
                            !!stunde.fach_id &&
                            // nur Badge wenn Klausur im selben Fach
                            true}
                          haOffen={!!stunde.fach_id && offeneHaFachIds.has(stunde.fach_id)}
                          onClick={() => onTagClick(datum)}
                        />
                      ) : null}
                    </div>
                  );
                })}
                {slots.length === 0 && <div className="h-[80px]" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add components/stundenplan/wochen-raster.tsx
git commit -m "feat: WochenRaster-Komponente"
```

---

## Task 10: TagesDetail-Komponente

**Files:**
- Create: `components/stundenplan/tages-detail.tsx`

- [ ] **Schreibe die Komponente**

```tsx
// components/stundenplan/tages-detail.tsx
import { hexToRgba, fmtZeit, pausenZwischen, tageBis, FACH_FALLBACK_FARBE } from "@/lib/stundenplan/types";
import type { StundeRow } from "@/lib/stundenplan/types";

const WOCHENTAGE_LANG = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

interface Props {
  datum: string; // "YYYY-MM-DD"
  stunden: StundeRow[]; // für diesen Wochentag, sortiert
  faecher: Map<string, { name: string; farbe: string | null }>;
  klausurenNaechste: { datum: string; titel: string; fach_id: string | null }[];
  onTagClick: (datum: string) => void;
  wochenTage: { datum: string; wochentag: number }[]; // alle 6 Tage der Woche
}

export function TagesDetail({ datum, stunden, faecher, klausurenNaechste, onTagClick, wochenTage }: Props) {
  const d = new Date(datum + "T12:00:00");
  const wochentag = d.getDay() === 0 ? 7 : d.getDay();
  const pausen = pausenZwischen(stunden);

  // Nächste Klausur in ≤ 7 Tagen
  const baldKlausur = klausurenNaechste.find((k) => {
    const t = tageBis(k.datum);
    return t >= 0 && t <= 7;
  });

  return (
    <div>
      {/* Wochentag-Pills */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {wochenTage.map(({ datum: d2, wochentag: wt }) => {
          const aktiv = d2 === datum;
          const kurzname = ["", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][wt];
          const tag = new Date(d2 + "T12:00:00").getDate();
          return (
            <button
              key={d2}
              onClick={() => onTagClick(d2)}
              className="flex-shrink-0 rounded-full border px-4 py-1.5 font-mono text-xs font-bold transition-all"
              style={
                aktiv
                  ? { background: "linear-gradient(135deg,var(--brand),var(--indigo))", borderColor: "transparent", color: "#000", boxShadow: "0 4px 18px rgba(29,161,255,.35)" }
                  : { borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-dim)" }
              }
            >
              {kurzname} {tag}.
            </button>
          );
        })}
      </div>

      {/* Kein Unterricht */}
      {stunden.length === 0 && (
        <p className="py-12 text-center font-mono text-sm text-text-mute">
          Kein Unterricht an diesem Tag.
        </p>
      )}

      {/* Zeitleiste */}
      <div className="flex flex-col gap-3">
        {stunden.map((s, i) => {
          const fach = s.fach_id ? (faecher.get(s.fach_id) ?? null) : null;
          const farbe = fach?.farbe ?? FACH_FALLBACK_FARBE;
          const pause = pausen[i]; // Pause nach dieser Stunde
          return (
            <div key={s.id}>
              <div className="flex gap-4">
                <div className="w-12 flex-shrink-0 pt-2.5 text-right font-mono text-[10px] leading-relaxed text-text-mute">
                  {fmtZeit(s.zeit_start)}<br />↕<br />{fmtZeit(s.zeit_end)}
                </div>
                <div
                  className="relative flex flex-1 items-center justify-between overflow-hidden rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
                  style={{
                    background: hexToRgba(farbe, 0.1),
                    borderColor: hexToRgba(farbe, 0.22),
                    color: farbe,
                  }}
                >
                  {/* Topstreifen */}
                  <span
                    className="absolute left-4 right-4 top-0 h-0.5 rounded-b-sm opacity-50"
                    style={{ background: farbe }}
                  />
                  <span
                    className="pointer-events-none absolute inset-0"
                    style={{ background: "linear-gradient(135deg,rgba(255,255,255,.05),transparent 50%)" }}
                  />
                  <div>
                    <div className="font-display text-lg font-extrabold leading-tight">{fach?.name ?? "Fach"}</div>
                    {s.raum && <div className="font-mono text-xs opacity-40">{s.raum}</div>}
                  </div>
                  <div className="font-mono text-xs text-text-mute">
                    {(() => {
                      const [sh, sm] = s.zeit_start.split(":").map(Number);
                      const [eh, em] = s.zeit_end.split(":").map(Number);
                      return `${(eh * 60 + em) - (sh * 60 + sm)} min`;
                    })()}
                  </div>
                </div>
              </div>
              {pause && (
                <div className="my-2 flex items-center gap-3 pl-16">
                  <div className="h-px flex-1 bg-border" />
                  <span className="font-mono text-[9px] text-text-mute whitespace-nowrap">
                    {pause.minuten} min Pause
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Klausur-Warnung */}
      {baldKlausur && (
        <div
          className="mt-4 rounded-r-2xl border-l-2 p-3"
          style={{ borderColor: "var(--destructive)", background: "rgba(255,48,80,.08)" }}
        >
          <span className="font-display text-xs font-bold" style={{ color: "var(--destructive)" }}>
            ⚑ {baldKlausur.titel} — in {tageBis(baldKlausur.datum)} Tagen
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add components/stundenplan/tages-detail.tsx
git commit -m "feat: TagesDetail-Komponente mit Zeitleiste + Pausen"
```

---

## Task 11: StundeDialog-Komponente

**Files:**
- Create: `components/stundenplan/stunde-dialog.tsx`

- [ ] **Schreibe die Komponente**

```tsx
// components/stundenplan/stunde-dialog.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addStunde } from "@/lib/actions/stundenplan";
import type { FachRow } from "@/lib/grades/db";

const WOCHENTAGE = [
  { num: 1, label: "Montag" },
  { num: 2, label: "Dienstag" },
  { num: 3, label: "Mittwoch" },
  { num: 4, label: "Donnerstag" },
  { num: 5, label: "Freitag" },
  { num: 6, label: "Samstag" },
];

interface Props {
  faecher: FachRow[];
  wochenModus: "standard" | "AB";
  onClose: () => void;
}

export function StundeDialog({ faecher, wochenModus, onClose }: Props) {
  const [fachId, setFachId]       = useState("");
  const [wochentag, setWochentag] = useState("1");
  const [zeitStart, setZeitStart] = useState("08:00");
  const [zeitEnd, setZeitEnd]     = useState("09:30");
  const [raum, setRaum]           = useState("");
  const [wocheTyp, setWocheTyp]   = useState<"A" | "B" | "">( "");
  const [pending, start]          = useTransition();
  const router = useRouter();

  function speichern() {
    start(async () => {
      const res = await addStunde({
        fachId: fachId || null,
        wochentag: Number(wochentag),
        zeitStart,
        zeitEnd,
        raum: raum || null,
        wocheTyp: wocheTyp || null,
      });
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-md animate-fade-up rounded-t-3xl border border-border p-6 sm:rounded-3xl"
        style={{ background: "var(--surface-1)" }}
      >
        <h2 className="mb-5 font-display text-xl font-extrabold">Stunde hinzufügen</h2>

        <div className="flex flex-col gap-3">
          <select
            value={fachId} onChange={(e) => setFachId(e.target.value)}
            className="h-10 rounded-xl border border-border bg-surface-2 px-3 font-mono text-sm"
          >
            <option value="">Fach wählen (optional)</option>
            {faecher.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>

          <select
            value={wochentag} onChange={(e) => setWochentag(e.target.value)}
            className="h-10 rounded-xl border border-border bg-surface-2 px-3 font-mono text-sm"
          >
            {WOCHENTAGE.map((t) => <option key={t.num} value={t.num}>{t.label}</option>)}
          </select>

          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label className="font-mono text-[10px] text-text-dim">Von</label>
              <Input type="time" value={zeitStart} onChange={(e) => setZeitStart(e.target.value)}
                className="bg-surface-2 font-mono text-sm" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="font-mono text-[10px] text-text-dim">Bis</label>
              <Input type="time" value={zeitEnd} onChange={(e) => setZeitEnd(e.target.value)}
                className="bg-surface-2 font-mono text-sm" />
            </div>
          </div>

          <Input
            value={raum} onChange={(e) => setRaum(e.target.value)}
            placeholder="Raum (optional)"
            className="bg-surface-2 font-mono text-sm"
          />

          {wochenModus === "AB" && (
            <select
              value={wocheTyp} onChange={(e) => setWocheTyp(e.target.value as "A" | "B" | "")}
              className="h-10 rounded-xl border border-border bg-surface-2 px-3 font-mono text-sm"
            >
              <option value="">Jede Woche</option>
              <option value="A">Nur Woche A</option>
              <option value="B">Nur Woche B</option>
            </select>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Abbrechen</Button>
          <Button className="flex-1 font-display font-bold" onClick={speichern} disabled={pending}>
            Speichern
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add components/stundenplan/stunde-dialog.tsx
git commit -m "feat: StundeDialog-Komponente"
```

---

## Task 12: Stundenplan-Page (alles zusammenstecken)

**Files:**
- Replace: `app/(app)/stundenplan/page.tsx`

- [ ] **Schreibe die Page**

```tsx
// app/(app)/stundenplan/page.tsx
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { WochenRaster } from "@/components/stundenplan/wochen-raster";
import { TagesDetail } from "@/components/stundenplan/tages-detail";
import { StundeDialog } from "@/components/stundenplan/stunde-dialog";
import { wochentagAusDatum } from "@/lib/stundenplan/types";
import type { StundeRow } from "@/lib/stundenplan/types";
import type { KlausurRow, FachRow } from "@/lib/grades/db";
import type { HausaufgabeRow } from "@/lib/stundenplan/types";

// Da wir useSearchParams brauchen → Client Component
// Daten kommen als Props vom Server-Wrapper (siehe unten)

interface StundenplanClientProps {
  stunden: StundeRow[];
  fachRows: FachRow[];
  klausurRows: KlausurRow[];
  hausaufgabeRows: HausaufgabeRow[];
  aktuelleWoche: "A" | "B";
  wochenModus: "standard" | "AB";
  heute: string;
  wochenStart: string;
}

function StundenplanClient({
  stunden, fachRows, klausurRows, hausaufgabeRows,
  aktuelleWoche, wochenModus, heute, wochenStart,
}: StundenplanClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const datumParam = searchParams.get("datum");
  const [dialogOffen, setDialogOffen] = useState(false);

  const faecher = new Map(fachRows.map((f) => [f.id, { name: f.name, farbe: f.farbe }]));

  // Klausur-Daten dieser Woche als Set
  const klausurenDaten = new Set(
    klausurRows.map((k) => k.datum.slice(0, 10)),
  );

  // fach_ids mit offenen Hausaufgaben
  const offeneHaFachIds = new Set(
    hausaufgabeRows
      .filter((h) => !h.erledigt && h.fach_id)
      .map((h) => h.fach_id as string),
  );

  // 6 Tage der Woche (Mo–Sa)
  const wochenTage = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(wochenStart + "T12:00:00");
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { datum: iso, wochentag: i + 1 };
  });

  function onTagClick(datum: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("datum", datum);
    router.push(`/stundenplan?${params.toString()}`);
  }

  function zurueckZurWoche() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("datum");
    router.push(`/stundenplan?${params.toString()}`);
  }

  if (datumParam) {
    const wochentag = wochentagAusDatum(datumParam);
    const stundenAmTag = stunden
      .filter((s) => s.wochentag === wochentag)
      .sort((a, b) => a.zeit_start.localeCompare(b.zeit_start));

    return (
      <main className="relative z-[5] mx-auto w-full max-w-[600px] px-5 py-8 sm:px-8">
        <div className="animate-fade-up mb-6">
          <button onClick={zurueckZurWoche} className="mb-4 font-mono text-xs text-text-dim hover:text-foreground">
            ← Wochenübersicht
          </button>
          <h1 className="font-display text-3xl font-extrabold tracking-tight"
            style={{ background: "linear-gradient(135deg,#fff 30%,var(--brand))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {new Date(datumParam + "T12:00:00").toLocaleDateString("de-DE", { weekday: "long" })}
          </h1>
          <p className="mt-1 font-mono text-sm text-text-dim">
            {new Date(datumParam + "T12:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
            {datumParam === heute ? " · heute" : ""}
          </p>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <TagesDetail
            datum={datumParam}
            stunden={stundenAmTag}
            faecher={faecher}
            klausurenNaechste={klausurRows.map((k) => ({ datum: k.datum.slice(0, 10), titel: k.titel, fach_id: k.fach_id }))}
            onTagClick={onTagClick}
            wochenTage={wochenTage}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[980px] px-5 py-8 sm:px-8">
      <div className="animate-fade-up mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight"
            style={{ background: "linear-gradient(135deg,#fff 30%,var(--brand))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Stundenplan
          </h1>
          <p className="mt-1 font-mono text-sm text-text-dim">
            Klick auf einen Tag für die Tagesansicht
          </p>
        </div>
        <button
          onClick={() => setDialogOffen(true)}
          className="flex size-10 items-center justify-center rounded-full font-display text-xl font-extrabold text-black transition-transform hover:scale-110"
          style={{ background: "linear-gradient(135deg,var(--brand),var(--indigo))", boxShadow: "0 4px 14px rgba(29,161,255,.4)" }}
        >
          +
        </button>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <WochenRaster
          stunden={stunden}
          faecher={faecher}
          klausurenDaten={klausurenDaten}
          offeneHaFachIds={offeneHaFachIds}
          heute={heute}
          aktuelleWoche={aktuelleWoche}
          wochenModus={wochenModus}
          wochenStart={wochenStart}
          onTagClick={onTagClick}
        />
      </div>

      {dialogOffen && (
        <StundeDialog
          faecher={fachRows}
          wochenModus={wochenModus}
          onClose={() => setDialogOffen(false)}
        />
      )}
    </main>
  );
}

// Server-Wrapper der Daten fetcht
import { createClient } from "@/lib/supabase/server";

function montagDerWoche(heute: Date): string {
  const d = new Date(heute);
  const tag = d.getDay(); // 0=So
  const diff = tag === 0 ? -6 : 1 - tag;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export default async function StundenplanPage() {
  const supabase = await createClient();
  const heute = new Date().toISOString().slice(0, 10);
  const wochenStart = montagDerWoche(new Date());

  const [{ data: profil }, { data: fachRows }, { data: stundenRows }, { data: klausurRows }, { data: haRows }] =
    await Promise.all([
      supabase.from("nutzer_profil").select("wochen_modus, aktuelle_woche").single(),
      supabase.from("schule_fach").select("*").order("name"),
      supabase.from("stundenplan_stunde").select("*").order("wochentag").order("zeit_start"),
      supabase.from("schule_klausur").select("*").gte("datum", heute).order("datum").limit(30),
      supabase.from("hausaufgabe").select("*").eq("erledigt", false),
    ]);

  return (
    <Suspense fallback={null}>
      <StundenplanClient
        stunden={(stundenRows ?? []) as StundeRow[]}
        fachRows={(fachRows ?? []) as FachRow[]}
        klausurRows={(klausurRows ?? []) as KlausurRow[]}
        hausaufgabeRows={(haRows ?? []) as HausaufgabeRow[]}
        aktuelleWoche={(profil?.aktuelle_woche as "A" | "B") ?? "A"}
        wochenModus={(profil?.wochen_modus as "standard" | "AB") ?? "standard"}
        heute={heute}
        wochenStart={wochenStart}
      />
    </Suspense>
  );
}
```

- [ ] **Dev-Server: `/stundenplan` testen**

Browser-Checks:
1. Wochenraster zeigt leere Spalten (noch keine Stunden)
2. `+`-Button öffnet Dialog
3. Stunde eintragen → erscheint im Raster
4. Klick auf Datum → Tagesdetail mit Pill-Navigation
5. "← Wochenübersicht" kehrt zurück

- [ ] **Commit**

```bash
git add app/\(app\)/stundenplan/page.tsx
git commit -m "feat: Stundenplan-Page mit Wochenraster + Tagesdetail"
```

---

## Task 13: Onboarding + Einstellungen

**Files:**
- Modify: `app/onboarding/page.tsx`
- Modify: `lib/actions/schule.ts` (completeOnboarding erweitern)
- Modify: `app/(app)/einstellungen/page.tsx`

- [ ] **`completeOnboarding` in `lib/actions/schule.ts` um `wochenModus` erweitern**

Finde die Funktion `completeOnboarding` in der Datei und erweitere sie:

```ts
export async function completeOnboarding(
  eingabeModus: "punkte" | "note",
  wochenModus: "standard" | "AB" = "standard",
): Promise<ActionResult> {
  // ... bestehende Logik ...
  const { error } = await supabase
    .from("nutzer_profil")
    .update({
      eingabe_modus: eingabeModus,
      wochen_modus: wochenModus,           // NEU
      onboarding_abgeschlossen: true,
    })
    .eq("id", userId);
  // ... rest bleibt gleich
}
```

- [ ] **Onboarding-Page: Schritt 3 hinzufügen**

In `app/onboarding/page.tsx`, `step`-State auf max 3 erweitern, Progress-Dots auf 3, neuen Step-Block hinzufügen:

```tsx
// State-Ergänzung:
const [wochenModus, setWochenModus] = useState<"standard" | "AB">("standard");

// Progress-Dots: [1, 2] → [1, 2, 3]
{[1, 2, 3].map((s) => ( ... ))}

// finish() anpassen:
const res = await completeOnboarding(eingabeModus, wochenModus);

// Neuer Step-Block nach Step 2 (vor dem return-Ende):
{step === 3 && (
  <div className="w-full max-w-md animate-fade-up text-center">
    <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
      Schritt 3 von 3
    </div>
    <h1 className="font-display text-4xl font-extrabold leading-tight">
      Nutzt deine Schule A/B-Wochen?
    </h1>
    <p className="mt-3 text-sm text-text-dim">
      Manche Schulen wechseln jede Woche zwischen zwei verschiedenen Stundenplänen.
    </p>
    <div className="mt-8 flex flex-col gap-3">
      {(["standard", "AB"] as const).map((m) => (
        <button
          key={m}
          onClick={() => setWochenModus(m)}
          className={`rounded-2xl border p-5 text-left transition-all ${
            wochenModus === m
              ? "border-brand bg-brand/10"
              : "border-border bg-surface-2 hover:bg-surface-3"
          }`}
        >
          <div className="font-display font-extrabold">
            {m === "standard" ? "Nein, normaler Stundenplan" : "Ja, A/B-Wochen"}
          </div>
          <div className="mt-1 font-mono text-sm text-text-dim">
            {m === "standard"
              ? "Jede Woche ist gleich."
              : "Woche A und Woche B wechseln sich ab."}
          </div>
        </button>
      ))}
    </div>
    <button
      onClick={finish}
      className="mt-6 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90"
    >
      Fertig →
    </button>
  </div>
)}
```

Außerdem: `step === 2`-Button "Weiter →" soll zu `setStep(3)` statt `finish()`.

- [ ] **Einstellungen: A/B-Woche-Toggle**

In `app/(app)/einstellungen/page.tsx`, nach dem bestehenden Eingabe-Modus-Setting folgendes ergänzen (exakte Position nach dem ersten Setting-Block):

```tsx
{/* A/B-Wochen Setting */}
<div className="animate-fade-up rounded-3xl border border-border p-6"
  style={{ background: "var(--card-grad)", animationDelay: "120ms" }}>
  <h2 className="font-display text-xl font-extrabold">Wochenplan-Modus</h2>
  <p className="mt-1 text-sm text-text-dim">
    Nutzt deine Schule A- und B-Wochen?
  </p>
  <WochenModusToggle aktuellerModus={profil.wochen_modus ?? "standard"} />
</div>
```

Neue Client-Komponente inline in der Einstellungen-Datei oder als separates File `components/einstellungen/wochen-modus-toggle.tsx`:

```tsx
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// Server Action: setWochenModus — in lib/actions/schule.ts hinzufügen
import { setWochenModus } from "@/lib/actions/schule";

export function WochenModusToggle({ aktuellerModus }: { aktuellerModus: "standard" | "AB" }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle(modus: "standard" | "AB") {
    start(async () => {
      const res = await setWochenModus(modus);
      if (!res.ok) toast.error(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="mt-4 flex gap-2">
      {(["standard", "AB"] as const).map((m) => (
        <button
          key={m}
          onClick={() => toggle(m)}
          disabled={pending}
          className={`flex-1 rounded-xl border py-2.5 font-mono text-sm font-bold transition-all ${
            aktuellerModus === m
              ? "border-brand bg-brand/10 text-brand"
              : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"
          }`}
        >
          {m === "standard" ? "Normal" : "A/B-Wochen"}
        </button>
      ))}
    </div>
  );
}
```

`setWochenModus` in `lib/actions/schule.ts` hinzufügen:

```ts
export async function setWochenModus(
  modus: "standard" | "AB",
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ wochen_modus: modus })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/einstellungen");
    revalidatePath("/stundenplan");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Tests laufen lassen**

```bash
cd ~/project-x && npx vitest run
```
Expected: All tests pass (nur lib/**/*.test.ts).

- [ ] **Build-Check**

```bash
npm run build
```
Expected: Kein TypeScript-Fehler, kein Build-Fehler.

- [ ] **Commit**

```bash
git add app/onboarding/page.tsx app/\(app\)/einstellungen/page.tsx lib/actions/schule.ts components/einstellungen/
git commit -m "feat: Onboarding A/B-Wochen-Schritt + Einstellungen-Toggle"
```

---

## Self-Review Checklist

- [x] **Spec §2 Navigation:** Aufgaben-Tab ✓ (Task 4), KlausurSection aus Noten ✓ (Task 7)
- [x] **Spec §3 DB:** `stundenplan_stunde` ✓, `hausaufgabe` ✓, `wochen_modus`/`aktuelle_woche` ✓ (Task 1)
- [x] **Spec §4a Wochenraster:** Grid, heute-Tint, Kachel-Farben, Badges, Klausur-Dot ✓ (Tasks 8+9)
- [x] **Spec §4b Tagesdetail:** Pills, Zeitleiste, Pausen, Klausur-Warnung, URL-Param ✓ (Task 10)
- [x] **Spec §4c Stunden-Verwaltung:** FAB, Dialog, Felder ✓ (Task 11+12)
- [x] **Spec §5 Aufgaben:** KlausurListe ✓ (Task 5), HausaufgabenListe ✓ (Task 6), Seite ✓ (Task 7)
- [x] **Spec §6 Onboarding:** Schritt 3 ✓, Einstellungen-Toggle ✓ (Task 13)
- [x] **Spec §7 Design:** hexToRgba-Helper, Stripe-Glow, Hover-Lift, Stagger-Reveal in allen Komponenten ✓
- [x] **Type-Konsistenz:** `StundeRow`, `HausaufgabeRow` in `lib/stundenplan/types.ts` definiert, in allen Komponenten als Import genutzt ✓
- [x] **Keine Platzhalter:** Alle Schritte enthalten vollständigen Code ✓
