"use client";

import { useEffect, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import { useNotensystem } from "@/components/notensystem-provider";

interface Props {
  gesamt: number | null;
  faecherAnzahl: number;
  animationDelay?: string;
}

export function SchnittKarte({ gesamt, faecherAnzahl, animationDelay }: Props) {
  const [mounted, setMounted] = useState(false);
  const system = useNotensystem();
  const range = system.max - system.min;

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const farbe = schnittFarbe(gesamt, system);

  return (
    <section
      className="glass-panel lift animate-fade-up card-glow relative overflow-hidden rounded-3xl border border-border p-8"
      style={{
        background: "var(--hero-grad)",
        animationDelay,
      }}
    >
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
        Gesamtschnitt
      </div>
      <div className="mt-3 flex items-end">
        {gesamt !== null ? (
          system.id === "de_0_15" ? (
            <>
              <AnimatedNumber
                value={gesamt}
                decimals={1}
                durationMs={1400}
                delayMs={300}
                className="font-display text-[60px] font-extrabold leading-[0.85] tracking-[-0.06em] sm:text-[88px]"
                style={{ color: farbe }}
              />
              <span className="mb-2 ml-1 text-2xl font-medium text-text-mute">/15</span>
            </>
          ) : (
            <span
              className="font-display text-[60px] font-extrabold leading-[0.85] tracking-[-0.06em] sm:text-[88px]"
              style={{ color: farbe }}
            >
              {system.formatSchnitt(gesamt)}
            </span>
          )
        ) : (
          <span className="font-display text-[60px] font-extrabold leading-[0.85] tracking-[-0.06em] text-text-mute sm:text-[88px]">
            –
          </span>
        )}
      </div>
      {gesamt !== null ? (
        <>
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full transition-[width] duration-[1200ms]"
              style={{
                width: mounted ? `${((gesamt - system.min) / range) * 100}%` : "0%",
                background: farbe,
                transitionTimingFunction: "var(--ease-out)",
              }}
            />
          </div>
          <div className="mt-2 font-mono text-sm text-text-dim">
            Schnitt {system.formatSchnitt(gesamt)} · {faecherAnzahl} Fächer
          </div>
        </>
      ) : (
        <p className="mt-4 font-mono text-sm text-text-mute">
          Noch keine Noten eingetragen.
        </p>
      )}
    </section>
  );
}
