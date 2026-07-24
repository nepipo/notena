"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, TrendingUp, TrendingDown } from "lucide-react";
import { getNotensystem } from "@/lib/grades/systems";
import type { TrendPunkt, TrendSerie, Prognose } from "@/lib/grades/trend";
import { cn } from "@/lib/utils";

type Props = {
  gesamt: TrendPunkt[];
  proFach: TrendSerie[];
  prognose: Prognose | null;
  pro: boolean;
  systemId: string;
};

// SVG-Koordinatensystem (skaliert responsiv über viewBox mit).
const W = 640;
const H = 240;
const PAD = { l: 34, r: 14, t: 16, b: 26 };
const TICKS = [0, 5, 10, 15]; // kanonische Punkte

export function TrendChart({ gesamt, proFach, prognose, pro, systemId }: Props) {
  const system = useMemo(() => getNotensystem(systemId), [systemId]);
  const [selected, setSelected] = useState<string>("gesamt");

  const istGesamt = selected === "gesamt";
  const serie = useMemo(
    () =>
      istGesamt ? gesamt : (proFach.find((s) => s.fachId === selected)?.punkte ?? []),
    [istGesamt, gesamt, proFach, selected],
  );

  // Prognose-Linie nur in der Gesamt-Ansicht und nur für Pro.
  const zeigePrognoseLinie = istGesamt && pro && prognose !== null;

  const geo = useMemo(() => {
    const alleDaten = serie.map((p) => Date.parse(p.datum));
    if (zeigePrognoseLinie) alleDaten.push(Date.parse(prognose!.datum));
    const minX = Math.min(...alleDaten);
    const maxX = Math.max(...alleDaten);
    const spanX = maxX - minX || 1;

    const px = (datum: string) =>
      PAD.l + ((Date.parse(datum) - minX) / spanX) * (W - PAD.l - PAD.r);
    const py = (schnitt: number) =>
      PAD.t + (1 - schnitt / system.max) * (H - PAD.t - PAD.b);

    return { px, py, single: serie.length === 1 };
  }, [serie, zeigePrognoseLinie, prognose, system.max]);

  if (gesamt.length === 0) {
    return (
      <div className="rounded-3xl border border-border p-6" style={{ background: "var(--card-grad)" }}>
        <Kopf />
        <p className="mt-4 text-sm text-text-dim">
          Noch kein Verlauf — trag ein paar Noten ein, dann siehst du hier, wie sich dein
          Schnitt über die Zeit entwickelt.
        </p>
      </div>
    );
  }

  const farbe = istGesamt
    ? "var(--brand)"
    : (proFach.find((s) => s.fachId === selected)?.farbe ?? "var(--brand)");
  const letzter = serie[serie.length - 1];
  const linie = serie.map((p, i) => `${i === 0 ? "M" : "L"} ${geo.px(p.datum)} ${geo.py(p.schnitt)}`).join(" ");

  return (
    <div className="rounded-3xl border border-border p-6" style={{ background: "var(--card-grad)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Kopf />
        {letzter && (
          <div className="text-right">
            <div className="font-display text-2xl font-extrabold leading-none" style={{ color: farbe }}>
              {system.formatSchnitt(letzter.schnitt)}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-text-mute">
              Note {system.formatNote(letzter.schnitt)}
            </div>
          </div>
        )}
      </div>

      {/* Fach-Umschalter */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Chip aktiv={istGesamt} onClick={() => setSelected("gesamt")} farbe="var(--brand)">
          Schnitt
        </Chip>
        {proFach.map((s) => (
          <Chip
            key={s.fachId}
            aktiv={selected === s.fachId}
            onClick={() => setSelected(s.fachId)}
            farbe={s.farbe ?? "var(--brand)"}
          >
            {s.name}
          </Chip>
        ))}
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label="Notenverlauf">
        {/* Gridlines + Y-Labels */}
        {TICKS.map((t) => {
          const y = PAD.t + (1 - t / system.max) * (H - PAD.t - PAD.b);
          return (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.l - 6} y={y + 3} textAnchor="end" className="fill-[var(--text-mute)] font-mono text-[10px]">
                {t}
              </text>
            </g>
          );
        })}

        {/* Prognose-Fortschreibung (gestrichelt) */}
        {zeigePrognoseLinie && letzter && (
          <>
            <line
              x1={geo.px(letzter.datum)} y1={geo.py(letzter.schnitt)}
              x2={geo.px(prognose!.datum)} y2={geo.py(prognose!.schnitt)}
              stroke={farbe} strokeWidth={2} strokeDasharray="5 5" opacity={0.6}
            />
            <circle cx={geo.px(prognose!.datum)} cy={geo.py(prognose!.schnitt)} r={4} fill="none" stroke={farbe} strokeWidth={2} />
          </>
        )}

        {/* Verlaufslinie */}
        {!geo.single && <path d={linie} fill="none" stroke={farbe} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {serie.map((p) => (
          <circle key={p.datum} cx={geo.px(p.datum)} cy={geo.py(p.schnitt)} r={geo.single ? 5 : 3.5} fill={farbe}>
            <title>{`${p.datum}: ${system.formatSchnitt(p.schnitt)}`}</title>
          </circle>
        ))}
      </svg>

      {/* Prognose-Strip — Pro-Feature */}
      {istGesamt && <PrognoseStrip prognose={prognose} pro={pro} system={system} />}
    </div>
  );
}

function Kopf() {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
        <TrendingUp className="size-3" /> Verlauf
      </div>
      <h2 className="font-display text-lg font-extrabold leading-none">Dein Notenverlauf</h2>
    </div>
  );
}

function Chip({ children, aktiv, onClick, farbe }: { children: React.ReactNode; aktiv: boolean; onClick: () => void; farbe: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        aktiv ? "border-transparent bg-brand/15 text-brand" : "border-border text-text-dim hover:text-text",
      )}
    >
      <span className="size-2 rounded-full" style={{ background: farbe }} />
      {children}
    </button>
  );
}

