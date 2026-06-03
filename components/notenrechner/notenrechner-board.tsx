"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FachCard } from "./fach-card";
import { addFach, removeNote, addNote } from "@/app/dashboard/actions";

/** Temp-IDs beginnen immer mit "temp-" — echte UUIDs nie. */
const isTempId = (id: string) => id.startsWith("temp-");
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
      } else {
        // Temp-ID durch echte DB-UUID ersetzen, damit spätere addNote-Calls
        // eine valide fach_id schicken.
        setFaecher((prev) =>
          prev.map((f) => (f.id === optimistic.id ? { ...f, id: res.id } : f)),
        );
      }
    });
  }

  function handleAddNote(fachId: string, punkte: number, kategorie: Kategorie) {
    // Fach wird noch gespeichert — noch keine echte UUID vorhanden.
    if (isTempId(fachId)) {
      toast.error("Fach wird noch gespeichert — bitte einen Moment warten.");
      return;
    }
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
