"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fachSchnittGerundet, benoetigtePunkte } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import { useNotensystem } from "@/components/notensystem-provider";
import type { Fach, Kategorie, Note } from "@/lib/grades/types";

const KATEGORIEN: { wert: Kategorie; label: string }[] = [
  { wert: "klausur", label: "Klausur" },
  { wert: "test", label: "Test" },
  { wert: "muendlich", label: "Mündlich" },
  { wert: "referat", label: "Referat" },
  { wert: "hausaufgabe", label: "HA" },
  { wert: "sonstige", label: "Sonst." },
];

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

let probeCounter = 0;

export function WasWaereWennPanel({ fach }: { fach: Fach }) {
  const system = useNotensystem();
  const [proben, setProben] = useState<Note[]>([]);
  const [probePunkte, setProbePunkte] = useState("");
  const [probeKat, setProbeKat] = useState<Kategorie>("klausur");
  const [ziel, setZiel] = useState("");
  const [zielKat, setZielKat] = useState<Kategorie>("klausur");

  const istSchnitt = fachSchnittGerundet(fach.noten, fach.gewichtungConfig, system);
  const mitProben = fachSchnittGerundet([...fach.noten, ...proben], fach.gewichtungConfig, system);

  function addProbe() {
    const p = system.parse(probePunkte);
    if (p === null) return;
    setProben((prev) => [...prev, { id: `probe-${probeCounter++}`, punkte: p, kategorie: probeKat }]);
    setProbePunkte("");
  }

  const zielZahl = Number(ziel);
  const zielGueltig = ziel !== "" && !Number.isNaN(zielZahl) && zielZahl >= system.min && zielZahl <= system.max;
  const ergebnis = zielGueltig
    ? benoetigtePunkte(fach.noten, fach.gewichtungConfig, zielKat, 1, zielZahl, system)
    : null;

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-brand/30 bg-brand/5 p-4">
      {/* Durchspielen */}
      <div>
        <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-brand">Durchspielen</div>
        <div className="flex items-baseline gap-2 font-display text-lg font-extrabold">
          <span style={{ color: schnittFarbe(istSchnitt, system) }}>{fmt(istSchnitt)}</span>
          {proben.length > 0 && (
            <>
              <span className="text-text-mute">→</span>
              <span style={{ color: schnittFarbe(mitProben, system) }}>{fmt(mitProben)}</span>
              {mitProben !== null && (
                <span className="font-mono text-xs text-text-dim">{system.formatNote(mitProben)}</span>
              )}
            </>
          )}
        </div>

        {proben.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {proben.map((p) => (
              <button
                key={p.id}
                onClick={() => setProben((prev) => prev.filter((x) => x.id !== p.id))}
                title="Probe entfernen"
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand/50 bg-brand/10 px-2.5 py-1 font-mono text-xs text-brand"
              >
                <span className="font-semibold">{p.punkte}</span>
                <span className="opacity-70">{p.kategorie === "klausur" ? "K" : "M"}</span>
                <span>×</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <Input
            type="number" min={system.min} max={system.max} step={system.step}
            value={probePunkte} onChange={(e) => setProbePunkte(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addProbe()}
            placeholder={`${system.min}–${system.max}`}
            className="h-8 w-16 bg-surface-2 font-mono text-xs"
          />
          <div className="flex overflow-hidden rounded-lg border border-border">
            {KATEGORIEN.map((k) => (
              <button
                key={k.wert}
                onClick={() => setProbeKat(k.wert)}
                className={`px-2 py-1 font-mono text-[11px] transition-colors ${probeKat === k.wert ? "bg-brand text-black" : "bg-surface-2 text-text-dim hover:bg-surface-3"}`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <Button onClick={addProbe} size="sm" variant="outline" className="border-border bg-surface-2 text-xs">+ Probe</Button>
        </div>
      </div>

      {/* Zielnoten-Rechner */}
      <div className="border-t border-border pt-3">
        <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-brand">Was brauche ich?</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-text-dim">Ziel-Schnitt</span>
          <Input
            type="number" min={system.min} max={system.max} step={system.step}
            value={ziel} onChange={(e) => setZiel(e.target.value)}
            placeholder={`z. B. ${system.max}`}
            className="h-8 w-16 bg-surface-2 font-mono text-xs"
          />
          <span className="font-mono text-xs text-text-dim">in</span>
          <div className="flex overflow-hidden rounded-lg border border-border">
            {KATEGORIEN.map((k) => (
              <button
                key={k.wert}
                onClick={() => setZielKat(k.wert)}
                className={`px-2 py-1 font-mono text-[11px] transition-colors ${zielKat === k.wert ? "bg-brand text-black" : "bg-surface-2 text-text-dim hover:bg-surface-3"}`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        {ergebnis !== null && (
          <p className="mt-2 font-mono text-sm">
            {ergebnis === "erreicht" ? (
              <span className="text-success">Ziel schon erreicht 🎉</span>
            ) : ergebnis === "unmoeglich" ? (
              <span className="text-destructive">Mit einer Note nicht erreichbar — du brauchst mehrere.</span>
            ) : (
              <span className="text-foreground">
                Du brauchst mind.{" "}
                <span className="font-bold text-brand">{ergebnis} Punkte</span>{" "}
                <span className="text-text-dim">({system.formatNote(ergebnis)})</span>
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
