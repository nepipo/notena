"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FachCard } from "./fach-card";
import { FachDialog } from "./fach-dialog";
import { HalbjahrSwitcher } from "./halbjahr-switcher";
import { KlausurSection } from "./klausur-section";
import { JahresTabelle } from "./jahres-tabelle";
import { addFach, removeNote, addNote } from "@/app/dashboard/actions";
import { gesamtSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import type { Fach, Kategorie } from "@/lib/grades/types";
import { assembleKlausuren, type KlausurRow } from "@/lib/grades/db";
import type { JahresUebersicht } from "@/lib/grades/jahr";

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
  verfuegbareHalbjahre,
  vorherSchnitte,
  jahresUebersicht,
  schuljahr,
}: {
  initialFaecher: Fach[];
  halbjahr: string;
  initialKlausuren: KlausurRow[];
  verfuegbareHalbjahre: string[];
  vorherSchnitte: Record<string, number>;
  jahresUebersicht: JahresUebersicht;
  schuljahr: string;
}) {
  const [faecher, setFaecher] = useState<Fach[]>(initialFaecher);
  const [klausuren] = useState<KlausurRow[]>(initialKlausuren);
  const [neuesFach, setNeuesFach] = useState("");
  const [dialogFachId, setDialogFachId] = useState<string | null>(null);
  const [ansicht, setAnsicht] = useState<"halbjahr" | "jahr">("halbjahr");
  const [, startTransition] = useTransition();

  const gesamt = gesamtSchnittGerundet(faecher);
  const gesamtFarbe = schnittFarbe(gesamt);
  const dialogFach = faecher.find((f) => f.id === dialogFachId) ?? null;

  const klausurByFach = assembleKlausuren(klausuren);

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
          ? {
              ...f,
              noten: [...f.noten, { id: optId, punkte, kategorie, bezeichnung, gewicht }],
            }
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
      {/* Ansicht-Tabs */}
      <div className="animate-fade-up mb-4 inline-flex gap-1 rounded-xl border border-border bg-surface-2 p-1">
        {([
          ["halbjahr", "Halbjahr"],
          ["jahr", "Ganzes Jahr"],
        ] as const).map(([wert, label]) => (
          <button
            key={wert}
            onClick={() => setAnsicht(wert)}
            className={`rounded-lg px-4 py-1.5 font-sans text-sm font-semibold transition-colors ${
              ansicht === wert
                ? "bg-brand text-black"
                : "text-text-dim hover:bg-surface-3"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {ansicht === "jahr" ? (
        <JahresTabelle uebersicht={jahresUebersicht} schuljahr={schuljahr} />
      ) : (
        <>
      {/* Halbjahr-Switcher */}
      <div className="animate-fade-up mb-4">
        <HalbjahrSwitcher
          verfuegbareHalbjahre={verfuegbareHalbjahre}
          aktuellesHj={halbjahr}
          aktuelleFaecher={faecher}
        />
      </div>

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
              style={{ color: gesamtFarbe }}
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
            vorherSchnitt={vorherSchnitte[fach.name] ?? null}
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

      {/* Klausuren & Termine */}
      <KlausurSection faecher={faecher} klausuren={klausuren} />

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
      )}
    </>
  );
}
