# Notenrechner Schicht 3 (Halbjahr-Paket) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Halbjahr-System nutzbar machen: zwischen Halbjahren umschalten, neues Halbjahr per Übernahme-Dialog anlegen, Klausuren mit Terminen erfassen (aktiviert den Countdown-Badge aus Schicht 2).

**Architecture:** Reine Halbjahr-Helfer in `lib/grades/halbjahr.ts` (Vitest). Server Actions `setHalbjahr`/`neuesHalbjahr` in der bestehenden `app/dashboard/actions.ts`. Drei neue Client-Komponenten (Switcher, Neues-HJ-Dialog, Klausur-Section), die per `useTransition` + `router.refresh()` nach Mutationen neu laden. Dashboard lädt verfügbare Halbjahre + alle kommenden Klausuren und reicht sie ans Board.

**Tech Stack:** Next.js 16, Supabase RLS, TypeScript strict, Vitest, sonner, base-ui Dialog, Tailwind v4.

**Scope:** NUR Halbjahr-Paket. Was-wäre-wenn und Jahresübersicht sind die nächste Runde (nicht hier).

---

## File Structure

**Neu:**
- `components/notenrechner/halbjahr-switcher.tsx` — Halbjahr-Chips + "+ neues HJ"
- `components/notenrechner/neues-halbjahr-dialog.tsx` — Übernahme-Dialog (base-ui)
- `components/notenrechner/klausur-section.tsx` — Klausur-Formular + Liste

**Geändert:**
- `lib/grades/halbjahr.ts` — `halbjahrLabel` + `naechstesHalbjahr`
- `lib/grades/halbjahr.test.ts` — Tests dafür
- `app/dashboard/actions.ts` — `setHalbjahr` + `neuesHalbjahr`
- `components/notenrechner/notenrechner-board.tsx` — Switcher oben, KlausurSection unten, neue Props
- `app/dashboard/page.tsx` — verfügbare Halbjahre + alle kommenden Klausuren laden

---

## Task 1: Halbjahr-Helfer (TDD)

**Files:**
- Modify: `lib/grades/halbjahr.ts`
- Modify: `lib/grades/halbjahr.test.ts`

- [ ] **Step 1: Failing Tests anhängen**

Ans Ende von `lib/grades/halbjahr.test.ts` (Import-Zeile oben anpassen):
```ts
import { aktuellesHalbjahr, halbjahrLabel, naechstesHalbjahr } from "./halbjahr";
```
Neue describe-Blöcke ans Dateiende:
```ts
describe("halbjahrLabel", () => {
  it("formatiert HJ-2 lesbar", () => {
    expect(halbjahrLabel("2025/26-2")).toBe("2. Halbjahr · 2025/26");
  });
  it("formatiert HJ-1 lesbar", () => {
    expect(halbjahrLabel("2026/27-1")).toBe("1. Halbjahr · 2026/27");
  });
  it("gibt ungültigen Input unverändert zurück", () => {
    expect(halbjahrLabel("quatsch")).toBe("quatsch");
  });
});

describe("naechstesHalbjahr", () => {
  it("HJ-1 -> HJ-2 im selben Schuljahr", () => {
    expect(naechstesHalbjahr("2025/26-1")).toBe("2025/26-2");
  });
  it("HJ-2 -> HJ-1 im nächsten Schuljahr", () => {
    expect(naechstesHalbjahr("2025/26-2")).toBe("2026/27-1");
  });
  it("Jahrhundertwechsel korrekt (2099/00-2 -> 2100/01-1)", () => {
    expect(naechstesHalbjahr("2099/00-2")).toBe("2100/01-1");
  });
});
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

Run: `cd ~/project-x && npx vitest run lib/grades/halbjahr.test.ts`
Expected: FAIL ("halbjahrLabel is not a function").

- [ ] **Step 3: Helfer implementieren**

Ans Ende von `lib/grades/halbjahr.ts` anhängen:
```ts
/** Zerlegt "JJJJ/JJ-N" in Startjahr, Kurzjahr, Halbjahr-Nummer. */
function parseHalbjahr(hj: string): { startjahr: number; kurz: string; nummer: number } | null {
  const m = /^(\d{4})\/(\d{2})-([12])$/.exec(hj);
  if (!m) return null;
  return { startjahr: Number(m[1]), kurz: m[2], nummer: Number(m[3]) };
}

