"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fachSchnittGerundet,
  gesamtSchnittGerundet,
  punkteZuNote,
} from "@/lib/grades/calc";
import type { Fach, Kategorie } from "@/lib/grades/types";

let idCounter = 1000;
const nextId = () => `n${idCounter++}`;

const START_FAECHER: Fach[] = [
  {
    id: "ma",
    name: "Mathe",
    noten: [
      { id: nextId(), punkte: 11, kategorie: "klausur" },
      { id: nextId(), punkte: 10, kategorie: "klausur" },
      { id: nextId(), punkte: 12, kategorie: "muendlich" },
    ],
  },
  {
    id: "de",
    name: "Deutsch",
    noten: [
      { id: nextId(), punkte: 9, kategorie: "klausur" },
      { id: nextId(), punkte: 11, kategorie: "muendlich" },
    ],
  },
  {
    id: "bio",
    name: "Bio",
    noten: [{ id: nextId(), punkte: 13, kategorie: "muendlich" }],
  },
];

const KAT_LABEL: Record<Kategorie, string> = {
  klausur: "Klausur",
  muendlich: "Mündlich",
  sonstige: "Sonstige",
  test: "Test",
  referat: "Referat",
  hausaufgabe: "Hausaufgabe",
};

function fmt(n: number | null): string {
  if (n === null) return "–";
  return n.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default function NotenrechnerDemo() {
  const [faecher, setFaecher] = useState<Fach[]>(START_FAECHER);

  const gesamt = useMemo(() => gesamtSchnittGerundet(faecher), [faecher]);

  function addNote(fachId: string, punkte: number, kategorie: Kategorie) {
    setFaecher((prev) =>
      prev.map((f) =>
        f.id === fachId
          ? {
              ...f,
              noten: [...f.noten, { id: nextId(), punkte, kategorie }],
            }
          : f,
      ),
    );
  }

  function removeNote(fachId: string, noteId: string) {
    setFaecher((prev) =>
      prev.map((f) =>
        f.id === fachId
          ? { ...f, noten: f.noten.filter((n) => n.id !== noteId) }
          : f,
      ),
    );
  }

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[900px] px-5 py-10 sm:px-8">
      {/* Header */}
      <header className="animate-fade-up mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            <span className="inline-block size-1.5 rounded-full bg-brand" />
            Live-Demo · ohne Anmeldung
          </div>
          <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">
            Notenrechner.
          </h1>
          <p className="mt-2 text-sm text-text-dim">
            0–15-Punkte-System. Noten ändern und der Schnitt rechnet sich live.
          </p>
        </div>
        <Button
          render={<Link href="/" />}
          variant="outline"
          className="border-border bg-surface-2 hover:bg-surface-3"
        >
          Zurück
        </Button>
      </header>

      {/* Hero: Gesamtschnitt */}
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
          style={{
            background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)",
          }}
        />
        <div className="relative z-[2]">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Gesamtschnitt
          </div>
          <div className="mt-3 flex items-end">
            <span
              className="font-display text-[110px] font-extrabold leading-[0.85] tracking-[-0.06em]"
              style={{
                background: "var(--num-grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {fmt(gesamt)}
            </span>
            <span className="mb-3 ml-1 text-3xl font-medium text-text-mute">
              /15
            </span>
          </div>
          {gesamt !== null && (
            <div className="mt-2 font-mono text-sm text-text-dim">
              Note {punkteZuNote(gesamt)} · {faecher.length} Fächer
            </div>
          )}
        </div>
      </section>

      {/* Fächer */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {faecher.map((fach, i) => {
          const schnitt = fachSchnittGerundet(fach.noten);
          return (
            <section
              key={fach.id}
              className="lift animate-fade-up rounded-3xl border border-border p-6"
              style={{
                background: "var(--card-grad)",
                animationDelay: `${0.1 + i * 0.07}s`,
              }}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">
                  {fach.name}
                </h2>
                <div className="text-right">
                  <span className="font-display text-2xl font-extrabold text-brand">
                    {fmt(schnitt)}
                  </span>
                  {schnitt !== null && (
                    <span className="ml-1.5 font-mono text-xs text-text-dim">
                      {punkteZuNote(schnitt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Noten-Pills */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {fach.noten.length === 0 && (
                  <span className="font-mono text-xs text-text-mute">
                    Noch keine Noten
                  </span>
                )}
                {fach.noten.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => removeNote(fach.id, n.id!)}
                    title={`${KAT_LABEL[n.kategorie]} — klick zum Löschen`}
                    className="group inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs transition-colors hover:border-destructive/40 hover:bg-destructive/10"
                  >
                    <span className="font-semibold">{n.punkte}</span>
                    <span className="text-text-mute">
                      {n.kategorie === "klausur" ? "K" : n.kategorie === "muendlich" ? "M" : "S"}
                    </span>
                    <span className="text-text-mute group-hover:text-destructive">
                      ×
                    </span>
                  </button>
                ))}
              </div>

              <AddNote onAdd={(p, k) => addNote(fach.id, p, k)} />
            </section>
          );
        })}
      </div>

      <p className="animate-fade-up mt-8 text-center font-mono text-xs text-text-mute">
        Entwurf · Pills anklicken zum Löschen · Standard-Gewichtung 50 % Klausur / 50 % mündlich
      </p>
    </main>
  );
}

function AddNote({
  onAdd,
}: {
  onAdd: (punkte: number, kategorie: Kategorie) => void;
}) {
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
        type="number"
        min={0}
        max={15}
        value={punkte}
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
      <Button onClick={submit} size="sm" className="ml-auto font-display font-bold">
        + Note
      </Button>
    </div>
  );
}
