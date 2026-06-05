# Onboarding-Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3-Screen Onboarding (Profil → Fächer → Modus+Done) ersetzen das bisherige 2-Screen-Onboarding, damit neue User sofort Name, Klasse und Fächer eingeben und einen befüllten Notenrechner sehen.

**Architecture:** Einzige Client-Component `/app/onboarding/page.tsx` hält allen lokalen State (step, name, klasse, eingabeModus). Fächer werden direkt beim Anlegen via Server Action in die DB geschrieben. `completeOnboarding` speichert am Ende name+klasse+eingabe_modus in einem Call.

**Tech Stack:** Next.js 16 App Router, React `useTransition`, Supabase Server Actions, Tailwind CSS v4, Sonner (toast), TypeScript strict

---

## File Map

| Datei | Aktion | Was ändert sich |
|---|---|---|
| `lib/actions/schule.ts` | Modify | `addFach` bekommt optionalen `niveau`-Param; `completeOnboarding` bekommt `name` + `klasse` Params |
| `app/onboarding/page.tsx` | Rewrite | 3-Screen-Flow statt 2-Screen |

---

## Task 1: Server Actions erweitern

**Files:**
- Modify: `lib/actions/schule.ts:19-40` (`addFach`)
- Modify: `lib/actions/schule.ts:200-216` (`completeOnboarding`)

- [ ] **Schritt 1.1: `addFach` um optionalen `niveau`-Param erweitern**

Ersetze die Signatur und das insert-Objekt:

```ts
export async function addFach(
  name: string,
  halbjahr: string,
  niveau: "GK" | "LK" = "GK",
): Promise<AddFachResult> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Bitte einen Fachnamen eingeben." };
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("schule_fach")
      .insert({ user_id: userId, name: trimmed, halbjahr, niveau })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    revalidatePath("/noten");
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Schritt 1.2: `completeOnboarding` um `name` und `klasse` erweitern**

Ersetze die komplette Funktion:

```ts
export async function completeOnboarding(
  name: string,
  klasse: number,
  eingabeModus: "punkte" | "note",
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({
        name: name.trim(),
        klasse,
        eingabe_modus: eingabeModus,
        onboarding_abgeschlossen: true,
      })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

- [ ] **Schritt 1.3: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Erwartetes Ergebnis: Kein Fehler. Falls Fehler wegen `completeOnboarding`-Aufruf im alten Onboarding → wird in Task 2 behoben (die Datei wird komplett ersetzt).

- [ ] **Schritt 1.4: Commit**

```bash
git add lib/actions/schule.ts
git commit -m "feat: addFach + completeOnboarding um niveau/name/klasse erweitern"
```

---

## Task 2: Onboarding Page — komplettes Rewrite

**Files:**
- Rewrite: `app/onboarding/page.tsx`

- [ ] **Schritt 2.1: Datei komplett ersetzen**

Ersetze `app/onboarding/page.tsx` mit folgendem Inhalt:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeOnboarding, addFach } from "@/lib/actions/schule";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";

type Modus = "punkte" | "note";
type Niveau = "GK" | "LK";

interface FachEintrag {
  id: string;
  name: string;
  niveau: Niveau;
}

