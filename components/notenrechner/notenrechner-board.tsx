"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FachCard } from "./fach-card";
import { FachDialog } from "./fach-dialog";
import { HalbjahrSwitcher } from "./halbjahr-switcher";
import { JahresTabelle } from "./jahres-tabelle";
import { addFach, removeNote, addNote, updateNote } from "@/lib/actions/schule";
import { gesamtSchnittGerundet } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import { useNotensystem } from "@/components/notensystem-provider";
import type { Fach, Kategorie } from "@/lib/grades/types";
import { assembleKlausuren, type KlausurRow } from "@/lib/grades/db";
import type { JahresUebersicht } from "@/lib/grades/jahr";
import { WasWaereWennSeite } from "@/components/was-waere-wenn-seite";

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
  const klausuren = initialKlausuren;
  const [neuesFach, setNeuesFach] = useState("");
  const [dialogFachId, setDialogFachId] = useState<string | null>(null);
  const [ansicht, setAnsicht] = useState<"halbjahr" | "jahr" | "whatif">("halbjahr");
  const [, startTransition] = useTransition();
  const system = useNotensystem();

  const aktiveFaecher = faecher.filter((f) => !f.ausgeschlossen);
  const ausgeschlossenCount = faecher.length - aktiveFaecher.length;
  // gesamtSchnitt berücksichtigt Unterfächer intern (überspringt parentFachId-Fächer)
  const gesamt = gesamtSchnittGerundet(faecher, system);
  const gesamtFarbe = schnittFarbe(gesamt, system);
  const dialogFach = faecher.find((f) => f.id === dialogFachId) ?? null;

  const klausurByFach = assembleKlausuren(klausuren);

  // Unterfach-Map: parentId → [Unterfächer]
  const unterfachMap = new Map<string, typeof faecher>();
  for (const f of faecher) {
    if (f.parentFachId) {
      const list = unterfachMap.get(f.parentFachId) ?? [];
      list.push(f);
      unterfachMap.set(f.parentFachId, list);
    }
  }

  // Nur Top-Level-Fächer im Grid — Unterfächer sind im Elternfach-Card sichtbar
  const faecherGeordnet: typeof faecher = [];
  for (const f of faecher) {
    if (f.parentFachId) continue;
    faecherGeordnet.push(f);
  }
  // Verwaiste Unterfächer (Elternteil gelöscht) am Ende anhängen
  for (const f of faecher) {
    if (f.parentFachId && !faecher.some((p) => p.id === f.parentFachId)) {
      faecherGeordnet.push(f);
    }
  }

  // Zähle nur Top-Level-Fächer (keine Unterfächer) für die Anzeige
  const topLevelAktivCount = aktiveFaecher.filter((f) => !f.parentFachId).length;

  // Fächer da, aber noch keine einzige Note → Hint in jeder FachCard
  const alleOhneNoten = faecher.length > 0 && faecher.every((f) => f.noten.length === 0);

  function handleAddFach() {
    const name = neuesFach.trim();
    if (!name) return;
    if (faecher.some((f) => f.name.trim().toLowerCase() === name.toLowerCase())) {
      toast.error(`"${name}" gibt es in diesem Halbjahr schon.`);
      return;
    }
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
      } else {
        setFaecher((prev) =>
          prev.map((f) =>
            f.id === fachId
              ? { ...f, noten: f.noten.map((n) => n.id === optId ? { ...n, id: res.id } : n) }
              : f,
          ),
        );
      }
    });
  }

  function handleRemoveNote(fachId: string, noteId: string) {
    if (isTempId(noteId)) {
      toast.error("Note wird noch gespeichert — bitte einen Moment warten.");
      return;
    }
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

  function handleUpdateNote(
    fachId: string,
    noteId: string,
    punkte: number,
    kategorie: Kategorie,
    bezeichnung?: string,
    gewicht?: number,
  ) {
    if (isTempId(noteId)) {
      toast.error("Note wird noch gespeichert — bitte einen Moment warten.");
      return;
    }
    const snapshot = faecher;
    setFaecher((prev) =>
      prev.map((f) =>
        f.id === fachId
          ? {
              ...f,
              noten: f.noten.map((n) =>
                n.id === noteId ? { ...n, punkte, kategorie, bezeichnung, gewicht } : n,
              ),
            }
          : f,
      ),
    );
    startTransition(async () => {
      const res = await updateNote(noteId, punkte, kategorie, bezeichnung, gewicht);
      if (!res.ok) {
        setFaecher(snapshot);
        toast.error(`Note konnte nicht bearbeitet werden: ${res.error}`);
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
      <div className="animate-fade-up mb-6 flex gap-1 rounded-2xl border border-border bg-surface-2 p-1.5">
        {([
          ["halbjahr", "Halbjahr"],
          ["jahr", "Ganzes Jahr"],
          ["whatif", "What-If"],
        ] as const).map(([wert, label]) => (
          <button
            key={wert}
            onClick={() => setAnsicht(wert)}
            className={`flex-1 rounded-xl px-5 py-2.5 font-display text-sm font-bold transition-colors ${
              ansicht === wert
                ? "bg-brand text-black shadow-sm"
                : "text-text-dim hover:bg-surface-3"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {ansicht === "jahr" ? (
        <JahresTabelle uebersicht={jahresUebersicht} schuljahr={schuljahr} />
      ) : ansicht === "whatif" ? (
        <WasWaereWennSeite faecher={faecher} />
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
              className="font-display text-[72px] font-extrabold leading-[0.85] tracking-[-0.06em] sm:text-[110px]"
              style={{ color: gesamtFarbe }}
            >
              {gesamt === null ? "–" : system.formatSchnitt(gesamt)}
            </span>
            {system.id === "de_0_15" && (
              <span className="mb-3 ml-1 text-3xl font-medium text-text-mute">/15</span>
            )}
          </div>
          {gesamt !== null && (
            <div className="mt-2 font-mono text-sm text-text-dim">
              Schnitt {system.formatSchnitt(gesamt)} · {topLevelAktivCount} Fächer
              {ausgeschlossenCount > 0 && (
                <span className="ml-2 text-text-mute">
                  ({ausgeschlossenCount} ausgeschlossen)
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Fächer-Grid */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {faecherGeordnet.map((fach, i) => (
          <FachCard
            key={fach.id}
            fach={fach}
            index={i}
            naechsteKlausur={klausurByFach.get(fach.id) ?? null}
            vorherSchnitt={vorherSchnitte[fach.name] ?? null}
            ersteNoteHint={alleOhneNoten}
            unterfaecher={unterfachMap.get(fach.id)}
            elternfachName={fach.parentFachId ? (faecher.find((p) => p.id === fach.parentFachId)?.name ?? null) : null}
            onAddNote={handleAddNote}
            onRemoveNote={handleRemoveNote}
            onUpdateNote={handleUpdateNote}
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
          alleFaecher={faecher}
        />
      )}
        </>
      )}
    </>
  );
}