/** "2025/26-2" -> "2. Halbjahr · 2025/26". Ungültiger Input wird unverändert zurückgegeben. */
export function halbjahrLabel(hj: string): string {
  const p = parseHalbjahr(hj);
  if (!p) return hj;
  return `${p.nummer}. Halbjahr · ${p.startjahr}/${p.kurz}`;
}

/** Liefert das chronologisch nächste Halbjahr. HJ-1 -> HJ-2, HJ-2 -> HJ-1 des Folgejahres. */
export function naechstesHalbjahr(hj: string): string {
  const p = parseHalbjahr(hj);
  if (!p) return hj;
  if (p.nummer === 1) {
    return `${p.startjahr}/${p.kurz}-2`;
  }
  const neuStart = p.startjahr + 1;
  const neuKurz = String((neuStart + 1) % 100).padStart(2, "0");
  return `${neuStart}/${neuKurz}-1`;
}
```

- [ ] **Step 4: Tests grün**

Run: `cd ~/project-x && npx vitest run lib/grades/halbjahr.test.ts`
Expected: PASS (alle, inkl. der 3 alten aktuellesHalbjahr-Tests).

- [ ] **Step 5: Commit**

```bash
cd ~/project-x && git add lib/grades/halbjahr.ts lib/grades/halbjahr.test.ts
git commit -m "feat: halbjahrLabel + naechstesHalbjahr Helfer"
```

---

## Task 2: Server Actions setHalbjahr + neuesHalbjahr

**Files:**
- Modify: `app/dashboard/actions.ts`

- [ ] **Step 1: Actions ans Ende von actions.ts anhängen**

```ts
export async function setHalbjahr(hj: string): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ aktuelles_halbjahr: hj })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}

export interface NeuesFachInput {
  name: string;
  niveau: string;
  farbe: string | null;
  gewicht_klausur: number;
  gewicht_muendlich: number;
  fach_gewicht: number;
}

