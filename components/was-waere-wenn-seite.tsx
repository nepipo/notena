"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fachSchnittGerundet, gesamtSchnittGerundet, benoetigtePunkte } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import { useNotensystem } from "@/components/notensystem-provider";
import type { Fach, Kategorie, Note } from "@/lib/grades/types";

const KATEGORIEN: { wert: Kategorie; label: string; kurz: string }[] = [
  { wert: "klausur", label: "Klausur", kurz: "K" },
  { wert: "muendlich", label: "Mündlich", kurz: "M" },
  { wert: "test", label: "Test", kurz: "T" },
  { wert: "referat", label: "Referat", kurz: "R" },
];

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

let probeCounter = 0;

function SchnittBalken({ wert }: { wert: number | null }) {
  const system = useNotensystem();
  const range = system.max - system.min;
  const pct = wert === null ? 0 : ((wert - system.min) / range) * 100;
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-500"
        style={{ width: `${pct}%`, background: schnittFarbe(wert, system) }}
      />
    </div>
  );
}

function DeltaBadge({ vorher, nachher }: { vorher: number | null; nachher: number | null }) {
  if (vorher === null || nachher === null || vorher === nachher) return null;
  const delta = nachher - vorher;
  const positiv = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-xs font-bold ${positiv ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
      {positiv ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
    </span>
  );
}

export function WasWaereWennSeite({ faecher }: { faecher: Fach[] }) {
  const system = useNotensystem();
  const [fachId, setFachId] = useState<string>(faecher[0]?.id ?? "");
  const [proben, setProben] = useState<Note[]>([]);
  const [probePunkte, setProbePunkte] = useState("");
  const [probeKat, setProbeKat] = useState<Kategorie>("klausur");
  const [ziel, setZiel] = useState("");
  const [zielKat, setZielKat] = useState<Kategorie>("klausur");

  const fach = faecher.find((f) => f.id === fachId) ?? null;
  const istSchnittFach = fach ? fachSchnittGerundet(fach.noten, fach.gewichtungConfig, system) : null;
  const mitProbenFach = fach ? fachSchnittGerundet([...fach.noten, ...proben], fach.gewichtungConfig, system) : null;
  const gesamtVorher = gesamtSchnittGerundet(faecher, system);
  const faecherMitProben = fach ? faecher.map((f) => (f.id === fachId ? { ...f, noten: [...f.noten, ...proben] } : f)) : faecher;
  const gesamtNachher = gesamtSchnittGerundet(faecherMitProben, system);

  function addProbe(p?: number) {
    if (p !== undefined) {
      setProben((prev) => [...prev, { id: `probe-${probeCounter++}`, punkte: p, kategorie: probeKat }]);
      return;
    }
    const parsed = system.parse(probePunkte);
    if (parsed === null) return;
    setProben((prev) => [...prev, { id: `probe-${probeCounter++}`, punkte: parsed, kategorie: probeKat }]);
    setProbePunkte("");
  }

  const zielZahl = Number(ziel);
  const zielGueltig = ziel !== "" && !Number.isNaN(zielZahl) && zielZahl >= system.min && zielZahl <= system.max;
  const ergebnis = zielGueltig && fach
    ? benoetigtePunkte(fach.noten, fach.gewichtungConfig, zielKat, 1, zielZahl, system)
    : null;

  // System-spezifische Quick-Pick-Werte
  const quickPickWerte: number[] = [];
  for (let v = system.min; v <= system.max + 1e-9; v = Math.round((v + system.step) * 1000) / 1000) {
    quickPickWerte.push(v);
  }
  const gefilterteWerte = quickPickWerte.length <= 16
    ? quickPickWerte
    : quickPickWerte.filter((_, i, arr) => i === 0 || i === arr.length - 1 || i % Math.ceil(arr.length / 12) === 0);

  if (faecher.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="text-5xl">🔮</div>
        <p className="font-display text-xl font-bold">Noch keine Fächer</p>
        <p className="font-mono text-sm text-text-mute">Leg im Notenrechner erst Fächer &amp; Noten an.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gesamtschnitt-Impact Hero */}
      <section
        className="animate-fade-up relative overflow-hidden rounded-[28px] border-2 p-6 sm:p-8"
        style={{ background: "var(--hero-grad)", borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)" }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-40" style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }} />
        <div className="relative z-[2]">
          <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">Gesamtschnitt-Impact</div>
          <div className="flex flex-wrap items-end gap-4 sm:gap-8">
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-mute">Jetzt</div>
              <div className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl" style={{ color: schnittFarbe(gesamtVorher, system) }}>
                {fmt(gesamtVorher)}
              </div>
              {gesamtVorher !== null && (
                <div className="mt-1 font-mono text-xs text-text-dim">Note {system.formatNote(gesamtVorher)}</div>
              )}
            </div>
            {proben.length > 0 && (
              <>
                <div className="text-2xl text-text-mute">→</div>
                <div>
                  <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-mute">Hochgerechnet</div>
                  <div className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl" style={{ color: schnittFarbe(gesamtNachher, system) }}>
                    {fmt(gesamtNachher)}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {gesamtNachher !== null && (
                      <span className="font-mono text-xs text-text-dim">Note {system.formatNote(gesamtNachher)}</span>
                    )}
                    <DeltaBadge vorher={gesamtVorher} nachher={gesamtNachher} />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="mt-5 space-y-1.5">
            <SchnittBalken wert={gesamtVorher} />
            {proben.length > 0 && <SchnittBalken wert={gesamtNachher} />}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Fächerliste */}
        <div className="space-y-1.5">
          <div className="mb-2 px-1 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">Fach wählen</div>
          {faecher.map((f) => {
            const schnitt = fachSchnittGerundet(f.noten, f.gewichtungConfig, system);
            const istAktiv = f.id === fachId;
            return (
              <button
                key={f.id}
                onClick={() => { setFachId(f.id); setProben([]); setProbePunkte(""); setZiel(""); }}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-[background-color,border-color] ${istAktiv ? "border-brand/40 bg-brand/10" : "border-transparent bg-surface-2 hover:bg-surface-3"}`}
              >
                {f.farbe ? (
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: f.farbe }} />
                ) : (
                  <span className="size-2.5 shrink-0 rounded-full bg-surface-3" />
                )}
                <span className={`flex-1 font-sans text-sm font-semibold ${istAktiv ? "text-brand" : "text-foreground"}`}>{f.name}</span>
                {f.niveau === "erhoeht" && <span className="font-mono text-[9px] font-bold text-brand opacity-70">LK</span>}
                <span className="font-mono text-sm font-bold tabular-nums" style={{ color: schnittFarbe(schnitt, system) }}>{fmt(schnitt)}</span>
              </button>
            );
          })}
        </div>

        {/* Panel */}
        {fach && (
          <div className="animate-fade-up space-y-4">
            {/* Fach-Schnitt */}
            <div
              className="rounded-[24px] border p-5"
              style={{ background: "var(--card-grad)", borderColor: fach.farbe ? `color-mix(in srgb, ${fach.farbe} 40%, transparent)` : "var(--border)" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {fach.farbe && <span className="size-3 rounded-full" style={{ background: fach.farbe }} />}
                    <span className="font-display text-2xl font-extrabold">{fach.name}</span>
                    {fach.niveau && (
                      <span className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[.1em] ${fach.niveau === "erhoeht" ? "bg-brand/15 text-brand" : "bg-surface-3 text-text-dim"}`}>
                        {fach.niveau === "erhoeht" ? "LK" : "GK"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-extrabold" style={{ color: schnittFarbe(istSchnittFach, system) }}>{fmt(istSchnittFach)}</span>
                    {proben.length > 0 && (
                      <>
                        <span className="text-xl text-text-mute">→</span>
                        <span className="font-display text-4xl font-extrabold" style={{ color: schnittFarbe(mitProbenFach, system) }}>{fmt(mitProbenFach)}</span>
                        <DeltaBadge vorher={istSchnittFach} nachher={mitProbenFach} />
                      </>
                    )}
                  </div>
                  {mitProbenFach !== null && proben.length > 0 && (
                    <div className="mt-1 font-mono text-xs text-text-dim">Note {system.formatNote(mitProbenFach)}</div>
                  )}
                </div>
                {proben.length > 0 && (
                  <button
                    onClick={() => setProben([])}
                    className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs text-text-mute transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-16 font-mono text-[10px] text-text-mute">Aktuell</span>
                  <SchnittBalken wert={istSchnittFach} />
                  <span className="w-8 text-right font-mono text-xs font-bold tabular-nums" style={{ color: schnittFarbe(istSchnittFach, system) }}>{fmt(istSchnittFach)}</span>
                </div>
                {proben.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 font-mono text-[10px] text-text-mute">Fiktiv</span>
                    <SchnittBalken wert={mitProbenFach} />
                    <span className="w-8 text-right font-mono text-xs font-bold tabular-nums" style={{ color: schnittFarbe(mitProbenFach, system) }}>{fmt(mitProbenFach)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Was wenn ich X schreibe? */}
            <div className="rounded-[24px] border border-border p-5" style={{ background: "var(--card-grad)" }}>
              <div className="mb-4">
                <div className="font-display text-base font-extrabold">Was wäre, wenn ich X schreibe?</div>
                <div className="mt-0.5 font-mono text-xs text-text-mute">Tipp eine fiktive Note ein — der Schnitt oben aktualisiert sich sofort.</div>
              </div>
              {proben.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {proben.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProben((prev) => prev.filter((x) => x.id !== p.id))}
                      className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand/50 bg-brand/10 px-3 py-1.5 font-mono text-sm text-brand transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <span className="font-bold">{p.punkte}</span>
                      <span className="opacity-60">{KATEGORIEN.find((k) => k.wert === p.kategorie)?.kurz ?? "?"}</span>
                      <span className="text-xs">×</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {KATEGORIEN.map((k) => (
                  <button
                    key={k.wert}
                    onClick={() => setProbeKat(k.wert)}
                    className={`rounded-xl px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${probeKat === k.wert ? "bg-brand text-black" : "bg-surface-2 text-text-dim hover:bg-surface-3"}`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {gefilterteWerte.map((p) => (
                    <button
                      key={p}
                      onClick={() => addProbe(p)}
                      className="min-w-[2.5rem] rounded-xl border border-border bg-surface-2 px-2 py-1.5 font-mono text-sm font-bold transition-colors hover:border-brand/40 hover:bg-brand/10"
                      style={{ color: schnittFarbe(p, system) }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={system.min} max={system.max} step={system.step}
                    value={probePunkte} onChange={(e) => setProbePunkte(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addProbe()}
                    placeholder={`Andere (${system.min}–${system.max})`}
                    className="h-10 flex-1 bg-surface-2 font-mono"
                  />
                  <Button onClick={() => addProbe()} className="h-10 font-display font-bold">Eintragen</Button>
                </div>
              </div>
            </div>

            {/* Was muss ich schreiben? */}
            <div className="rounded-[24px] border border-border p-5" style={{ background: "var(--card-grad)" }}>
              <div className="mb-4">
                <div className="font-display text-base font-extrabold">Was muss ich schreiben, um X zu erreichen?</div>
                <div className="mt-0.5 font-mono text-xs text-text-mute">Zielschnitt wählen — ich rechne aus, welche Punkte du mindestens brauchst.</div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {gefilterteWerte.filter((v) => v > system.min).map((z) => (
                  <button
                    key={z}
                    onClick={() => setZiel(String(z))}
                    className={`min-w-[2.5rem] rounded-xl border px-2 py-1.5 font-mono text-sm font-bold transition-colors ${ziel === String(z) ? "border-brand bg-brand/15 text-brand" : "border-border bg-surface-2 hover:border-brand/40 hover:bg-brand/10"}`}
                    style={{ color: ziel === String(z) ? undefined : schnittFarbe(z, system) }}
                  >
                    {z}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number" min={system.min} max={system.max} step={system.step}
                  value={ziel} onChange={(e) => setZiel(e.target.value)}
                  placeholder={`Zielschnitt (${system.min}–${system.max})`}
                  className="h-10 w-36 bg-surface-2 font-mono"
                />
                <span className="font-mono text-sm text-text-dim">in</span>
                <div className="flex overflow-hidden rounded-xl border border-border">
                  {KATEGORIEN.slice(0, 3).map((k) => (
                    <button
                      key={k.wert}
                      onClick={() => setZielKat(k.wert)}
                      className={`px-3 py-2 font-mono text-xs font-semibold transition-colors ${zielKat === k.wert ? "bg-brand text-black" : "bg-surface-2 text-text-dim hover:bg-surface-3"}`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>
              {ergebnis !== null && (
                <div className="mt-5">
                  {ergebnis === "erreicht" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <div className="font-display font-bold text-emerald-400">Ziel schon erreicht!</div>
                        <div className="font-mono text-xs text-text-dim">Dein Schnitt liegt bereits bei oder über {ziel}.</div>
                      </div>
                    </div>
                  ) : ergebnis === "unmoeglich" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                      <span className="text-2xl">💀</span>
                      <div>
                        <div className="font-display font-bold text-red-400">Mit einer Note nicht erreichbar</div>
                        <div className="font-mono text-xs text-text-dim">Selbst mit {system.max} würdest du {ziel} nicht erreichen.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
                      <div
                        className="flex size-14 shrink-0 items-center justify-center rounded-2xl font-display text-3xl font-extrabold"
                        style={{ background: `color-mix(in srgb, ${schnittFarbe(ergebnis, system)} 20%, transparent)`, color: schnittFarbe(ergebnis, system) }}
                      >
                        {ergebnis}
                      </div>
                      <div>
                        <div className="font-display font-bold">
                          Mindestens <span style={{ color: schnittFarbe(ergebnis, system) }}>{ergebnis} Punkte</span>
                        </div>
                        <div className="font-mono text-xs text-text-dim">Note {system.formatNote(ergebnis)} — dann erreichst du Schnitt {ziel}.</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