const VORSCHLAG_FAECHER = [
  "Mathe", "Deutsch", "Englisch", "Physik", "Geschichte",
  "Biologie", "Chemie", "Sport", "Musik", "Informatik",
  "Latein", "Französisch", "Spanisch",
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [klasse, setKlasse] = useState<11 | 12 | 13 | null>(null);
  const [eingabeModus, setEingabeModus] = useState<Modus>("punkte");
  const [faecher, setFaecher] = useState<FachEintrag[]>([]);
  const [freitextName, setFreitextName] = useState("");
  const [freitextNiveau, setFreitextNiveau] = useState<Niveau>("GK");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const halbjahr = aktuellesHalbjahr();

  function istVorschlagAusgewaehlt(vorschlag: string) {
    return faecher.some((f) => f.name === vorschlag);
  }

  function toggleVorschlag(vorschlag: string) {
    if (istVorschlagAusgewaehlt(vorschlag)) {
      const fach = faecher.find((f) => f.name === vorschlag);
      if (fach) removeFach(fach.id);
    } else {
      fachHinzufuegen(vorschlag, "GK");
    }
  }

  function fachHinzufuegen(fachName: string, niveau: Niveau) {
    const trimmed = fachName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await addFach(trimmed, halbjahr, niveau);
      if (!res.ok) {
        toast.error(`Fehler: ${res.error}`);
        return;
      }
      setFaecher((prev) => [
        ...prev,
        { id: res.id, name: trimmed, niveau },
      ]);
    });
  }

  function removeFach(id: string) {
    setFaecher((prev) => prev.filter((f) => f.id !== id));
    // Fach bleibt in DB — User kann es später in /noten löschen.
    // Beim Onboarding-Abbruch werden halb angelegte Fächer beim nächsten Login bereinigt
    // (onboarding_abgeschlossen bleibt false → redirect back to /onboarding).
  }

  function freitextHinzufuegen() {
    if (!freitextName.trim()) return;
    fachHinzufuegen(freitextName, freitextNiveau);
    setFreitextName("");
    setFreitextNiveau("GK");
  }

  function finish() {
    if (!klasse) return;
    startTransition(async () => {
      const res = await completeOnboarding(name, klasse, eingabeModus);
      if (!res.ok) {
        toast.error(`Fehler: ${res.error}`);
        return;
      }
      router.push("/dashboard");
    });
  }

  const progress = [1, 2, 3];

  return (
    <main className="relative z-[5] flex min-h-screen flex-col items-center justify-center px-5 py-12">
      {/* Progress */}
      <div className="mb-10 flex gap-2">
        {progress.map((s) => (
          <div
            key={s}
            className={`h-1 w-8 rounded-full transition-colors ${
              step >= s ? "bg-brand" : "bg-surface-3"
            }`}
          />
        ))}
      </div>

      {/* ── Screen 1: Profil ─────────────────────────────── */}
      {step === 1 && (
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Schritt 1 von 3
          </div>
          <h1 className="text-center font-display text-4xl font-extrabold leading-tight">
            Wie heißt du?
          </h1>
          <p className="mt-3 text-center text-sm text-text-dim">
            Damit die App dich persönlich anspricht.
          </p>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vorname"
            className="mt-8 w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-base outline-none transition-colors focus:border-brand focus:bg-surface-3"
            autoFocus
          />

          <div className="mt-6">
            <p className="mb-3 text-sm text-text-dim">In welcher Klasse bist du?</p>
            <div className="flex gap-3">
              {([11, 12, 13] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKlasse(k)}
                  className={`flex-1 rounded-2xl border py-4 font-display text-xl font-extrabold transition-all ${
                    klasse === k
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!name.trim() || klasse === null}
            className="mt-8 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Weiter →
          </button>
        </div>
      )}

      {/* ── Screen 2: Fächer ─────────────────────────────── */}
      {step === 2 && (
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Schritt 2 von 3
          </div>
          <h1 className="text-center font-display text-4xl font-extrabold leading-tight">
            Deine Fächer
          </h1>
          <p className="mt-3 text-center text-sm text-text-dim">
            Schnell antippen oder eigene hinzufügen.
          </p>

          {/* Vorschlag-Chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {VORSCHLAG_FAECHER.map((fach) => (
              <button
                key={fach}
                onClick={() => toggleVorschlag(fach)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-all ${
                  istVorschlagAusgewaehlt(fach)
                    ? "border-brand bg-brand text-black"
                    : "border-border bg-surface-2 text-brand hover:bg-surface-3"
                }`}
              >
                {istVorschlagAusgewaehlt(fach) ? fach + " ✕" : "+ " + fach}
              </button>
            ))}
          </div>

          {/* Freitext */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={freitextName}
              onChange={(e) => setFreitextName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && freitextHinzufuegen()}
              placeholder="Eigenes Fach…"
              className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <select
              value={freitextNiveau}
              onChange={(e) => setFreitextNiveau(e.target.value as Niveau)}
              className="rounded-xl border border-border bg-surface-2 px-2 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="GK">GK</option>
              <option value="LK">LK</option>
            </select>
            <button
              onClick={freitextHinzufuegen}
              className="rounded-xl bg-brand px-3 py-2 text-sm font-bold text-black"
            >
              +
            </button>
          </div>

          {/* Angelegte Fächer (nur eigene + Chips mit LK-Toggle) */}
          {faecher.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {faecher.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2"
                >
                  <span className="text-sm">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setFaecher((prev) =>
                          prev.map((x) =>
                            x.id === f.id
                              ? { ...x, niveau: x.niveau === "GK" ? "LK" : "GK" }
                              : x,
                          ),
                        )
                      }
                      className={`rounded px-2 py-0.5 text-xs font-bold transition-colors ${
                        f.niveau === "LK"
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-surface-3 text-text-mute"
                      }`}
                    >
                      {f.niveau}
                    </button>
                    <button
                      onClick={() => removeFach(f.id)}
                      className="text-xs text-text-mute hover:text-text-dim"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setStep(3)}
            className="mt-6 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90"
          >
            Weiter →
          </button>
          <button
            onClick={() => setStep(3)}
            className="mt-3 w-full font-mono text-sm text-text-mute hover:text-text-dim"
          >
            Überspringen
          </button>
        </div>
      )}

      {/* ── Screen 3: Modus + Done ───────────────────────── */}
      {step === 3 && (
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-2 text-center font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Schritt 3 von 3
          </div>
          <h1 className="text-center font-display text-4xl font-extrabold leading-tight">
            Wie gibst du Noten ein?
          </h1>
          <p className="mt-3 text-center text-sm text-text-dim">
            Jederzeit in den Einstellungen änderbar.
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

          {/* Mini-Summary */}
          <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[.15em] text-text-mute">
              Zusammenfassung
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-text-mute">Name: </span>
                <span className="font-semibold">{name}</span>
              </div>
              <div>
                <span className="text-text-mute">Klasse: </span>
                <span className="font-semibold">{klasse}</span>
              </div>
              <div>
                <span className="text-text-mute">Fächer: </span>
                <span className="font-semibold">
                  {faecher.length > 0
                    ? faecher.map((f) => `${f.name} (${f.niveau})`).join(", ")
                    : "Keine"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={finish}
            className="mt-6 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90"
          >
            Los geht&apos;s →
          </button>
          <button
            onClick={() => setStep(2)}
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

- [ ] **Schritt 2.2: TypeScript-Check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Erwartetes Ergebnis: Keine Fehler.

- [ ] **Schritt 2.3: Build-Check**

```bash
npx next build 2>&1 | tail -20
```

Erwartetes Ergebnis: `✓ Compiled successfully` — kein Build-Fehler.

- [ ] **Schritt 2.4: Commit**

```bash
git add app/onboarding/page.tsx
git commit -m "feat: Onboarding-Flow — 3-Screen (Profil + Fächer + Modus)"
```

---

## Task 3: Manuelle Verifikation

Starte Dev-Server (`npm run dev`) und teste folgende Szenarien:

- [ ] **Happy Path — alles ausgefüllt**
  1. Als neuer User einloggen (oder `onboarding_abgeschlossen = false` in Supabase setzen)
  2. Screen 1: Vorname eingeben + Klasse wählen → Weiter-Button wird aktiv
  3. Screen 2: 2-3 Chips antippen → erscheinen in der Liste mit GK-Badge → LK-Toggle klicken → Badge wechselt
  4. Screen 2: Eigenes Fach eintippen + LK wählen + `+` → erscheint in Liste
  5. Screen 3: Eingabe-Modus wählen → Summary zeigt Name, Klasse, Fächer korrekt
  6. "Los geht's" → Redirect zu `/dashboard` → Begrüßung zeigt eingegebenen Namen
  7. In Supabase prüfen: `nutzer_profil.name`, `.klasse`, `.eingabe_modus`, `.onboarding_abgeschlossen = true` gesetzt
  8. In Supabase prüfen: `schule_fach` enthält angelegte Fächer mit korrektem `niveau`

- [ ] **Skip-Path — Fächer überspringen**
  1. Screen 2: direkt "Überspringen" klicken
  2. Screen 3: Summary zeigt "Fächer: Keine"
  3. "Los geht's" → Dashboard öffnet sich ohne Fehler

- [ ] **Validierung Screen 1**
  1. Weiter-Button disabled wenn Name leer
  2. Weiter-Button disabled wenn keine Klasse gewählt
  3. Weiter-Button aktiv wenn beides gesetzt

- [ ] **Kein doppeltes Onboarding**
  1. Nach erfolgreichem Abschluss: Logout → erneuter Login → direkt auf `/dashboard` (kein `/onboarding`)