export async function neuesHalbjahr(
  neuesHj: string,
  faecher: NeuesFachInput[],
): Promise<ActionResult> {
  if (!neuesHj.trim()) return { ok: false, error: "Halbjahr fehlt." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();

    if (faecher.length > 0) {
      const rows = faecher.map((f) => ({
        user_id: userId,
        name: f.name,
        niveau: f.niveau,
        farbe: f.farbe,
        gewicht_klausur: f.gewicht_klausur,
        gewicht_muendlich: f.gewicht_muendlich,
        fach_gewicht: f.fach_gewicht,
        halbjahr: neuesHj,
      }));
      const { error } = await supabase.from("schule_fach").insert(rows);
      if (error) return { ok: false, error: error.message };
    }

    const { error: profilError } = await supabase
      .from("nutzer_profil")
      .update({ aktuelles_halbjahr: neuesHj })
      .eq("id", userId);
    if (profilError) return { ok: false, error: profilError.message };

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
git commit -m "feat: Server Actions setHalbjahr + neuesHalbjahr"
```

---

## Task 3: Neues-Halbjahr-Dialog

**Files:**
- Create: `components/notenrechner/neues-halbjahr-dialog.tsx`

> base-ui Dialog wie in `components/notenrechner/fach-dialog.tsx`. Pro Fach eine Checkbox (default an = übernehmen) + Klausur-%-Input. Bestätigen ruft `neuesHalbjahr` und danach `router.refresh()`.

- [ ] **Step 1: Komponente anlegen**

Create `components/notenrechner/neues-halbjahr-dialog.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { neuesHalbjahr, type NeuesFachInput } from "@/app/dashboard/actions";
import { halbjahrLabel } from "@/lib/grades/halbjahr";
import type { Fach } from "@/lib/grades/types";

interface FachAuswahl {
  uebernehmen: boolean;
  klausurProzent: number;
  fach: Fach;
}

export function NeuesHalbjahrDialog({
  open,
  onClose,
  vorschlagHj,
  aktuelleFaecher,
}: {
  open: boolean;
  onClose: () => void;
  vorschlagHj: string;
  aktuelleFaecher: Fach[];
}) {
  const [hj, setHj] = useState(vorschlagHj);
  const [auswahl, setAuswahl] = useState<FachAuswahl[]>(
    aktuelleFaecher.map((f) => ({
      uebernehmen: true,
      klausurProzent: Math.round((f.gewichtung?.klausur ?? 0.5) * 100),
      fach: f,
    })),
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(i: number) {
    setAuswahl((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, uebernehmen: !a.uebernehmen } : a)),
    );
  }

  function setProzent(i: number, value: number) {
    setAuswahl((prev) =>
      prev.map((a, idx) =>
        idx === i ? { ...a, klausurProzent: Math.min(100, Math.max(0, value)) } : a,
      ),
    );
  }

  function erstellen() {
    const ziel = hj.trim();
    if (!ziel) {
      toast.error("Bitte ein Halbjahr angeben.");
      return;
    }
    const faecher: NeuesFachInput[] = auswahl
      .filter((a) => a.uebernehmen)
      .map((a) => ({
        name: a.fach.name,
        niveau: a.fach.niveau ?? "grund",
        farbe: a.fach.farbe ?? null,
        gewicht_klausur: a.klausurProzent / 100,
        gewicht_muendlich: (100 - a.klausurProzent) / 100,
        fach_gewicht: a.fach.fachGewicht ?? 1,
      }));
    startTransition(async () => {
      const res = await neuesHalbjahr(ziel, faecher);
      if (!res.ok) {
        toast.error(`Konnte nicht erstellt werden: ${res.error}`);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-surface-1 p-6 shadow-2xl">
          <Dialog.Title className="font-display text-xl font-extrabold">
            Neues Halbjahr anlegen
          </Dialog.Title>
          <p className="mt-1 text-sm text-text-dim">
            Welche Fächer nimmst du mit? Noten werden nicht kopiert.
          </p>

          {/* Halbjahr-Eingabe */}
          <div className="mt-4">
            <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
              Halbjahr (Format JJJJ/JJ-N)
            </div>
            <Input
              value={hj}
              onChange={(e) => setHj(e.target.value)}
              placeholder="2026/27-1"
              className="bg-surface-2 font-mono"
            />
            <p className="mt-1 font-mono text-[11px] text-text-mute">
              {halbjahrLabel(hj)}
            </p>
          </div>

          {/* Fächer-Liste */}
          <div className="mt-4 space-y-2">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
              Fächer übernehmen
            </div>
            {auswahl.length === 0 && (
              <p className="font-mono text-xs text-text-mute">
                Keine Fächer im aktuellen Halbjahr — du startest leer.
              </p>
            )}
            {auswahl.map((a, i) => (
              <div
                key={a.fach.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2"
              >
                <label className="flex flex-1 items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={a.uebernehmen}
                    onChange={() => toggle(i)}
                    className="size-4 accent-brand"
                  />
                  <span
                    className={`font-display font-bold ${a.uebernehmen ? "" : "text-text-mute line-through"}`}
                  >
                    {a.fach.name}
                  </span>
                </label>
                {a.uebernehmen && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-text-dim">
                    Klausur
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={a.klausurProzent}
                      onChange={(e) => setProzent(i, Number(e.target.value))}
                      className="h-7 w-16 bg-surface-1 font-mono text-xs"
                    />
                    %
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border bg-surface-2"
            >
              Abbrechen
            </Button>
            <Button
              onClick={erstellen}
              disabled={pending}
              className="font-display font-bold"
            >
              {halbjahrLabel(hj).split(" · ")[0]} erstellen
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
cd ~/project-x && git add components/notenrechner/neues-halbjahr-dialog.tsx
git commit -m "feat: NeuesHalbjahrDialog (Fächer übernehmen + Gewichtung)"
```

---

## Task 4: Halbjahr-Switcher

**Files:**
- Create: `components/notenrechner/halbjahr-switcher.tsx`

- [ ] **Step 1: Komponente anlegen**

Create `components/notenrechner/halbjahr-switcher.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setHalbjahr } from "@/app/dashboard/actions";
import { halbjahrLabel, naechstesHalbjahr } from "@/lib/grades/halbjahr";
import { NeuesHalbjahrDialog } from "./neues-halbjahr-dialog";
import type { Fach } from "@/lib/grades/types";

export function HalbjahrSwitcher({
  verfuegbareHalbjahre,
  aktuellesHj,
  aktuelleFaecher,
}: {
  verfuegbareHalbjahre: string[];
  aktuellesHj: string;
  aktuelleFaecher: Fach[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function wechseln(hj: string) {
    if (hj === aktuellesHj) return;
    startTransition(async () => {
      const res = await setHalbjahr(hj);
      if (!res.ok) {
        toast.error(`Wechsel fehlgeschlagen: ${res.error}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-surface-2 p-1">
        {verfuegbareHalbjahre.map((hj) => (
          <button
            key={hj}
            onClick={() => wechseln(hj)}
            disabled={pending}
            className={`rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
              hj === aktuellesHj
                ? "bg-brand font-semibold text-black"
                : "text-text-dim hover:bg-surface-3"
            }`}
          >
            {halbjahrLabel(hj).split(" · ")[0]}
            <span className="ml-1 opacity-60">
              {halbjahrLabel(hj).split(" · ")[1]}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setDialogOpen(true)}
        className="rounded-xl border border-dashed border-brand/40 bg-brand/5 px-3 py-1.5 font-mono text-xs text-brand hover:bg-brand/10"
      >
        + neues HJ
      </button>

      <NeuesHalbjahrDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        vorschlagHj={naechstesHalbjahr(aktuellesHj)}
        aktuelleFaecher={aktuelleFaecher}
      />
    </div>
  );
}
```

- [ ] **Step 2: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
cd ~/project-x && git add components/notenrechner/halbjahr-switcher.tsx
git commit -m "feat: HalbjahrSwitcher (Chips + neues-HJ-Dialog)"
```

---

## Task 5: Klausur-Section

**Files:**
- Create: `components/notenrechner/klausur-section.tsx`

> Formular (Titel + Datum + Fach-Dropdown) ruft `addKlausur`. Liste kommender Klausuren mit Countdown + Löschen (`removeKlausur`). Beide Actions existieren aus Schicht 2. Nach Mutation `router.refresh()`.

- [ ] **Step 1: Komponente anlegen**

Create `components/notenrechner/klausur-section.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addKlausur, removeKlausur } from "@/app/dashboard/actions";
import type { Fach } from "@/lib/grades/types";
import type { KlausurRow } from "@/lib/grades/db";

function tageBis(datumIso: string): number {
  const diff = new Date(datumIso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function fmtDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function KlausurSection({
  faecher,
  klausuren,
}: {
  faecher: Fach[];
  klausuren: KlausurRow[];
}) {
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState("");
  const [fachId, setFachId] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const fachName = new Map(faecher.map((f) => [f.id, f.name]));

  function hinzufuegen() {
    if (!titel.trim() || !datum) {
      toast.error("Titel und Datum sind nötig.");
      return;
    }
    startTransition(async () => {
      const res = await addKlausur(
        titel,
        new Date(datum).toISOString(),
        fachId || undefined,
      );
      if (!res.ok) {
        toast.error(`Fehler: ${res.error}`);
      } else {
        setTitel("");
        setDatum("");
        setFachId("");
        router.refresh();
      }
    });
  }

  function loeschen(id: string) {
    startTransition(async () => {
      const res = await removeKlausur(id);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  return (
    <section
      className="animate-fade-up mt-6 rounded-3xl border border-border p-6"
      style={{ background: "var(--card-grad)" }}
    >
      <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">
        Klausuren &amp; Termine
      </h2>

      {/* Formular */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel, z. B. 2. Klausur"
          className="h-9 flex-1 bg-surface-2 font-mono text-sm"
        />
        <Input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className="h-9 w-40 bg-surface-2 font-mono text-sm"
        />
        <select
          value={fachId}
          onChange={(e) => setFachId(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-text-dim"
        >
          <option value="">Fach (optional)</option>
          {faecher.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <Button
          onClick={hinzufuegen}
          disabled={pending}
          size="sm"
          className="font-display font-bold"
        >
          + Termin
        </Button>
      </div>

      {/* Liste */}
      <div className="mt-4 space-y-2">
        {klausuren.length === 0 && (
          <p className="font-mono text-xs text-text-mute">
            Noch keine Termine — trag deine nächste Klausur ein.
          </p>
        )}
        {klausuren.map((k) => {
          const tage = tageBis(k.datum);
          return (
            <div
              key={k.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate font-display font-bold">{k.titel}</div>
                <div className="font-mono text-[11px] text-text-dim">
                  {k.fach_id && fachName.get(k.fach_id)
                    ? `${fachName.get(k.fach_id)} · `
                    : ""}
                  {fmtDatum(k.datum)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-xs ${tage <= 7 ? "text-destructive" : "text-text-dim"}`}
                >
                  {tage < 0
                    ? "vorbei"
                    : tage === 0
                    ? "heute"
                    : tage === 1
                    ? "morgen"
                    : `in ${tage} T`}
                </span>
                <button
                  onClick={() => loeschen(k.id)}
                  title="Termin löschen"
                  className="text-text-mute transition-colors hover:text-destructive"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
cd ~/project-x && git add components/notenrechner/klausur-section.tsx
git commit -m "feat: KlausurSection (Termin anlegen + Liste mit Countdown)"
```

---

## Task 6: Board integriert Switcher + KlausurSection

**Files:**
- Modify: `components/notenrechner/notenrechner-board.tsx`

> Neue Props: `verfuegbareHalbjahre`. `initialKlausuren` enthält jetzt ALLE kommenden Klausuren (nicht nur eine pro Fach). Board baut die Badge-Map selbst via `assembleKlausuren` und gibt die volle Liste an KlausurSection. Switcher kommt vor den Hero, KlausurSection nach dem Grid.

- [ ] **Step 1: Imports + Props erweitern**

In `components/notenrechner/notenrechner-board.tsx` die Import-Zeilen für db/Komponenten ergänzen:
```tsx
import { assembleKlausuren, type KlausurRow } from "@/lib/grades/db";
import { HalbjahrSwitcher } from "./halbjahr-switcher";
import { KlausurSection } from "./klausur-section";
```
(Die bestehende `import type { KlausurRow }`-Zeile entfernen, da jetzt oben mit dabei.)

Props-Signatur erweitern:
```tsx
export function NotenrechnerBoard({
  initialFaecher,
  halbjahr,
  initialKlausuren,
  verfuegbareHalbjahre,
}: {
  initialFaecher: Fach[];
  halbjahr: string;
  initialKlausuren: KlausurRow[];
  verfuegbareHalbjahre: string[];
}) {
```

- [ ] **Step 2: klausurByFach aus assembleKlausuren bauen**

Im Board-Body die bestehende `klausurByFach`-Map-Zeile ersetzen:
```tsx
  const klausurByFach = assembleKlausuren(klausuren);
```
(`assembleKlausuren` nimmt die volle Liste und liefert die Map fach_id → erste/nächste Klausur — passt für den Badge.)

- [ ] **Step 3: Switcher vor Hero, KlausurSection nach Grid einsetzen**

Direkt nach dem öffnenden `<>` (vor der Hero-`<section>`) einfügen:
```tsx
      <div className="animate-fade-up mb-4">
        <HalbjahrSwitcher
          verfuegbareHalbjahre={verfuegbareHalbjahre}
          aktuellesHj={halbjahr}
          aktuelleFaecher={faecher}
        />
      </div>
```

Nach dem schließenden `</div>` des Fächer-Grids (vor dem `{dialogFach && (`-Block) einfügen:
```tsx
      <KlausurSection faecher={faecher} klausuren={klausuren} />
```

- [ ] **Step 4: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 5: Commit**

```bash
cd ~/project-x && git add components/notenrechner/notenrechner-board.tsx
git commit -m "feat: Board integriert HalbjahrSwitcher + KlausurSection"
```

---

## Task 7: Dashboard lädt Halbjahre + alle Klausuren

**Files:**
- Modify: `app/dashboard/page.tsx`

> Verfügbare Halbjahre = distinct `halbjahr` aus allen Fächern des Users. Klausuren: alle kommenden (volle Liste, nicht via Map zusammengefasst) für die KlausurSection-Liste UND die Badge-Map (Board baut die selbst).

- [ ] **Step 1: Abfragen + Props anpassen**

In `app/dashboard/page.tsx`:

(a) Den `assembleKlausuren`-Import entfernen (Board macht das jetzt) — Importzeile auf:
```tsx
import {
  assembleFaecher,
  type FachRow,
  type NoteRow,
  type KlausurRow,
} from "@/lib/grades/db";
```

(b) Nach dem Laden von `fachRows` die verfügbaren Halbjahre bestimmen. Direkt nach der `fachRows`-Query (vor `fachIds`) einfügen:
```tsx
  // Verfügbare Halbjahre (distinct) über ALLE Fächer des Users
  const { data: hjRows } = await supabase
    .from("schule_fach")
    .select("halbjahr");
  const verfuegbareHalbjahre = Array.from(
    new Set([
      halbjahr,
      ...((hjRows ?? [])
        .map((r) => r.halbjahr)
        .filter((h): h is string => !!h)),
    ]),
  ).sort();
```

(c) Die Klausur-Verarbeitung ersetzen. Den Block
```tsx
  const klausurMap = assembleKlausuren((klausurRows ?? []) as KlausurRow[]);
  const klausuren = Array.from(klausurMap.values());
```
ersetzen durch:
```tsx
  const klausuren = (klausurRows ?? []) as KlausurRow[];
```

(d) Den `<NotenrechnerBoard>`-Aufruf um die neue Prop erweitern:
```tsx
      <NotenrechnerBoard
        initialFaecher={faecher}
        halbjahr={halbjahr}
        initialKlausuren={klausuren}
        verfuegbareHalbjahre={verfuegbareHalbjahre}
      />
```

- [ ] **Step 2: TypeCheck + Build + Tests**

Run: `cd ~/project-x && npx tsc --noEmit && npm test && npm run build`
Expected: tsc clean, Tests grün (40+), Build erfolgreich.

- [ ] **Step 3: Commit**

```bash
cd ~/project-x && git add app/dashboard/page.tsx
git commit -m "feat: Dashboard lädt verfügbare Halbjahre + alle kommenden Klausuren"
```

---

## Task 8: Manuelle Verifikation

- [ ] **Step 1: Dev-Server frisch starten**

Run: `cd ~/project-x && lsof -ti:3000 | xargs kill 2>/dev/null; rm -rf .next` — dann `npm run dev` (Hintergrund).

- [ ] **Step 2: Smoke-Test (Nepomuk)** auf `http://localhost:3000/dashboard`:
1. Halbjahr-Switcher oben zeigt das aktuelle HJ als Chip.
2. "+ neues HJ" → Dialog mit Vorschlag (nächstes HJ) + Fächer-Liste mit Häkchen. Ein Fach abwählen, Klausur-% ändern, erstellen.
3. Nach Erstellen: neues HJ ist aktiv, übernommene Fächer da (ohne Noten), abgewähltes fehlt.
4. Zurück aufs alte HJ wechseln (Chip klicken) → alte Fächer + Noten wieder da.
5. Klausur-Section unten: Termin (Titel + Datum + Fach) anlegen → erscheint in Liste mit Countdown; beim zugeordneten Fach erscheint der ⏰-Badge (wenn ≤14 Tage).
6. Termin löschen (×) → verschwindet.

- [ ] **Step 3: Alle Tests + Build final**

Run: `cd ~/project-x && npm test && npm run build`
Expected: alle grün.

---

## Self-Review

**Scope-Abdeckung (Halbjahr-Paket):**
- halbjahrLabel + naechstesHalbjahr → Task 1 ✓
- setHalbjahr + neuesHalbjahr → Task 2 ✓
- NeuesHalbjahrDialog (übernehmen + Gewichtung) → Task 3 ✓
- HalbjahrSwitcher → Task 4 ✓
- KlausurSection (anlegen + Liste + Countdown + löschen) → Task 5 ✓
- Board-Integration → Task 6 ✓
- Dashboard-Daten → Task 7 ✓

**Bewusst nicht dabei:** Was-wäre-wenn, Jahresübersicht (nächste Runde).

**Typ-Konsistenz:** `NeuesFachInput` in actions.ts definiert, in neues-halbjahr-dialog.tsx importiert. `KlausurRow` aus db.ts in board + klausur-section + dashboard konsistent. `assembleKlausuren` wandert von dashboard ins Board (Task 6+7 gemeinsam) — beide Stellen angepasst, kein doppelter Aufruf. Board-Props (`verfuegbareHalbjahre` neu) in Task 6 definiert und in Task 7 übergeben.

**Datenfluss-Hinweis:** `initialKlausuren` bedeutet ab jetzt „alle kommenden Klausuren" (vorher: eine pro Fach). Board baut die Badge-Map selbst — dadurch funktioniert sowohl der Countdown-Badge (Schicht 2) als auch die neue Klausur-Liste aus derselben Datenquelle.
