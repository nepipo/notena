# Navigation + Übersichts-Hub (Teil A) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Persistente Navigation (unten am Handy/iPad, oben am Mac) + Übersichts-Hub + Profil-Seite + eigene Was-wäre-wenn-Seite + Stundenplan-Platzhalter.

**Architecture:** Next.js Route-Group `app/(app)/` mit gemeinsamem `layout.tsx`, das Auth- und Onboarding-Check zentralisiert und die Nav rendert. Server Actions ziehen von `app/dashboard/actions.ts` nach `lib/actions/schule.ts`. Der bisherige Notenrechner (`/dashboard`) zieht nach `/noten`; `/dashboard` wird der Hub.

**Tech Stack:** Next.js 16 App Router, Supabase RLS, TypeScript strict, lucide-react, Tailwind v4, sonner.

**Scope:** NUR Teil A. Das echte Stundenplan-Modul ist Teil B (eigener Plan).

---

## File Structure

**Neu:**
- `lib/actions/schule.ts` — alle bisherigen Server Actions (umgezogen) + neu `updateProfil`
- `components/app-nav.tsx` — Nav (Top-Header + Bottom-Tabs, responsive)
- `app/(app)/layout.tsx` — Auth + Onboarding-Check + Nav-Rahmen
- `app/(app)/dashboard/page.tsx` — Hub (Widgets)
- `app/(app)/noten/page.tsx` — Notenrechner (Umzug)
- `app/(app)/einstellungen/page.tsx` — Einstellungen (Umzug)
- `app/(app)/profil/page.tsx` — Profil (neu)
- `app/(app)/was-waere-wenn/page.tsx` — Was-wäre-wenn (neu)
- `app/(app)/stundenplan/page.tsx` — Platzhalter

**Gelöscht (nach Umzug):** `app/dashboard/` (page.tsx + actions.ts), `app/settings/page.tsx`.

**Imports angepasst (7):** `app/onboarding/page.tsx` + `components/notenrechner/{fach-dialog,halbjahr-switcher,klausur-section,notenrechner-board,neues-halbjahr-dialog}.tsx` + die umgezogene einstellungen-Seite — alle `@/app/dashboard/actions` → `@/lib/actions/schule`.

---

## Task 1: Server Actions nach lib/actions/schule.ts umziehen

**Files:**
- Create: `lib/actions/schule.ts` (Inhalt = bisheriges `app/dashboard/actions.ts`, 1:1)
- Delete: `app/dashboard/actions.ts`
- Modify: 6 Importeure (settings noch nicht umgezogen → wird in Task 3 angefasst; hier die 5 Komponenten + onboarding)

- [ ] **Step 1: Datei kopieren**

```bash
cd ~/project-x && mkdir -p lib/actions && git mv app/dashboard/actions.ts lib/actions/schule.ts
```

- [ ] **Step 2: Imports in den 5 Notenrechner-Komponenten + onboarding anpassen**

Run (ersetzt den Import-Pfad in allen betroffenen Dateien):
```bash
cd ~/project-x && grep -rl "@/app/dashboard/actions" app components | xargs sed -i '' 's#@/app/dashboard/actions#@/lib/actions/schule#g'
```

- [ ] **Step 3: Verifizieren, dass kein alter Import übrig ist**

Run: `cd ~/project-x && grep -rn "@/app/dashboard/actions" app components || echo "KEINE alten Imports mehr"`
Expected: `KEINE alten Imports mehr`

- [ ] **Step 4: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit 2>&1 | grep -v "npm notice" | head`
Expected: keine Fehler. (Die `app/dashboard/page.tsx` importiert actions nicht direkt; sie bleibt vorerst funktionsfähig auf `/dashboard`.)

- [ ] **Step 5: Commit**

```bash
cd ~/project-x && git add -A && git commit -m "refactor: Server Actions nach lib/actions/schule.ts (Vorbereitung Navigation)"
```

---

## Task 2: Nav-Komponente

**Files:**
- Create: `components/app-nav.tsx`

> Top-Header (immer): Logo links, Profil-Avatar rechts; auf ≥lg zusätzlich die Tabs mittig. Bottom-Tab-Bar (nur <lg): die 5 Tabs. Aktiver Tab via `usePathname`.

- [ ] **Step 1: Komponente anlegen**

Create `components/app-nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  Sparkles,
  CalendarDays,
  Settings,
  type LucideIcon,
} from "lucide-react";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/noten", label: "Noten", icon: Calculator },
  { href: "/was-waere-wenn", label: "Was-wäre-wenn", icon: Sparkles },
  { href: "/stundenplan", label: "Stundenplan", icon: CalendarDays },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

