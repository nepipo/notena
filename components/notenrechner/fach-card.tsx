"use client";

import { useState } from "react";
import { TrendingUp, Sparkles, Settings2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fachSchnittGerundet,
  kategorieZurGruppe,
} from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import { useNotensystem } from "@/components/notensystem-provider";
import { WasWaereWennPanel } from "./was-waere-wenn-panel";
import type { Fach, Kategorie, Note } from "@/lib/grades/types";

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
  const [y, m, d] = datumIso.slice(0, 10).split("-").map(Number);
  const ziel = new Date(y, m - 1, d);
  const heute = new Date();
  const heut = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.round((ziel.getTime() - heut.getTime()) / 86400000);
}

function gruppenSchnitt(noten: Note[]): number | null {
  if (noten.length === 0) return null;
  let summe = 0;
  let gew = 0;
  for (const n of noten) {
    const g = n.gewicht ?? 1;
    summe += n.punkte * g;
    gew += g;
  }
  return gew > 0 ? summe / gew : null;
}

// ── Klausur vs. Mündlich Aufschlüsselung ─────────────────────────────────────
function KategorienSplit({ noten }: { noten: Note[] }) {
  const system = useNotensystem();
  const range = system.max - system.min;
  const kNoten = noten.filter((n) => kategorieZurGruppe(n.kategorie) === "klausur");
  const mNoten = noten.filter((n) => kategorieZurGruppe(n.kategorie) === "muendlich");
  const kS = gruppenSchnitt(kNoten);
  const mS = gruppenSchnitt(mNoten);

  if (kS === null && mS === null) return null;

  return (
    <div className="mt-3 space-y-1.5">
      {kS !== null && (
        <div className="flex items-center gap-2">
          <span className="w-4 shrink-0 font-mono text-[10px] text-text-mute">K</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width,background-color] duration-500"
              style={{ width: `${((kS - system.min) / range) * 100}%`, background: schnittFarbe(kS, system) }}
            />
          </div>
          <span className="w-7 shrink-0 font-mono text-xs font-bold" style={{ color: schnittFarbe(kS, system) }}>
            {fmt(kS)}
          </span>
          <span className="w-5 shrink-0 font-mono text-[10px] text-text-mute">
            {system.formatNote(kS)}
          </span>
        </div>
      )}
      {mS !== null && (
        <div className="flex items-center gap-2">
          <span className="w-4 shrink-0 font-mono text-[10px] text-text-mute">M</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width,background-color] duration-500"
              style={{ width: `${((mS - system.min) / range) * 100}%`, background: schnittFarbe(mS, system) }}
            />
          </div>
          <span className="w-7 shrink-0 font-mono text-xs font-bold" style={{ color: schnittFarbe(mS, system) }}>
            {fmt(mS)}
          </span>
          <span className="w-5 shrink-0 font-mono text-[10px] text-text-mute">
            {system.formatNote(mS)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Schnitt-Verlauf Chart ─────────────────────────────────────────────────────
function SchnittVerlauf({ noten }: { noten: Note[] }) {
  const system = useNotensystem();
  const range = system.max - system.min;

  if (noten.length < 2) return null;

  const H = 52;
  const BAR_W = 22;
  const GAP = 5;
  const TOTAL_W = noten.length * (BAR_W + GAP) - GAP;

  const laufend = noten.reduce<{ pts: number[]; summe: number; gew: number }>(
    ({ pts, summe, gew }, n) => {
      const g = n.gewicht ?? 1;
      const newSumme = summe + n.punkte * g;
      const newGew = gew + g;
      return { pts: [...pts, newSumme / newGew], summe: newSumme, gew: newGew };
    },
    { pts: [], summe: 0, gew: 0 },
  ).pts;

  const avgPoints = laufend
    .map((avg, i) => `${i * (BAR_W + GAP) + BAR_W / 2},${H - ((avg - system.min) / range) * H}`)
    .join(" ");

  const refY = H * (1 - 0.667);

  return (
    <div className="mt-3 overflow-x-auto">
      <svg
        width={TOTAL_W}
        height={H + 14}
        viewBox={`0 0 ${TOTAL_W} ${H + 14}`}
        style={{ display: "block", minWidth: TOTAL_W }}
      >
        <line
          x1={0} y1={refY}
          x2={TOTAL_W} y2={refY}
          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3"
        />

        {noten.map((n, i) => {
          const x = i * (BAR_W + GAP);
          const barH = Math.max(3, ((n.punkte - system.min) / range) * H);
          return (
            <g key={n.id ?? i}>
              <rect
                x={x} y={H - barH}
                width={BAR_W} height={barH}
                rx={4}
                fill={schnittFarbe(n.punkte, system)}
                opacity={0.65}
              />
              <text
                x={x + BAR_W / 2} y={H - barH - 3}
                textAnchor="middle" fontSize={7}
                fill="var(--text-mute)" fontFamily="monospace"
              >
                {n.punkte}
              </text>
              <text
                x={x + BAR_W / 2} y={H + 11}
                textAnchor="middle" fontSize={7}
                fill="var(--text-mute)" fontFamily="monospace"
              >
                {KAT_KUERZEL[n.kategorie]}
              </text>
            </g>
          );
        })}

        <polyline
          points={avgPoints}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          opacity={0.75}
        />
        {laufend.map((avg, i) => (
          <circle
            key={i}
            cx={i * (BAR_W + GAP) + BAR_W / 2}
            cy={H - ((avg - system.min) / range) * H}
            r={2.5}
            fill={schnittFarbe(avg, system)}
            stroke="var(--surface-1)"
            strokeWidth={1}
          />
        ))}
      </svg>
    </div>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────
export function FachCard({
  fach,
  index,
  naechsteKlausur,
  vorherSchnitt,
  onAddNote,
  onRemoveNote,
  onUpdateNote,
  onOpenDialog,
}: {
  fach: Fach;
  index: number;
  naechsteKlausur?: { id: string; titel: string; datum: string } | null;
  vorherSchnitt?: number | null;
  onAddNote: (fachId: string, punkte: number, kategorie: Kategorie, bezeichnung?: string, gewicht?: number) => void;
  onRemoveNote: (fachId: string, noteId: string) => void;
  onUpdateNote: (fachId: string, noteId: string, punkte: number, kategorie: Kategorie, bezeichnung?: string, gewicht?: number) => void;
  onOpenDialog: (fachId: string) => void;
}) {
  const system = useNotensystem();
  const [wwwOffen, setWwwOffen] = useState(false);
  const [verlaufOffen, setVerlaufOffen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const schnitt = fachSchnittGerundet(fach.noten, fach.gewichtungConfig, system);
  const farbe = schnittFarbe(schnitt, system);
  const tage = naechsteKlausur ? tageBis(naechsteKlausur.datum) : null;

  return (
    <section
      className={`lift animate-fade-up rounded-3xl border border-border p-6 transition-opacity ${fach.ausgeschlossen ? "opacity-50" : ""}`}
      style={{
        background: "var(--card-grad)",
        animationDelay: `${0.1 + index * 0.07}s`,
        borderLeftColor: fach.farbe ?? undefined,
        borderLeftWidth: fach.farbe ? "3px" : undefined,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {fach.farbe && (
            <span className="mt-0.5 inline-block size-2.5 shrink-0 rounded-full" style={{ background: fach.farbe }} />
          )}
          <h2 className={`font-display text-xl font-extrabold tracking-[-0.02em] ${fach.ausgeschlossen ? "line-through decoration-text-mute" : ""}`}>
            {fach.name}
          </h2>
          {fach.ausgeschlossen && (
            <span className="rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[.1em] text-text-mute">
              Kein Schnitt
            </span>
          )}
          {fach.niveau && (
            <span className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[.1em] ${fach.niveau === "erhoeht" ? "bg-brand/15 text-brand" : "bg-surface-3 text-text-dim"}`}>
              {fach.niveau === "erhoeht" ? "LK" : "GK"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div>
              <span className="font-display text-2xl font-extrabold" style={{ color: farbe }}>{fmt(schnitt)}</span>
              {schnitt !== null && (
                <span className="ml-1.5 font-mono text-xs text-text-dim">{system.formatNote(schnitt)}</span>
              )}
            </div>
            {vorherSchnitt != null && (
              <div className="font-mono text-[10px] text-text-mute">Vorher: {fmt(vorherSchnitt)}</div>
            )}
          </div>
          {fach.noten.length >= 2 && (
            <button
              onClick={() => setVerlaufOffen((v) => !v)}
              title="Schnitt-Verlauf"
              className={`transition-colors ${verlaufOffen ? "text-brand" : "text-text-mute hover:text-foreground"}`}
            >
              <TrendingUp className="size-4" />
            </button>
          )}
          <button
            onClick={() => setWwwOffen((v) => !v)}
            title="What-If"
            className={`transition-colors ${wwwOffen ? "text-brand" : "text-text-mute hover:text-foreground"}`}
          >
            <Sparkles className="size-4" />
          </button>
          <button
            onClick={() => onOpenDialog(fach.id)}
            title="Fach konfigurieren"
            className="text-text-mute transition-colors hover:text-foreground"
          >
            <Settings2 className="size-4" />
          </button>
        </div>
      </div>

      <KategorienSplit noten={fach.noten} />
      {verlaufOffen && <SchnittVerlauf noten={fach.noten} />}

      {tage !== null && tage >= 0 && tage <= 14 && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 font-mono text-[11px] text-destructive">
          <span>⏰</span>
          <span>{tage === 0 ? "Klausur heute!" : tage === 1 ? "Klausur morgen" : `Klausur in ${tage} Tagen`}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {fach.noten.length === 0 && (
          <span className="font-mono text-xs text-text-mute">Noch keine Noten</span>
        )}
        {fach.noten.map((n) => {
          if (editingNoteId === n.id) {
            return (
              <NoteEditForm
                key={n.id}
                note={n}
                onSave={(p, k, bez, gew) => {
                  onUpdateNote(fach.id, n.id!, p, k, bez, gew);
                  setEditingNoteId(null);
                }}
                onCancel={() => setEditingNoteId(null)}
              />
            );
          }
          return (
            <span key={n.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 font-mono text-xs">
              <button
                onClick={() => setEditingNoteId(n.id!)}
                title={`${n.bezeichnung ?? KAT_LABEL[n.kategorie]} — klick zum Bearbeiten`}
                className="inline-flex items-center gap-1 px-2.5 py-1 hover:text-brand"
              >
                <span className="font-semibold">{n.punkte}</span>
                <span className="text-text-mute">{KAT_KUERZEL[n.kategorie]}</span>
                {n.bezeichnung && <span className="text-text-mute">·{n.bezeichnung.slice(0, 8)}</span>}
              </button>
              <button
                onClick={() => onRemoveNote(fach.id, n.id!)}
                title="Löschen"
                className="py-1 pr-2 text-text-mute hover:text-destructive"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>

      <AddNote onAdd={(p, k, bez, gew) => onAddNote(fach.id, p, k, bez, gew)} />
      {wwwOffen && <WasWaereWennPanel fach={fach} />}
    </section>
  );
}

function KategorieSelector({ value, onChange }: { value: Kategorie; onChange: (k: Kategorie) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[11px] font-semibold transition-colors active:scale-[0.96] ${open ? "border-brand/40 bg-brand/10 text-brand" : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"}`}
      >
        {KAT_LABEL[value]}
        <ChevronDown className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ALLE_KATEGORIEN.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { onChange(k); setOpen(false); }}
              className={`rounded-xl border px-3 py-1.5 font-mono text-[11px] transition-colors active:scale-[0.94] ${value === k ? "border-brand bg-brand font-semibold text-black" : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"}`}
            >
              {KAT_LABEL[k]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NoteEditForm({
  note, onSave, onCancel,
}: {
  note: Note;
  onSave: (punkte: number, kategorie: Kategorie, bezeichnung?: string, gewicht?: number) => void;
  onCancel: () => void;
}) {
  const system = useNotensystem();
  const [punkte, setPunkte] = useState(String(note.punkte));
  const [kategorie, setKategorie] = useState<Kategorie>(note.kategorie);
  const [bezeichnung, setBezeichnung] = useState(note.bezeichnung ?? "");
  const [gewicht, setGewicht] = useState(String(note.gewicht ?? 1));

  function submit() {
    const p = system.parse(punkte);
    if (p === null) return;
    const g = Number(gewicht);
    onSave(p, kategorie, bezeichnung.trim() || undefined, Number.isFinite(g) && g > 0 ? g : 1);
  }

  return (
    <div className="w-full rounded-2xl border border-brand/30 bg-surface-2 p-3 shadow-sm">
      <div className="mb-2"><KategorieSelector value={kategorie} onChange={setKategorie} /></div>
      <div className="flex items-center gap-2">
        <Input
          type="number" min={system.min} max={system.max} step={system.step}
          value={punkte} onChange={(e) => setPunkte(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }}
          className="h-8 w-16 bg-surface-3 font-mono text-sm" autoFocus
        />
        <Input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} placeholder="Bezeichnung" className="h-8 flex-1 bg-surface-3 font-mono text-xs" />
        <Input type="number" min={0.1} step={0.5} value={gewicht} onChange={(e) => setGewicht(e.target.value)} placeholder="×" title="Gewicht" className="h-8 w-14 bg-surface-3 font-mono text-xs" />
        <Button onClick={submit} size="sm" className="h-8 px-3 font-display font-bold text-xs">✓</Button>
        <button onClick={onCancel} className="font-mono text-sm text-text-mute hover:text-foreground">✕</button>
      </div>
    </div>
  );
}

function AddNote({ onAdd }: { onAdd: (punkte: number, kategorie: Kategorie, bezeichnung?: string, gewicht?: number) => void }) {
  const system = useNotensystem();
  const [punkte, setPunkte] = useState("");
  const [kategorie, setKategorie] = useState<Kategorie>("klausur");
  const [bezeichnung, setBezeichnung] = useState("");
  const [gewicht, setGewicht] = useState("1");
  const [erweitert, setErweitert] = useState(false);

  function submit() {
    const p = system.parse(punkte);
    if (p === null) return;
    const g = Number(gewicht);
    onAdd(p, kategorie, bezeichnung.trim() || undefined, Number.isFinite(g) && g > 0 ? g : 1);
    setPunkte("");
    setBezeichnung("");
    setGewicht("1");
  }

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <KategorieSelector value={kategorie} onChange={setKategorie} />
        <div className="flex-1" />
        <button
          onClick={() => setErweitert(!erweitert)}
          className="flex items-center gap-1 font-mono text-[11px] text-text-mute transition-[transform,color] duration-150 hover:text-text-dim active:scale-[0.95]"
        >
          Optionen
          <ChevronDown className={`size-3 transition-transform duration-200 ${erweitert ? "rotate-180" : ""}`} style={{ transitionTimingFunction: "var(--ease-out)" }} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number" min={system.min} max={system.max} step={system.step}
          value={punkte} onChange={(e) => setPunkte(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`${system.min}–${system.max}`}
          className="h-9 w-20 bg-surface-2 font-mono"
        />
        <Button onClick={submit} size="sm" className="ml-auto font-display font-bold">+ Note</Button>
      </div>
      {erweitert && (
        <div className="flex gap-2">
          <Input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} placeholder="Bezeichnung (z. B. 1. Klausur)" className="h-8 flex-1 bg-surface-2 font-mono text-xs" />
          <Input type="number" min={0.1} step={0.5} value={gewicht} onChange={(e) => setGewicht(e.target.value)} placeholder="Gewicht" title="Gewicht (Standard = 1)" className="h-8 w-20 bg-surface-2 font-mono text-xs" />
        </div>
      )}
    </div>
  );
}
