"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fachSchnittGerundet,
  gesamtSchnittGerundet,
  benoetigtePunkte,
  benoetigterFachschnittFuerGesamtziel,
} from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import { noteEingabeProps } from "@/lib/grades/systems";
import { useNotensystem } from "@/components/notensystem-provider";
import { KategorieSelector, katKuerzel } from "@/components/notenrechner/kategorie-selector";
import { useCustomKategorien } from "@/components/kategorien-provider";
import type { Fach, Kategorie, Note } from "@/lib/grades/types";

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

let noteCounter = 0;

function SchnittBalken({ wert }: { wert: number | null }) {
  const system = useNotensystem();
  const range = system.max - system.min;
  const pct = wert === null ? 0 : ((wert - system.min) / range) * 100;
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-500"
        style={{ width: `${pct}%`, background: schnittFarbe(wert, system) }}
      />
    </div>
  );
}

function DeltaBadge({ vorher, nachher }: { vorher: number | null; nachher: number | null }) {
  if (vorher === null || nachher === null || Math.abs(vorher - nachher) < 0.05) return null;
  const delta = nachher - vorher;
  const positiv = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-xs font-bold ${
        positiv ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
      }`}
    >
      {positiv ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
    </span>
  );
}

function PunkteBadge({
  wert,
  label,
}: {
  wert: number | "erreicht" | "unmoeglich" | null;
  label: string;
}) {
  const system = useNotensystem();
  if (wert === null) return null;
  if (wert === "erreicht") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-text-mute">{label}</span>
        <span className="font-mono text-xs font-bold text-emerald-400">✓ reicht</span>
      </div>
    );
  }
  if (wert === "unmoeglich") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] text-text-mute">{label}</span>
        <span className="font-mono text-xs font-bold text-red-400">nicht schaffbar</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-[10px] text-text-mute">{label}</span>
      <span className="font-mono text-sm font-extrabold tabular-nums" style={{ color: schnittFarbe(wert, system) }}>
        {wert}
      </span>
      <span className="font-mono text-[10px] text-text-mute">({system.formatNote(wert)})</span>
    </div>
  );
}

export function WasWaereWennSeite({ faecher }: { faecher: Fach[] }) {
  const system = useNotensystem();
  const custom = useCustomKategorien();

  // ── Kombinations-Simulator ──────────────────────────────────────────────────
  const [simNoten, setSimNoten] = useState<Record<string, Note[]>>({});
  const [simKat, setSimKat] = useState<Record<string, Kategorie>>({});
  const [simInput, setSimInput] = useState<Record<string, string>>({});

  // ── Ziel-Gesamtschnitt ─────────────────────────────────────────────────────
  const [gesamtZiel, setGesamtZiel] = useState("");

  // ── Einzel-Fach ────────────────────────────────────────────────────────────
  const [fachId, setFachId] = useState(faecher[0]?.id ?? "");
  const [proben, setProben] = useState<Note[]>([]);
  const [probePunkte, setProbePunkte] = useState("");
  const [probeKat, setProbeKat] = useState<Kategorie>("klausur");
  const [ziel, setZiel] = useState("");
  const [zielKat, setZielKat] = useState<Kategorie>("klausur");

  // ── Quick-Pick Werte ────────────────────────────────────────────────────────
  const alleWerte: number[] = [];
  for (let v = system.min; v <= system.max + 1e-9; v = Math.round((v + system.step) * 1000) / 1000) {
    alleWerte.push(v);
  }
  const quickWerte =
    alleWerte.length <= 16
      ? alleWerte
      : alleWerte.filter(
          (_, i, arr) =>
            i === 0 || i === arr.length - 1 || i % Math.ceil(arr.length / 12) === 0
        );

  // ── Berechnungen Kombinations-Simulator ────────────────────────────────────
  const faecherMitSim = faecher.map((f) => ({
    ...f,
    noten: [...f.noten, ...(simNoten[f.id] ?? [])],
  }));
  const gesamtVorher = gesamtSchnittGerundet(faecher, system);
  const gesamtNachherSim = gesamtSchnittGerundet(faecherMitSim, system);
  const hatSimNoten = Object.values(simNoten).some((v) => v.length > 0);

  // ── Berechnungen Ziel ──────────────────────────────────────────────────────
  const gesamtZielPunkte = system.parse(gesamtZiel); // Ziel-Schnitt -> kanonische Punkte
  const gesamtZielGueltig = gesamtZielPunkte !== null;

  const zielErgebnisse = gesamtZielGueltig
    ? faecher
        .filter((f) => !f.ausgeschlossen && !f.parentFachId)
        .map((f) => {
          const aktuell = fachSchnittGerundet(f.noten, f.gewichtungConfig, system);
          const benoetigterSchnitt = benoetigterFachschnittFuerGesamtziel(
            f,
            faecher,
            gesamtZielPunkte,
            system
          );
          const klausurPunkte =
            typeof benoetigterSchnitt === "number"
              ? benoetigtePunkte(f.noten, f.gewichtungConfig, "klausur", 1, benoetigterSchnitt, system)
              : null;
          const muendlichPunkte =
            typeof benoetigterSchnitt === "number"
              ? benoetigtePunkte(f.noten, f.gewichtungConfig, "muendlich", 1, benoetigterSchnitt, system)
              : null;
          return { fach: f, aktuell, benoetigterSchnitt, klausurPunkte, muendlichPunkte };
        })
    : [];

  // ── Berechnungen Einzel-Fach ───────────────────────────────────────────────
  const fach = faecher.find((f) => f.id === fachId) ?? null;
  const istSchnittFach = fach ? fachSchnittGerundet(fach.noten, fach.gewichtungConfig, system) : null;
  const mitProbenFach = fach
    ? fachSchnittGerundet([...fach.noten, ...proben], fach.gewichtungConfig, system)
    : null;
  const faecherMitProben = fach
    ? faecher.map((f) => (f.id === fachId ? { ...f, noten: [...f.noten, ...proben] } : f))
    : faecher;
  const gesamtNachherEinzel = gesamtSchnittGerundet(faecherMitProben, system);
  const zielPunkte = system.parse(ziel);
  const zielGueltig = zielPunkte !== null;
  const ergebnis =
    zielGueltig && fach
      ? benoetigtePunkte(fach.noten, fach.gewichtungConfig, zielKat, 1, zielPunkte, system)
      : null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function addSimNote(fId: string, punkte?: number) {
    const p = punkte !== undefined ? punkte : system.parse(simInput[fId] ?? "");
    if (p === null) return;
    const kat = simKat[fId] ?? "klausur";
    setSimNoten((prev) => ({
      ...prev,
      [fId]: [...(prev[fId] ?? []), { id: `sim-${noteCounter++}`, punkte: p, kategorie: kat }],
    }));
    if (punkte === undefined) setSimInput((prev) => ({ ...prev, [fId]: "" }));
  }

  function removeSimNote(fId: string, noteId: string) {
    setSimNoten((prev) => ({
      ...prev,
      [fId]: (prev[fId] ?? []).filter((n) => n.id !== noteId),
    }));
  }

  function addProbe(p?: number) {
    if (p !== undefined) {
      setProben((prev) => [...prev, { id: `probe-${noteCounter++}`, punkte: p, kategorie: probeKat }]);
      return;
    }
    const parsed = system.parse(probePunkte);
    if (parsed === null) return;
    setProben((prev) => [...prev, { id: `probe-${noteCounter++}`, punkte: parsed, kategorie: probeKat }]);
    setProbePunkte("");
  }

  if (faecher.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="text-5xl">🔮</div>
        <p className="font-display text-xl font-bold">Noch keine Fächer</p>
        <p className="font-mono text-sm text-text-mute">Leg im Notenrechner erst Fächer & Noten an.</p>
      </div>
    );
  }

  const hauptfaecher = faecher.filter((f) => !f.parentFachId && !f.ausgeschlossen);

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════════════════
          BLOCK A — Kombinations-Simulator
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="animate-fade-up relative overflow-hidden rounded-[28px] border-2 p-6 sm:p-8"
        style={{
          background: "var(--hero-grad)",
          borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
        }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 65%)" }}
        />
        <div className="relative z-[2]">
          {/* Live-Schnitt */}
          <div className="mb-5">
            <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
              Kombinations-Simulator
            </div>
            <div className="flex flex-wrap items-end gap-6 sm:gap-10">
              <div>
                <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-mute">Aktuell</div>
                <div
                  className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl"
                  style={{ color: schnittFarbe(gesamtVorher, system) }}
                >
                  {fmt(gesamtVorher)}
                </div>
              </div>
              {hatSimNoten && (
                <>
                  <div className="pb-1 text-2xl text-text-mute">→</div>
                  <div>
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-text-mute">
                      Mit deinen Noten
                    </div>
                    <div
                      className="font-display text-5xl font-extrabold leading-none tracking-tight sm:text-6xl"
                      style={{ color: schnittFarbe(gesamtNachherSim, system) }}
                    >
                      {fmt(gesamtNachherSim)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {gesamtNachherSim !== null && (
                        <span className="font-mono text-xs text-text-dim">
                          {system.formatNote(gesamtNachherSim)}
                        </span>
                      )}
                      <DeltaBadge vorher={gesamtVorher} nachher={gesamtNachherSim} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 space-y-1.5">
              <SchnittBalken wert={gesamtVorher} />
              {hatSimNoten && <SchnittBalken wert={gesamtNachherSim} />}
            </div>
          </div>

          <p className="mb-4 font-mono text-xs text-text-mute">
            Trag geplante Noten in beliebig viele Fächer ein — der Gesamtschnitt passt sich sofort an.
          </p>

          {/* Fächer-Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hauptfaecher.map((f) => {
              const simFach = simNoten[f.id] ?? [];
              const schnittVorher = fachSchnittGerundet(f.noten, f.gewichtungConfig, system);
              const schnittNachher = fachSchnittGerundet(
                [...f.noten, ...simFach],
                f.gewichtungConfig,
                system
              );
              const hatSim = simFach.length > 0;
              const kat = simKat[f.id] ?? "klausur";

              return (
                <div
                  key={f.id}
                  className="rounded-2xl border border-border/60 bg-surface-1/80 p-3.5 backdrop-blur-sm"
                >
                  {/* Fach-Kopf */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {f.farbe && (
                        <span className="size-2 shrink-0 rounded-full" style={{ background: f.farbe }} />
                      )}
                      <span className="truncate font-sans text-sm font-semibold">{f.name}</span>
                      {f.niveau === "erhoeht" && (
                        <span className="shrink-0 rounded-md bg-brand/15 px-1 py-0.5 font-mono text-[9px] font-bold text-brand">
                          LK
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        className="font-mono text-sm font-bold tabular-nums"
                        style={{ color: schnittFarbe(schnittVorher, system) }}
                      >
                        {fmt(schnittVorher)}
                      </span>
                      {hatSim && schnittNachher !== schnittVorher && (
                        <>
                          <span className="text-text-mute">→</span>
                          <span
                            className="font-mono text-sm font-bold tabular-nums"
                            style={{ color: schnittFarbe(schnittNachher, system) }}
                          >
                            {fmt(schnittNachher)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Geplante Noten */}
                  {hatSim && (
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      {simFach.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => removeSimNote(f.id, n.id!)}
                          className="inline-flex items-center gap-1 rounded-full border border-dashed border-brand/50 bg-brand/10 px-2 py-1 font-mono text-xs text-brand transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <span className="font-bold">{n.punkte}</span>
                          <span className="opacity-60">{katKuerzel(n.kategorie, custom)}</span>
                          <span className="text-[10px]">×</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Eingabe */}
                  <div className="space-y-2">
                    <KategorieSelector
                      value={kat}
                      onChange={(k) => setSimKat((prev) => ({ ...prev, [f.id]: k }))}
                    />
                    <div className="flex flex-wrap gap-1">
                      {quickWerte.map((p) => (
                        <button
                          key={p}
                          onClick={() => addSimNote(f.id, p)}
                          className="min-w-[1.9rem] rounded-lg border border-border/60 bg-surface-2 px-1.5 py-1 font-mono text-xs font-bold transition-colors hover:border-brand/40 hover:bg-brand/10"
                          style={{ color: schnittFarbe(p, system) }}
                        >
                          {system.formatNote(p)}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        {...noteEingabeProps(system)}
                        value={simInput[f.id] ?? ""}
                        onChange={(e) =>
                          setSimInput((prev) => ({ ...prev, [f.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && addSimNote(f.id)}
                        placeholder={`andere (${system.eingabeHinweis})`}
                        className="h-8 flex-1 bg-surface-2 font-mono text-xs"
                      />
                      <Button
                        onClick={() => addSimNote(f.id)}
                        size="sm"
                        className="h-8 px-3 font-display font-bold"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hatSimNoten && (
            <button
              onClick={() => setSimNoten({})}
              className="mt-4 rounded-xl border border-border/60 bg-surface-2/60 px-4 py-2 font-mono text-xs text-text-mute transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              Alle zurücksetzen
            </button>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BLOCK B — Ziel-Gesamtschnitt
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="animate-fade-up rounded-[24px] border border-border p-5 sm:p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.04s" }}
      >
        <div className="mb-1 font-display text-base font-extrabold">
          Was brauche ich für Gesamtschnitt X?
        </div>
        <div className="mb-4 font-mono text-xs text-text-mute">
          Ich zeige dir pro Fach: welchen Schnitt du dort bräuchtest — und was das konkret als nächste
          Klausur oder mündliche Note bedeutet.
        </div>

        {/* Ziel-Eingabe */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {quickWerte.filter((v) => v > system.min).map((z) => (
              <button
                key={z}
                onClick={() => setGesamtZiel(system.formatNote(z))}
                className={`min-w-[2.4rem] rounded-xl border px-2 py-1.5 font-mono text-sm font-bold transition-colors ${
                  gesamtZielPunkte === z
                    ? "border-brand bg-brand/15 text-brand"
                    : "border-border bg-surface-2 hover:border-brand/40 hover:bg-brand/10"
                }`}
                style={{ color: gesamtZielPunkte === z ? undefined : schnittFarbe(z, system) }}
              >
                {system.formatSchnitt(z)}
              </button>
            ))}
          </div>
          <Input
            {...noteEingabeProps(system)}
            value={gesamtZiel}
            onChange={(e) => setGesamtZiel(e.target.value)}
            className="h-10 w-32 bg-surface-2 font-mono"
          />
        </div>

        {/* Ergebnisse */}
        {gesamtZielGueltig && zielErgebnisse.length > 0 && (
          <div className="mt-5 space-y-2.5">
            {zielErgebnisse.map(({ fach: f, aktuell, benoetigterSchnitt, klausurPunkte, muendlichPunkte }) => {
              const istErreicht = benoetigterSchnitt === "erreicht";
              const istUnmoeglich = benoetigterSchnitt === "unmoeglich";

              return (
                <div
                  key={f.id}
                  className={`rounded-2xl border p-4 ${
                    istErreicht
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : istUnmoeglich
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-border/60 bg-surface-2"
                  }`}
                >
                  {/* Fach-Kopf */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {f.farbe && (
                        <span className="size-2 shrink-0 rounded-full" style={{ background: f.farbe }} />
                      )}
                      <span className="font-sans text-sm font-semibold">{f.name}</span>
                      {f.niveau === "erhoeht" && (
                        <span className="rounded-md bg-brand/15 px-1 py-0.5 font-mono text-[9px] font-bold text-brand">
                          LK
                        </span>
                      )}
                      {f.niveau === "grundlegend" && (
                        <span className="rounded-md bg-surface-3 px-1 py-0.5 font-mono text-[9px] font-bold text-text-dim">
                          GK
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-text-mute">
                      jetzt{" "}
                      <span style={{ color: schnittFarbe(aktuell, system) }}>{fmt(aktuell)}</span>
                    </span>
                  </div>

                  {/* Ergebnis */}
                  {istErreicht ? (
                    <div className="flex items-center gap-2">
                      <span className="text-base">✅</span>
                      <span className="font-mono text-sm font-bold text-emerald-400">Schon erreicht</span>
                    </div>
                  ) : istUnmoeglich ? (
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚫</span>
                      <div>
                        <span className="font-mono text-sm font-bold text-red-400">
                          Mit diesem Fach allein nicht schaffbar
                        </span>
                        <div className="mt-0.5 font-mono text-[10px] text-text-mute">
                          Selbst mit der Bestnote ({system.formatNote(system.max)}) überall reicht es nicht — du musst in mehreren
                          Fächern besser werden.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Benötigter Fachschnitt */}
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-text-mute">Fachschnitt nötig</span>
                        <span
                          className="font-mono text-lg font-extrabold tabular-nums"
                          style={{ color: schnittFarbe(benoetigterSchnitt as number, system) }}
                        >
                          {fmt(benoetigterSchnitt as number)}
                        </span>
                        <DeltaBadge vorher={aktuell} nachher={benoetigterSchnitt as number} />
                      </div>

                      {/* Konkrete nächste Noten */}
                      <div className="rounded-xl border border-border/40 bg-surface-1/50 px-3 py-2.5">
                        <div className="mb-2 font-mono text-[9px] font-semibold uppercase tracking-[.2em] text-text-mute">
                          Das heißt konkret — nächste Note:
                        </div>
                        <div className="space-y-1.5">
                          <PunkteBadge wert={klausurPunkte} label="Klausur mind." />
                          <PunkteBadge wert={muendlichPunkte} label="Mündlich mind." />
                          {klausurPunkte === "unmoeglich" && muendlichPunkte === "unmoeglich" && (
                            <div className="font-mono text-[10px] text-amber-400">
                              Nicht mit einer Note schaffbar — du brauchst mehrere gute Noten in diesem
                              Fach.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BLOCK C — Einzel-Fach
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        {/* Fächerliste */}
        <div className="space-y-1">
          <div className="mb-2 px-1 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
            Fach auswählen
          </div>
          {faecher.map((f) => {
            const schnitt = fachSchnittGerundet(f.noten, f.gewichtungConfig, system);
            const istAktiv = f.id === fachId;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setFachId(f.id);
                  setProben([]);
                  setProbePunkte("");
                  setZiel("");
                }}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-[background-color,border-color] ${
                  istAktiv
                    ? "border-brand/40 bg-brand/10"
                    : "border-transparent bg-surface-2 hover:bg-surface-3"
                }`}
              >
                {f.farbe ? (
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: f.farbe }} />
                ) : (
                  <span className="size-2.5 shrink-0 rounded-full bg-surface-3" />
                )}
                <span
                  className={`flex-1 truncate font-sans text-sm font-semibold ${
                    istAktiv ? "text-brand" : "text-foreground"
                  }`}
                >
                  {f.name}
                </span>
                {f.niveau === "erhoeht" && (
                  <span className="font-mono text-[9px] font-bold text-brand opacity-70">LK</span>
                )}
                <span
                  className="font-mono text-sm font-bold tabular-nums"
                  style={{ color: schnittFarbe(schnitt, system) }}
                >
                  {fmt(schnitt)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fach-Panel */}
        {fach && (
          <div className="animate-fade-up space-y-4">
            {/* Fach-Schnitt Card */}
            <div
              className="rounded-[24px] border p-5"
              style={{
                background: "var(--card-grad)",
                borderColor: fach.farbe
                  ? `color-mix(in srgb, ${fach.farbe} 40%, transparent)`
                  : "var(--border)",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    {fach.farbe && (
                      <span className="size-3 rounded-full" style={{ background: fach.farbe }} />
                    )}
                    <span className="font-display text-2xl font-extrabold">{fach.name}</span>
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
                  <div className="flex items-baseline gap-2">
                    <span
                      className="font-display text-4xl font-extrabold"
                      style={{ color: schnittFarbe(istSchnittFach, system) }}
                    >
                      {fmt(istSchnittFach)}
                    </span>
                    {proben.length > 0 && (
                      <>
                        <span className="text-xl text-text-mute">→</span>
                        <span
                          className="font-display text-4xl font-extrabold"
                          style={{ color: schnittFarbe(mitProbenFach, system) }}
                        >
                          {fmt(mitProbenFach)}
                        </span>
                        <DeltaBadge vorher={istSchnittFach} nachher={mitProbenFach} />
                      </>
                    )}
                  </div>
                  {proben.length > 0 && (
                    <div className="mt-1 font-mono text-xs text-text-dim">
                      Gesamtschnitt: {fmt(gesamtVorher)} →{" "}
                      <span style={{ color: schnittFarbe(gesamtNachherEinzel, system) }}>
                        {fmt(gesamtNachherEinzel)}
                      </span>
                      <DeltaBadge vorher={gesamtVorher} nachher={gesamtNachherEinzel} />
                    </div>
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
                  <span
                    className="w-8 text-right font-mono text-xs font-bold tabular-nums"
                    style={{ color: schnittFarbe(istSchnittFach, system) }}
                  >
                    {fmt(istSchnittFach)}
                  </span>
                </div>
                {proben.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-16 font-mono text-[10px] text-text-mute">Fiktiv</span>
                    <SchnittBalken wert={mitProbenFach} />
                    <span
                      className="w-8 text-right font-mono text-xs font-bold tabular-nums"
                      style={{ color: schnittFarbe(mitProbenFach, system) }}
                    >
                      {fmt(mitProbenFach)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Probe-Noten simulieren */}
            <div
              className="rounded-[24px] border border-border p-5"
              style={{ background: "var(--card-grad)" }}
            >
              <div className="mb-4">
                <div className="font-display text-base font-extrabold">Noten simulieren</div>
                <div className="mt-0.5 font-mono text-xs text-text-mute">
                  Tipp eine fiktive Note — Fachschnitt und Gesamtschnitt aktualisieren sich sofort.
                </div>
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
                      <span className="opacity-60">{katKuerzel(p.kategorie, custom)}</span>
                      <span className="text-xs">×</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mb-3">
                <KategorieSelector value={probeKat} onChange={setProbeKat} />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {quickWerte.map((p) => (
                    <button
                      key={p}
                      onClick={() => addProbe(p)}
                      className="min-w-[2.5rem] rounded-xl border border-border bg-surface-2 px-2 py-1.5 font-mono text-sm font-bold transition-colors hover:border-brand/40 hover:bg-brand/10"
                      style={{ color: schnittFarbe(p, system) }}
                    >
                      {system.formatNote(p)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    {...noteEingabeProps(system)}
                    value={probePunkte}
                    onChange={(e) => setProbePunkte(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addProbe()}
                    placeholder={`Andere (${system.eingabeHinweis})`}
                    className="h-10 flex-1 bg-surface-2 font-mono"
                  />
                  <Button onClick={() => addProbe()} className="h-10 font-display font-bold">
                    Eintragen
                  </Button>
                </div>
              </div>
            </div>

            {/* Was muss ich im Fach schreiben? */}
            <div
              className="rounded-[24px] border border-border p-5"
              style={{ background: "var(--card-grad)" }}
            >
              <div className="mb-4">
                <div className="font-display text-base font-extrabold">
                  Was muss ich in {fach.name} schreiben?
                </div>
                <div className="mt-0.5 font-mono text-xs text-text-mute">
                  Ziel-Fachschnitt wählen — ich rechne aus, was du mindestens in der nächsten Note
                  brauchst.
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {quickWerte.filter((v) => v > system.min).map((z) => (
                  <button
                    key={z}
                    onClick={() => setZiel(system.formatNote(z))}
                    className={`min-w-[2.5rem] rounded-xl border px-2 py-1.5 font-mono text-sm font-bold transition-colors ${
                      zielPunkte === z
                        ? "border-brand bg-brand/15 text-brand"
                        : "border-border bg-surface-2 hover:border-brand/40 hover:bg-brand/10"
                    }`}
                    style={{ color: zielPunkte === z ? undefined : schnittFarbe(z, system) }}
                  >
                    {system.formatSchnitt(z)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  {...noteEingabeProps(system)}
                  value={ziel}
                  onChange={(e) => setZiel(e.target.value)}
                  placeholder={`Zielschnitt (${system.eingabeHinweis})`}
                  className="h-10 w-36 bg-surface-2 font-mono"
                />
                <span className="font-mono text-sm text-text-dim">via</span>
                <KategorieSelector value={zielKat} onChange={setZielKat} />
              </div>
              {ergebnis !== null && (
                <div className="mt-5">
                  {ergebnis === "erreicht" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <span className="text-2xl">🎉</span>
                      <div>
                        <div className="font-display font-bold text-emerald-400">Ziel schon erreicht!</div>
                        <div className="font-mono text-xs text-text-dim">
                          Dein Schnitt liegt bereits bei oder über {ziel}.
                        </div>
                      </div>
                    </div>
                  ) : ergebnis === "unmoeglich" ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                      <span className="text-2xl">💀</span>
                      <div>
                        <div className="font-display font-bold text-red-400">
                          Mit einer Note nicht erreichbar
                        </div>
                        <div className="font-mono text-xs text-text-dim">
                          Selbst mit der Bestnote ({system.formatNote(system.max)}) würdest du {ziel} nicht erreichen. Du
                          brauchst mehrere gute Noten.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
                      <div
                        className="flex size-14 shrink-0 items-center justify-center rounded-2xl font-display text-3xl font-extrabold"
                        style={{
                          background: `color-mix(in srgb, ${schnittFarbe(ergebnis, system)} 20%, transparent)`,
                          color: schnittFarbe(ergebnis, system),
                        }}
                      >
                        {ergebnis}
                      </div>
                      <div>
                        <div className="font-display font-bold">
                          Mindestens{" "}
                          <span style={{ color: schnittFarbe(ergebnis, system) }}>
                            {ergebnis} Punkte
                          </span>
                        </div>
                        <div className="font-mono text-xs text-text-dim">
                          {system.formatNote(ergebnis)} — dann erreichst du Schnitt {ziel} in{" "}
                          {fach.name}.
                        </div>
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
