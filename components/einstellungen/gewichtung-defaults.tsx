"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveDefaultGewichtung, applyGewichtungAufAlleFaecher } from "@/lib/actions/schule";
import { DEFAULT_GEWICHTUNG_CONFIG } from "@/lib/grades/types";
import type { GewichtungConfig } from "@/lib/grades/types";

const KATEGORIEN_INFO = [
  { key: "klausur" as const, label: "Klausur" },
  { key: "test" as const, label: "Test / LZK" },
  { key: "muendlich" as const, label: "Mündlich" },
  { key: "referat" as const, label: "Referat" },
  { key: "hausaufgabe" as const, label: "Hausaufgabe" },
  { key: "sonstige" as const, label: "Sonstige" },
];

function summe(c: GewichtungConfig): number {
  return c.klausur + c.test + c.muendlich + c.referat + c.hausaufgabe + c.sonstige;
}

function pctStr(v: number): string {
  return Math.round(v * 100).toString();
}

export function GewichtungDefaults({
  initialConfig,
  aktuellesHalbjahr,
}: {
  initialConfig: GewichtungConfig | null;
  aktuellesHalbjahr: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [config, setConfig] = useState<GewichtungConfig>(
    initialConfig ? { ...DEFAULT_GEWICHTUNG_CONFIG, ...initialConfig } : { ...DEFAULT_GEWICHTUNG_CONFIG },
  );

  function setProzent(
    key: keyof Pick<GewichtungConfig, "klausur" | "test" | "muendlich" | "referat" | "hausaufgabe" | "sonstige">,
    pct: string,
  ) {
    const n = parseInt(pct, 10);
    if (!Number.isFinite(n)) return;
    setConfig((p) => ({ ...p, [key]: Math.min(100, Math.max(0, n)) / 100 }));
  }

  function handleSave() {
    start(async () => {
      const res = await saveDefaultGewichtung(config);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Standard-Gewichtung gespeichert.");
      router.refresh();
    });
  }

  function handleApplyAll() {
    start(async () => {
      const [saveRes, applyRes] = await Promise.all([
        saveDefaultGewichtung(config),
        applyGewichtungAufAlleFaecher(config, aktuellesHalbjahr),
      ]);
      if (!saveRes.ok) { toast.error(saveRes.error); return; }
      if (!applyRes.ok) { toast.error(applyRes.error); return; }
      toast.success("Auf alle Fächer des aktuellen Halbjahres angewendet.");
      router.refresh();
    });
  }

  const s = summe(config);
  const summeOk = config.klausurDynamisch || Math.abs(s - 1) < 0.005 || s === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-text-mute">
          Kategorien ohne Noten werden automatisch ignoriert.
        </span>
        {!config.klausurDynamisch && (
          <span className={`font-mono text-[11px] font-bold ${summeOk ? "text-success" : "text-amber-400"}`}>
            Σ {Math.round(s * 100)}%
          </span>
        )}
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-surface-2 p-4">
        {KATEGORIEN_INFO.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="flex-1 font-mono text-xs text-text-dim">{label}</span>
            <Input
              type="number"
              min={0}
              max={100}
              value={pctStr(config[key])}
              onChange={(e) => setProzent(key, e.target.value)}
              className="h-8 w-16 bg-surface-1 text-right font-mono text-sm"
            />
            <span className="w-4 font-mono text-xs text-text-mute">%</span>
          </div>
        ))}
      </div>

      {/* Klausur-Dynamik */}
      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-sans text-sm font-semibold">Klausur-Dynamik</div>
            <div className="font-mono text-[11px] text-text-mute">
              Klausur-Gewicht wächst mit jeder Klausur (bis zum Cap)
            </div>
          </div>
          <button
            onClick={() => setConfig((p) => ({ ...p, klausurDynamisch: !p.klausurDynamisch }))}
            className={`relative h-6 w-11 rounded-full border transition-colors ${
              config.klausurDynamisch ? "border-brand bg-brand" : "border-border bg-surface-3"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                config.klausurDynamisch ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {config.klausurDynamisch && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-3">
              <span className="w-28 font-mono text-xs text-text-dim">Pro Klausur</span>
              <Input
                type="number"
                min={1}
                max={100}
                value={Math.round(config.klausurPro * 100)}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isFinite(n)) setConfig((p) => ({ ...p, klausurPro: n / 100 }));
                }}
                className="h-8 w-16 bg-surface-1 text-right font-mono text-sm"
              />
              <span className="font-mono text-xs text-text-mute">%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 font-mono text-xs text-text-dim">Max Klausuren</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={config.klausurMax}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isFinite(n) && n > 0) setConfig((p) => ({ ...p, klausurMax: n }));
                }}
                className="h-8 w-16 bg-surface-1 text-right font-mono text-sm"
              />
            </div>
            <div className="rounded-lg bg-brand/10 px-3 py-2 font-mono text-[11px] text-brand">
              1 Klausur → {Math.round(config.klausurPro * 100)}% · {config.klausurMax} Klausuren → {config.klausurMax * Math.round(config.klausurPro * 100)}%
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleSave}
          disabled={pending}
          variant="outline"
          className="border-border bg-surface-2 font-display font-bold"
        >
          Speichern
        </Button>
        <Button
          onClick={handleApplyAll}
          disabled={pending}
          className="font-display font-bold"
          title={`Auf alle Fächer in Halbjahr ${aktuellesHalbjahr} anwenden`}
        >
          {pending ? "Wird angewendet…" : "Auf alle Fächer anwenden"}
        </Button>
      </div>
      <p className="font-mono text-[10px] text-text-mute">
        "Auf alle Fächer anwenden" überschreibt die individuelle Gewichtung aller Fächer im aktuellen Halbjahr ({aktuellesHalbjahr}).
      </p>
    </div>
  );
}
