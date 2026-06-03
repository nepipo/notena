"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fachSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import type { Fach, Kategorie } from "@/lib/grades/types";

const KAT_KUERZEL: Record<Kategorie, string> = {
  klausur: "K", muendlich: "M", test: "T",
  referat: "R", hausaufgabe: "H", sonstige: "S",
};
const KAT_LABEL: Record<Kategorie, string> = {
  klausur: "Klausur", muendlich: "Mündlich", test: "Test",
  referat: "Referat", hausaufgabe: "Hausaufgabe", sonstige: "Sonstige",
};

const ALLE_KATEGORIEN: Kategorie[] = [
  "klausur", "test", "muendlich", "referat", "hausaufgabe", "sonstige",
];

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  });
}

function tageBis(datumIso: string): number {
  const diff = new Date(datumIso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function FachCard({
  fach,
  index,
  naechsteKlausur,
  onAddNote,
  onRemoveNote,
  onOpenDialog,
}: {
  fach: Fach;
  index: number;
  naechsteKlausur?: { id: string; titel: string; datum: string } | null;
  onAddNote: (
    fachId: string,
    punkte: number,
    kategorie: Kategorie,
    bezeichnung?: string,
    gewicht?: number,
  ) => void;
  onRemoveNote: (fachId: string, noteId: string) => void;
  onOpenDialog: (fachId: string) => void;
}) {
  const schnitt = fachSchnittGerundet(fach.noten, fach.gewichtung);
  const farbe = schnittFarbe(schnitt);
  const tage = naechsteKlausur ? tageBis(naechsteKlausur.datum) : null;

  return (
    <section
      className="lift animate-fade-up rounded-3xl border border-border p-6"
      style={{
        background: "var(--card-grad)",
        animationDelay: `${0.1 + index * 0.07}s`,
        borderLeftColor: fach.farbe ?? undefined,
        borderLeftWidth: fach.farbe ? "3px" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {fach.farbe && (
            <span
              className="mt-0.5 inline-block size-2.5 shrink-0 rounded-full"
              style={{ background: fach.farbe }}
            />
          )}
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">
            {fach.name}
          </h2>
          {fach.niveau && (
            <span
              className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[.1em] ${
                fach.niveau === "erhoeht"
                  ? "bg-brand/15 text-brand"
                  : "bg-surface-3 text-text-dim"
              }`}
            >
              {fach.niveau === "erhoeht" ? "LK" : "GK"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span
              className="font-display text-2xl font-extrabold"
              style={{ color: farbe }}
            >
              {fmt(schnitt)}
            </span>
            {schnitt !== null && (
              <span className="ml-1.5 font-mono text-xs text-text-dim">
                {punkteZuNote(schnitt)}
              </span>
            )}
          </div>
          <button
            onClick={() => onOpenDialog(fach.id)}
            title="Fach konfigurieren"
            className="ml-1 text-text-mute transition-colors hover:text-foreground"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Countdown-Badge */}
      {tage !== null && tage >= 0 && tage <= 14 && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-[11px] text-destructive">
          <span>⏰</span>
          <span>
            {tage === 0
              ? "Klausur heute!"
              : tage === 1
              ? "Klausur morgen"
              : `Klausur in ${tage} Tagen`}
          </span>
        </div>
      )}

      {/* Noten-Pills */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {fach.noten.length === 0 && (
          <span className="font-mono text-xs text-text-mute">Noch keine Noten</span>
        )}
        {fach.noten.map((n) => (
          <button
            key={n.id}
            onClick={() => onRemoveNote(fach.id, n.id!)}
            title={`${n.bezeichnung ?? KAT_LABEL[n.kategorie]}${n.gewicht && n.gewicht !== 1 ? ` (×${n.gewicht})` : ""} — klick zum Löschen`}
            className="group inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs transition-colors hover:border-destructive/40 hover:bg-destructive/10"
          >
            <span className="font-semibold">{n.punkte}</span>
            <span className="text-text-mute">{KAT_KUERZEL[n.kategorie]}</span>
            {n.bezeichnung && (
              <span className="text-text-mute">·{n.bezeichnung.slice(0, 8)}</span>
            )}
            <span className="text-text-mute group-hover:text-destructive">×</span>
          </button>
        ))}
      </div>

      <AddNote onAdd={(p, k, bez, gew) => onAddNote(fach.id, p, k, bez, gew)} />
    </section>
  );
}

function AddNote({
  onAdd,
}: {
  onAdd: (
    punkte: number,
    kategorie: Kategorie,
    bezeichnung?: string,
    gewicht?: number,
  ) => void;
}) {
  const [punkte, setPunkte] = useState("");
  const [kategorie, setKategorie] = useState<Kategorie>("klausur");
  const [bezeichnung, setBezeichnung] = useState("");
  const [gewicht, setGewicht] = useState("1");
  const [erweitert, setErweitert] = useState(false);

  function submit() {
    const p = Number(punkte);
    if (Number.isNaN(p) || punkte === "") return;
    const g = Number(gewicht);
    onAdd(
      Math.min(15, Math.max(0, p)),
      kategorie,
      bezeichnung.trim() || undefined,
      Number.isFinite(g) && g > 0 ? g : 1,
    );
    setPunkte("");
    setBezeichnung("");
    setGewicht("1");
  }

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      {/* Kategorie-Chips */}
      <div className="flex flex-wrap gap-1">
        {ALLE_KATEGORIEN.map((k) => (
          <button
            key={k}
            onClick={() => setKategorie(k)}
            className={`rounded-lg px-2 py-1 font-mono text-[11px] transition-colors ${
              kategorie === k
                ? "bg-brand font-semibold text-black"
                : "bg-surface-2 text-text-dim hover:bg-surface-3"
            }`}
          >
            {KAT_LABEL[k]}
          </button>
        ))}
      </div>

      {/* Eingabe-Zeile */}
      <div className="flex items-center gap-2">
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
        <button
          onClick={() => setErweitert(!erweitert)}
          className="font-mono text-[11px] text-text-mute hover:text-text-dim"
        >
          {erweitert ? "weniger ▲" : "mehr ▼"}
        </button>
        <Button onClick={submit} size="sm" className="ml-auto font-display font-bold">
          + Note
        </Button>
      </div>

      {/* Erweiterte Felder */}
      {erweitert && (
        <div className="flex gap-2">
          <Input
            value={bezeichnung}
            onChange={(e) => setBezeichnung(e.target.value)}
            placeholder="Bezeichnung (z. B. 1. Klausur)"
            className="h-8 flex-1 bg-surface-2 font-mono text-xs"
          />
          <Input
            type="number"
            min={0.1}
            step={0.5}
            value={gewicht}
            onChange={(e) => setGewicht(e.target.value)}
            placeholder="Gewicht"
            title="Gewicht (Standard = 1)"
            className="h-8 w-20 bg-surface-2 font-mono text-xs"
          />
        </div>
      )}
    </div>
  );
}
