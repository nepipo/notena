"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fachSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import type { Fach, Kategorie } from "@/lib/grades/types";

const KAT_KUERZEL: Record<Kategorie, string> = {
  klausur: "K", muendlich: "M", sonstige: "S",
  test: "T", referat: "R", hausaufgabe: "H",
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