function istAktiv(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppNav({ initiale }: { initiale: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Top-Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface-1/80 px-5 py-3 backdrop-blur sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-lg font-extrabold tracking-[-0.02em]">
            Project X
          </span>
        </Link>

        {/* Desktop-Tabs (mittig) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {TABS.map((t) => {
            const aktiv = istAktiv(pathname, t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-sm font-medium transition-colors ${
                  aktiv
                    ? "bg-brand text-black"
                    : "text-text-dim hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>

        {/* Profil-Avatar */}
        <Link
          href="/profil"
          title="Profil"
          className={`flex size-9 items-center justify-center rounded-full font-display text-sm font-extrabold transition-transform hover:scale-105 ${
            istAktiv(pathname, "/profil")
              ? "ring-2 ring-brand"
              : ""
          }`}
          style={{
            background: "linear-gradient(to bottom right, var(--brand), var(--brand-2))",
            color: "#fff",
          }}
        >
          {initiale}
        </Link>
      </header>

      {/* Bottom-Tab-Bar (nur Mobile/iPad) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-surface-1/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {TABS.map((t) => {
          const aktiv = istAktiv(pathname, t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 font-mono text-[9px] transition-colors ${
                aktiv ? "text-brand" : "text-text-mute hover:text-text-dim"
              }`}
            >
              <Icon className="size-5" />
              <span className="leading-none">{t.label.split("-")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
```

- [ ] **Step 2: TypeCheck**

Run: `cd ~/project-x && npx tsc --noEmit 2>&1 | grep -v "npm notice" | head`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
cd ~/project-x && git add components/app-nav.tsx && git commit -m "feat: AppNav-Komponente (Top-Header + Bottom-Tabs, responsive)"
```

---

## Task 3: Route-Group Layout + Seiten-Umzüge

**Files:**
- Create: `app/(app)/layout.tsx`
- Move: `app/dashboard/page.tsx` → `app/(app)/noten/page.tsx`
- Move: `app/settings/page.tsx` → `app/(app)/einstellungen/page.tsx`
- Create: `app/(app)/dashboard/page.tsx` (Hub-Skelett)

- [ ] **Step 1: Layout anlegen (Auth + Onboarding + Nav)**

Create `app/(app)/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("name, onboarding_abgeschlossen")
    .single();

  if (profil && profil.onboarding_abgeschlossen === false) {
    redirect("/onboarding");
  }

  const email = typeof claims.email === "string" ? claims.email : "";
  const initiale =
    (profil?.name?.trim()?.[0] ?? email[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-screen">
      <AppNav initiale={initiale} />
      <div className="pb-24 lg:pb-0">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Notenrechner umziehen → /noten**

```bash
cd ~/project-x && mkdir -p "app/(app)/noten" && git mv app/dashboard/page.tsx "app/(app)/noten/page.tsx"
```

- [ ] **Step 3: Auth/Onboarding-Check + Header aus noten/page.tsx entfernen**

In `app/(app)/noten/page.tsx` wird der Auth-Check (macht jetzt das Layout) entfernt und der bisherige Header (mit Einstellungen-Link + Abmelden) durch einen schlichten Seitentitel ersetzt. Konkret:

Ersetze den Block von `const { data } = await supabase.auth.getClaims();` bis zum schließenden `</header>` durch:
```tsx
  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("aktuelles_halbjahr")
    .single();

  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
```
…und den JSX-Header zu:
```tsx
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          Notenrechner
        </div>
        <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">
          Deine Noten.
        </h1>
        <p className="mt-2 text-sm text-text-dim">Halbjahr {halbjahr}</p>
      </header>
```
Entferne die jetzt ungenutzten Imports `signOut`, `Button`, `Link` und `redirect`, falls sie nur im alten Header/Auth-Check verwendet wurden. (Der Onboarding-Redirect-Block entfällt — macht das Layout.)

- [ ] **Step 4: Einstellungen umziehen → /einstellungen**

```bash
cd ~/project-x && mkdir -p "app/(app)/einstellungen" && git mv app/settings/page.tsx "app/(app)/einstellungen/page.tsx"
```

In `app/(app)/einstellungen/page.tsx`: Auth-Check (`getClaims`/redirect) entfernen (Layout macht's), und den `<Link href="/dashboard">← Zurück zum Dashboard</Link>` entfernen (Nav übernimmt). Import `redirect` entfernen falls ungenutzt. `updatePraeferenzen`-Import-Pfad ist nach Task 1 bereits `@/lib/actions/schule`.

- [ ] **Step 5: Hub-Skelett anlegen**

Create `app/(app)/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          Übersicht
        </div>
        <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">Dein Cockpit.</h1>
      </header>
      <p className="font-mono text-sm text-text-mute">Widgets kommen in Task 4.</p>
    </main>
  );
}
```

- [ ] **Step 6: TypeCheck + Build**

Run: `cd ~/project-x && npx tsc --noEmit && npm run build 2>&1 | grep -E "✓ Compiled|error|Failed|ƒ /|○ /"`
Expected: tsc clean, Build erfolgreich, Routen `/dashboard`, `/noten`, `/einstellungen` vorhanden, kein `/settings` mehr.

- [ ] **Step 7: Commit**

```bash
cd ~/project-x && git add -A && git commit -m "feat: Route-Group (app) mit Nav-Layout, Notenrechner->/noten, Settings->/einstellungen"
```

---

## Task 4: Hub-Widgets

**Files:**
- Modify: `app/(app)/dashboard/page.tsx` (Skelett → echter Hub)

> Lädt serverseitig Profil/Halbjahr, Fächer+Noten (aktuelles HJ), nächste Klausur. Zeigt Gesamtschnitt, nächste Klausur, Schnellzugriff-Karten.

- [ ] **Step 1: Hub implementieren**

Replace `app/(app)/dashboard/page.tsx`:
```tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  assembleFaecher,
  type FachRow,
  type NoteRow,
  type KlausurRow,
} from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { gesamtSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import { Calculator, Sparkles, CalendarDays } from "lucide-react";

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function tageBis(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

const SCHNELLZUGRIFF = [
  { href: "/noten", label: "Notenrechner", icon: Calculator },
  { href: "/was-waere-wenn", label: "Was-wäre-wenn", icon: Sparkles },
  { href: "/stundenplan", label: "Stundenplan", icon: CalendarDays },
];

export default async function DashboardPage() {
  const supabase = await createClient();
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

  const { data: klausurRows } = await supabase
    .from("schule_klausur")
    .select("*")
    .gte("datum", new Date().toISOString())
    .order("datum", { ascending: true })
    .limit(1);

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );
  const gesamt = gesamtSchnittGerundet(faecher);
  const fachName = new Map(faecher.map((f) => [f.id, f.name]));
  const naechste = ((klausurRows ?? []) as KlausurRow[])[0] ?? null;

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          Übersicht · {halbjahr}
        </div>
        <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">Dein Cockpit.</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Gesamtschnitt */}
        <section
          className="lift animate-fade-up relative overflow-hidden rounded-[28px] border-2 p-8"
          style={{
            background: "var(--hero-grad)",
            borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
            animationDelay: "0.05s",
          }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Gesamtschnitt
          </div>
          <div className="mt-3 flex items-end">
            <span
              className="font-display text-[88px] font-extrabold leading-[0.85] tracking-[-0.06em]"
              style={{ color: schnittFarbe(gesamt) }}
            >
              {fmt(gesamt)}
            </span>
            <span className="mb-2 ml-1 text-2xl font-medium text-text-mute">/15</span>
          </div>
          {gesamt !== null && (
            <div className="mt-2 font-mono text-sm text-text-dim">
              Note {punkteZuNote(gesamt)} · {faecher.length} Fächer
            </div>
          )}
        </section>

        {/* Nächste Klausur */}
        <section
          className="lift animate-fade-up rounded-[28px] border border-border p-8"
          style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Nächste Klausur
          </div>
          {naechste ? (
            <div className="mt-3">
              <div className="font-display text-2xl font-extrabold">{naechste.titel}</div>
              <div className="mt-1 font-mono text-sm text-text-dim">
                {naechste.fach_id && fachName.get(naechste.fach_id)
                  ? `${fachName.get(naechste.fach_id)} · `
                  : ""}
                in {tageBis(naechste.datum)} Tagen
              </div>
            </div>
          ) : (
            <p className="mt-3 font-mono text-sm text-text-mute">
              Kein Termin eingetragen.
            </p>
          )}
        </section>
      </div>

      {/* Schnellzugriff */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {SCHNELLZUGRIFF.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="lift animate-fade-up flex items-center gap-3 rounded-3xl border border-border p-5 transition-colors hover:border-brand/40"
              style={{ background: "var(--card-grad)", animationDelay: `${0.15 + i * 0.05}s` }}
            >
              <Icon className="size-5 text-brand" />
              <span className="font-display font-bold">{s.label}</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: TypeCheck + Build**

Run: `cd ~/project-x && npx tsc --noEmit && npm run build 2>&1 | grep -E "✓ Compiled|error|Failed"`
Expected: grün.

- [ ] **Step 3: Commit**

```bash
cd ~/project-x && git add "app/(app)/dashboard/page.tsx" && git commit -m "feat: Hub-Widgets (Gesamtschnitt, nächste Klausur, Schnellzugriff)"
```

---

## Task 5: Profil-Seite + updateProfil

**Files:**
- Modify: `lib/actions/schule.ts` (Action `updateProfil` anhängen)
- Create: `app/(app)/profil/page.tsx`

- [ ] **Step 1: updateProfil-Action anhängen**

Ans Ende von `lib/actions/schule.ts`:
```ts
export async function updateProfil(
  name: string,
  klasse: number | null,
  schule: string,
): Promise<ActionResult> {
  if (klasse !== null && (klasse < 5 || klasse > 13)) {
    return { ok: false, error: "Klasse muss zwischen 5 und 13 liegen." };
  }
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({
        name: name.trim() || null,
        klasse,
        schule: schule.trim() || null,
      })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/profil");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Step 2: Profil-Seite (Server Component lädt + Client-Form)**

Create `app/(app)/profil/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { ProfilForm } from "@/components/profil-form";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("name, klasse, schule")
    .single();

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[600px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          Profil
        </div>
        <h1 className="text-4xl font-extrabold leading-none">Dein Profil.</h1>
      </header>

      <ProfilForm
        initialName={profil?.name ?? ""}
        initialKlasse={profil?.klasse ?? null}
        initialSchule={profil?.schule ?? ""}
      />

      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Account
        </div>
        <p className="mt-2 text-sm text-text-dim">
          Angemeldet als <span className="font-mono text-foreground">{email}</span>
        </p>
        <form action={signOut} className="mt-4">
          <Button variant="outline" className="border-border bg-surface-2 hover:bg-surface-3">
            Abmelden
          </Button>
        </form>
        <p className="mt-4 font-mono text-[11px] text-text-mute">
          Account löschen? Schreib uns — kommt bald als Self-Service.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: ProfilForm (Client)**

Create `components/profil-form.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfil } from "@/lib/actions/schule";

export function ProfilForm({
  initialName,
  initialKlasse,
  initialSchule,
}: {
  initialName: string;
  initialKlasse: number | null;
  initialSchule: string;
}) {
  const [name, setName] = useState(initialName);
  const [klasse, setKlasse] = useState(initialKlasse ? String(initialKlasse) : "");
  const [schule, setSchule] = useState(initialSchule);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function speichern() {
    const klasseNum = klasse === "" ? null : Number(klasse);
    startTransition(async () => {
      const res = await updateProfil(name, klasseNum, schule);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Profil gespeichert.");
        router.refresh();
      }
    });
  }

  return (
    <section
      className="animate-fade-up space-y-4 rounded-3xl border border-border p-6"
      style={{ background: "var(--card-grad)", animationDelay: "0.05s" }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dein Name" className="bg-surface-2" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="klasse">Klasse (5–13)</Label>
        <Input id="klasse" type="number" min={5} max={13} value={klasse} onChange={(e) => setKlasse(e.target.value)} placeholder="z. B. 11" className="bg-surface-2" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="schule">Schule</Label>
        <Input id="schule" value={schule} onChange={(e) => setSchule(e.target.value)} placeholder="Name deiner Schule" className="bg-surface-2" />
      </div>
      <Button onClick={speichern} disabled={pending} className="font-display font-bold">
        Speichern
      </Button>
    </section>
  );
}
```

- [ ] **Step 4: TypeCheck + Build**

Run: `cd ~/project-x && npx tsc --noEmit && npm run build 2>&1 | grep -E "✓ Compiled|error|Failed"`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
cd ~/project-x && git add -A && git commit -m "feat: Profil-Seite + updateProfil (Name, Klasse, Schule)"
```

---

## Task 6: Was-wäre-wenn-Seite

**Files:**
- Create: `app/(app)/was-waere-wenn/page.tsx`
- Create: `components/was-waere-wenn-seite.tsx` (Client: Fach-Auswahl + Panel)

> Lädt serverseitig die Fächer des aktuellen Halbjahres, übergibt sie an eine Client-Komponente mit Fach-Dropdown, die das bestehende `WasWaereWennPanel` für das gewählte Fach rendert.

- [ ] **Step 1: Client-Wrapper anlegen**

Create `components/was-waere-wenn-seite.tsx`:
```tsx
"use client";

import { useState } from "react";
import { WasWaereWennPanel } from "@/components/notenrechner/was-waere-wenn-panel";
import type { Fach } from "@/lib/grades/types";

export function WasWaereWennSeite({ faecher }: { faecher: Fach[] }) {
  const [fachId, setFachId] = useState<string>(faecher[0]?.id ?? "");
  const fach = faecher.find((f) => f.id === fachId) ?? null;

  if (faecher.length === 0) {
    return (
      <p className="font-mono text-sm text-text-mute">
        Noch keine Fächer — leg im Notenrechner erst Fächer &amp; Noten an.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {faecher.map((f) => (
          <button
            key={f.id}
            onClick={() => setFachId(f.id)}
            className={`rounded-lg px-3 py-1.5 font-mono text-sm transition-colors ${
              f.id === fachId
                ? "bg-brand font-semibold text-black"
                : "bg-surface-2 text-text-dim hover:bg-surface-3"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {fach && (
        <section
          className="animate-fade-up rounded-3xl border border-border p-6"
          style={{ background: "var(--card-grad)" }}
        >
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">{fach.name}</h2>
          <WasWaereWennPanel fach={fach} />
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Seite anlegen**

Create `app/(app)/was-waere-wenn/page.tsx`:
```tsx
import { createClient } from "@/lib/supabase/server";
import {
  assembleFaecher,
  type FachRow,
  type NoteRow,
} from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { WasWaereWennSeite } from "@/components/was-waere-wenn-seite";

export default async function WasWaereWennPage() {
  const supabase = await createClient();
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
    <main className="relative z-[5] mx-auto w-full max-w-[760px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          Was-wäre-wenn
        </div>
        <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">Spiel es durch.</h1>
        <p className="mt-2 text-sm text-text-dim">
          Wähl ein Fach, spiel Probe-Noten durch oder rechne dein Ziel aus.
        </p>
      </header>

      <WasWaereWennSeite faecher={faecher} />
    </main>
  );
}
```

- [ ] **Step 3: TypeCheck + Build**

Run: `cd ~/project-x && npx tsc --noEmit && npm run build 2>&1 | grep -E "✓ Compiled|error|Failed"`
Expected: grün.

- [ ] **Step 4: Commit**

```bash
cd ~/project-x && git add -A && git commit -m "feat: Was-wäre-wenn als eigene Seite (Fach-Auswahl + Panel)"
```

---

## Task 7: Stundenplan-Platzhalter + Verifikation

**Files:**
- Create: `app/(app)/stundenplan/page.tsx`

- [ ] **Step 1: Platzhalter-Seite**

Create `app/(app)/stundenplan/page.tsx`:
```tsx
import { CalendarDays } from "lucide-react";

export default function StundenplanPage() {
  return (
    <main className="relative z-[5] mx-auto flex min-h-[60vh] w-full max-w-[600px] flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
      <CalendarDays className="size-12 text-brand" />
      <h1 className="mt-4 font-display text-3xl font-extrabold">Stundenplan kommt bald.</h1>
      <p className="mt-2 max-w-sm text-sm text-text-dim">
        Hier wird bald dein Wochen-Stundenplan stehen — mit Fächern, Zeiten und Räumen.
        Wir bauen ihn als Nächstes.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Volle Verifikation**

Run: `cd ~/project-x && npx tsc --noEmit && npm test && npm run build 2>&1 | grep -E "✓ Compiled|error|Failed|Route|/dashboard|/noten|/profil|/was-waere-wenn|/stundenplan|/einstellungen"`
Expected: tsc clean, 60 Tests grün, Build erfolgreich, alle neuen Routen gelistet.

- [ ] **Step 3: Manueller Smoke-Test** (Nepomuk)

Dev-Server frisch (`lsof -ti:3000 | xargs kill; rm -rf .next; npm run dev`), dann auf `http://localhost:3000`:
1. Einloggen → landet auf `/dashboard` (Hub mit Gesamtschnitt, nächster Klausur, Schnellzugriff).
2. Nav unten (am schmalen Fenster) bzw. oben (breit) — alle 5 Tabs wechseln korrekt, aktiver Tab hervorgehoben.
3. Profil-Avatar oben rechts → `/profil`, Name/Klasse/Schule speichern → Toast, Avatar-Initiale aktualisiert sich.
4. `/noten` = voller Notenrechner wie vorher (Fächer, Klausuren, Halbjahr-Switcher, 🔮).
5. `/was-waere-wenn` = Fach wählen, durchspielen + Zielnote.
6. `/stundenplan` = Platzhalter.
7. `/einstellungen` = Eingabe-Modus umschalten.

- [ ] **Step 4: Commit**

```bash
cd ~/project-x && git add -A && git commit -m "feat: Stundenplan-Platzhalter + Navigation Teil A komplett"
```

---

## Self-Review

**Spec-Abdeckung:** Routing-Umzug (Task 1+3), Nav responsive (Task 2), Layout mit Auth/Onboarding (Task 3), Hub-Widgets (Task 4), Profil (Task 5), Was-wäre-wenn-Seite (Task 6), Stundenplan-Platzhalter (Task 7). ✓

**Bewusst nicht dabei:** echtes Stundenplan-Modul (Teil B), Account-Löschung, Ferien-Countdown.

**Typ-Konsistenz:** `ActionResult` + `requireUserId` ziehen mit nach `lib/actions/schule.ts` (Task 1), `updateProfil` nutzt sie (Task 5). `AppNav`-Prop `initiale` (Task 2) wird vom Layout gesetzt (Task 3). `WasWaereWennPanel` (bestehend) nimmt `fach: Fach` — die neue Seite (Task 6) liefert genau das.

**Risiko-Hinweise für den Umsetzer:**
- Nach Task 1 unbedingt Step 3 (grep) prüfen — ein übersehener Import bricht den Build.
- In Task 3 Step 3/4: aufpassen, dass nach dem Entfernen von Auth-Check/Header keine ungenutzten Imports übrig bleiben (tsc/eslint meckert). Im Zweifel `npx tsc --noEmit` nach jeder Datei.
- `app/(app)/`-Pfade in Shell-Befehlen wegen der Klammern immer quoten (`"app/(app)/..."`).
