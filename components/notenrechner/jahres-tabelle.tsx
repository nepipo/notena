"use client";

import { punkteZuNote } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import type { JahresUebersicht } from "@/lib/grades/jahr";

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function Zelle({ wert }: { wert: number | null }) {
  return (
    <td className="px-4 py-3 text-right">
      <span className="font-mono font-semibold" style={{ color: schnittFarbe(wert) }}>
        {fmt(wert)}
      </span>
      {wert !== null && (
        <div className="font-mono text-[10px] text-text-mute">{punkteZuNote(wert)}</div>
      )}
    </td>
  );
}

export function JahresTabelle({
  uebersicht,
  schuljahr,
}: {
  uebersicht: JahresUebersicht;
  schuljahr: string;
}) {
  const leer = uebersicht.zeilen.length === 0;

  return (
    <>
      {/* Hero: Jahresschnitt */}
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
            Jahresschnitt · {schuljahr}
          </div>
          <div className="mt-3 flex items-end">
            <span
              className="font-display text-[110px] font-extrabold leading-[0.85] tracking-[-0.06em]"
              style={{ color: schnittFarbe(uebersicht.gesamtJahr) }}
            >
              {fmt(uebersicht.gesamtJahr)}
            </span>
            <span className="mb-3 ml-1 text-3xl font-medium text-text-mute">/15</span>
          </div>
          {uebersicht.gesamtJahr !== null && (
            <div className="mt-2 font-mono text-sm text-text-dim">
              Note {punkteZuNote(uebersicht.gesamtJahr)} · Durchschnitt beider Halbjahre
            </div>
          )}
        </div>
      </section>

      {/* Tabelle */}
      <section
        className="lift animate-fade-up mt-4 overflow-hidden rounded-3xl border border-border"
        style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
      >
        {leer ? (
          <p className="p-6 font-mono text-sm text-text-mute">
            Noch keine Daten für dieses Schuljahr — leg Fächer &amp; Noten an.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[.15em] text-text-mute">
                  Fach
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[.15em] text-text-mute">
                  1. HJ
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[.15em] text-text-mute">
                  2. HJ
                </th>
                <th className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-[.15em] text-text-mute">
                  Jahr
                </th>
              </tr>
            </thead>
            <tbody>
              {uebersicht.zeilen.map((z) => (
                <tr key={z.name} className="border-b border-border last:border-none">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 font-display font-bold">
                      {z.farbe && (
                        <span
                          className="inline-block size-2.5 rounded-full"
                          style={{ background: z.farbe }}
                        />
                      )}
                      {z.name}
                      {z.niveau && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${
                            z.niveau === "erhoeht"
                              ? "bg-brand/15 text-brand"
                              : "bg-surface-3 text-text-dim"
                          }`}
                        >
                          {z.niveau === "erhoeht" ? "LK" : "GK"}
                        </span>
                      )}
                    </span>
                  </td>
                  <Zelle wert={z.hj1} />
                  <Zelle wert={z.hj2} />
                  <Zelle wert={z.jahr} />
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)" }}>
                <td className="px-4 py-3 font-display text-base font-extrabold">Gesamt</td>
                <Zelle wert={uebersicht.gesamtHj1} />
                <Zelle wert={uebersicht.gesamtHj2} />
                <Zelle wert={uebersicht.gesamtJahr} />
              </tr>
            </tfoot>
          </table>
        )}
      </section>
    </>
  );
}