function PrognoseStrip({ prognose, pro, system }: { prognose: Prognose | null; pro: boolean; system: ReturnType<typeof getNotensystem> }) {
  // Gesperrt für Free-User: Teaser mit Pro-CTA.
  if (!pro) {
    return (
      <Link
        href="/pro"
        className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-4 transition-colors hover:border-brand/40"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
          <Lock className="size-4 text-brand" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            Abi-Prognose
            <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">Pro</span>
          </div>
          <div className="truncate text-xs text-text-dim">Sieh, wo du bei diesem Tempo landest.</div>
        </div>
        <span className="ml-auto shrink-0 text-xs text-text-mute">freischalten →</span>
      </Link>
    );
  }

  if (!prognose) {
    return (
      <p className="mt-4 rounded-2xl border border-border bg-card/50 p-4 text-xs text-text-dim">
        Für eine Prognose brauchst du mindestens 4 Noten mit Datum. Trag weiter ein — dann
        schreiben wir deinen Trend fort.
      </p>
    );
  }

  const steigt = prognose.proMonat >= 0;
  const Pfeil = steigt ? TrendingUp : TrendingDown;
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-brand/25 bg-brand/5 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
        <Pfeil className={cn("size-4", steigt ? "text-success" : "text-destructive")} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">
          Prognose in ~4 Wochen: {system.formatSchnitt(prognose.schnitt)}{" "}
          <span className="text-text-dim">(Note {system.formatNote(prognose.schnitt)})</span>
        </div>
        <div className="text-xs text-text-dim">
          Trend: {steigt ? "+" : "−"}
          {Math.abs(prognose.proMonat).toLocaleString("de-DE")} Punkte pro Monat
        </div>
      </div>
    </div>
  );
}
