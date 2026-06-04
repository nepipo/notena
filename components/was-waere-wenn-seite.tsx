"use client";

import { useState } from "react";
import { WasWaereWennPanel } from "@/components/notenrechner/was-waere-wenn-panel";
import type { Fach } from "@/lib/grades/types";

export function WasWaereWennSeite({ faecher }: { faecher: Fach[] }) {
  const [fachId, setFachId] = useState<string>(faecher[0]?.id ?? "");
  const fach = faecher.find((f) => f.id === fachId) ?? null;

  if (faecher.length === 0) {
    return (
      <p className="font-mono text-sm text-text-mute">
        Noch keine Fächer — leg im Notenrechner erst Fächer &amp; Noten an.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {faecher.map((f) => (
          <button
            key={f.id}
            onClick={() => setFachId(f.id)}
            className={`rounded-lg px-3 py-1.5 font-mono text-sm transition-colors ${
              f.id === fachId
                ? "bg-brand font-semibold text-black"
                : "bg-surface-2 text-text-dim hover:bg-surface-3"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {fach && (
        <section
          className="animate-fade-up rounded-3xl border border-border p-6"
          style={{ background: "var(--card-grad)" }}
        >
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">{fach.name}</h2>
          <WasWaereWennPanel fach={fach} />
        </section>
      )}
    </div>
  );
}
