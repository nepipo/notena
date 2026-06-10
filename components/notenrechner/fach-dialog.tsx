"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateFach } from "@/lib/actions/schule";
import { DEFAULT_GEWICHTUNG_CONFIG } from "@/lib/grades/types";
import type { Fach, GewichtungConfig } from "@/lib/grades/types";

const PRESET_FARBEN = [
  "#1da1ff", "#5b6eff", "#8b5cf6", "#a855f7", "#e879f9", "#f43f5e",
  "#ff3050", "#f97316", "#f59e0b", "#eab308", "#84cc16", "#22c55e",
  "#5bff8a", "#14b8a6", "#06b6d4",
];

const KATEGORIEN_INFO = [
  { key: "klausur" as const, label: "Klausur" },
  { key: "test" as const, label: "Test / Lernzielkontrolle" },
  { key: "muendlich" as const, label: "Mündlich" },
  { key: "referat" as const, label: "Referat / Präsentation" },
  { key: "hausaufgabe" as const, label: "Hausaufgabe" },
  { key: "sonstige" as const, label: "Sonstige" },
];

function summeKategorien(c: GewichtungConfig): number {
  return c.klausur + c.test + c.muendlich + c.referat + c.hausaufgabe + c.sonstige;
}

function pctStr(val: number): string {
  return Math.round(val * 100).toString();
}

export function FachDialog({
  fach,
  open,
  onClose,
  onUpdate,
}: {
  fach: Fach;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Fach>) => void;
}) {
  const baseConfig = fach.gewichtungConfig ?? DEFAULT_GEWICHTUNG_CONFIG;

  const [niveau, setNiveau] = useState(fach.niveau ?? "grund");
  const [farbe, setFarbe] = useState<string | null>(fach.farbe ?? null);
  const [ausgeschlossen, setAusgeschlossen] = useState(fach.ausgeschlossen ?? false);
  const [config, setConfig] = useState<GewichtungConfig>({ ...baseConfig });
  const [, startTransition] = useTransition();

  function setProzent(key: keyof Pick<GewichtungConfig, "klausur" | "test" | "muendlich" | "referat" | "hausaufgabe" | "sonstige">, pct: string) {
    const n = parseInt(pct, 10);
    if (!Number.isFinite(n)) return;
    setConfig((prev) => ({ ...prev, [key]: Math.min(100, Math.max(0, n)) / 100 }));
  }

  function save() {
    const fachGewicht = niveau === "erhoeht" ? 2 : 1;
    const updates: Partial<Fach> = {
      niveau,
      farbe,
      fachGewicht,
      ausgeschlossen,
      gewichtungConfig: config,
    };
    onUpdate(updates);
    onClose();
    startTransition(async () => {
      const res = await updateFach(fach.id, {
        niveau,
        farbe,
        fach_gewicht: fachGewicht,
        ausgeschlossen,
        gewichtung_config: config,
        // Legacy-Spalten sync
        gewicht_klausur: config.klausurDynamisch ? 0 : config.klausur,
        gewicht_muendlich: config.muendlich + config.test + config.referat + config.hausaufgabe + config.sonstige,
      });
      if (!res.ok) toast.error(`Konnte nicht gespeichert werden: ${res.error}`);
    });
  }

  const summe = summeKategorien(config);
  // Im dynamischen Modus ist der Klausur-Anteil nicht fix → Summencheck irrelevant
  const summeOk = config.klausurDynamisch || Math.abs(summe - 1) < 0.005 || summe === 0;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-surface-1 p-6 shadow-2xl">
          <Dialog.Title className="font-display text-xl font-extrabold">
            {fach.name} konfigurieren
          </Dialog.Title>

          {/* Niveau */}
          <div className="mt-5">
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
              Niveau
            </div>
            <div className="flex gap-2">
              {(["grund", "erhoeht"] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setNiveau(n)}
                  className={`flex-1 rounded-xl border px-4 py-2.5 font-display font-bold transition-colors ${
                    niveau === n
                      ? "border-brand bg-brand text-black"
                      : "border-border bg-surface-2 text-text-dim hover:bg-surface-3"
                  }`}
                >
                  {n === "grund" ? "GK" : "LK"}
                </button>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-text-mute">
              LK zählt doppelt im Gesamtschnitt.
            </p>
          </div>

          {/* Kategorien-Gewichtung */}
          <div className="mt-5">
            <div className="mb-1 flex items-center justify-between">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
                Gewichtung
              </div>
              {!config.klausurDynamisch && (
                <span
                  className={`font-mono text-[11px] font-bold ${
                    summeOk ? "text-success" : "text-amber-400"
                  }`}
                >
                  Σ {Math.round(summe * 100)}%
                </span>
              )}
            </div>
            <p className="mb-3 font-mono text-[11px] text-text-mute">
              Summe sollte 100% ergeben. Kategorien ohne Noten werden automatisch ignoriert.
            </p>

            <div className="space-y-2">
              {KATEGORIEN_INFO.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-44 truncate font-mono text-xs text-text-dim">{label}</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={pctStr(config[key])}
                      onChange={(e) => setProzent(key, e.target.value)}
                      className="h-8 w-16 bg-surface-2 text-right font-mono text-sm"
                    />
                    <span className="font-mono text-xs text-text-mute">%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Klausur-Dynamik */}
            <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-sans text-sm font-semibold">Klausur-Dynamik</div>
                  <div className="font-mono text-[11px] text-text-mute">
                    Klausur-Gewicht wächst mit jeder Klausur (bis zum Cap)
                  </div>
                </div>
                <button
                  onClick={() => setConfig((p) => ({ ...p, klausurDynamisch: !p.klausurDynamisch }))}
                  className={`relative h-6 w-11 overflow-hidden rounded-full border transition-colors ${
                    config.klausurDynamisch
                      ? "border-brand bg-brand"
                      : "border-border bg-surface-3"
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
                  <p className="font-mono text-[11px] text-text-mute">
                    Klausur-Gewicht = min(Anzahl, Max) × Pro-Klausur
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="w-32 font-mono text-xs text-text-dim">Pro Klausur</span>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={Math.round(config.klausurPro * 100)}
                      onChange={(e) => {
                        const n = parseInt(e.target.value, 10);
                        if (Number.isFinite(n)) setConfig((p) => ({ ...p, klausurPro: Math.min(1, Math.max(0, n / 100)) }));
                      }}
                      className="h-8 w-16 bg-surface-1 text-right font-mono text-sm"
                    />
                    <span className="font-mono text-xs text-text-mute">%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-32 font-mono text-xs text-text-dim">Max Klausuren</span>
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
                  <div className="mt-1.5 rounded-lg bg-brand/10 px-3 py-2 font-mono text-[11px] text-brand">
                    1 Klausur → {Math.round(config.klausurPro * 100)}% · {config.klausurMax} Klausuren → {config.klausurMax * Math.round(config.klausurPro * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Farbe */}
          <div className="mt-5">
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
              Farbe
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFarbe(null)}
                className={`size-7 rounded-full border-2 bg-surface-3 transition-transform ${
                  farbe === null ? "scale-110 border-foreground" : "border-border"
                }`}
                title="Keine Farbe"
              />
              {PRESET_FARBEN.map((f) => (
                <button
                  key={f}
                  onClick={() => setFarbe(f)}
                  className={`size-7 rounded-full border-2 transition-transform ${
                    farbe === f ? "scale-110 border-foreground" : "border-transparent"
                  }`}
                  style={{ background: f }}
                />
              ))}
            </div>
          </div>

          {/* Ausschließen */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-surface-2 px-4 py-3">
            <div>
              <div className="font-sans text-sm font-semibold">Aus Schnitt ausschließen</div>
              <div className="font-mono text-[11px] text-text-mute">
                Fach wird angezeigt, zählt aber nicht im Gesamtschnitt
              </div>
            </div>
            <button
              onClick={() => setAusgeschlossen((v) => !v)}
              className={`relative h-6 w-11 overflow-hidden rounded-full border transition-colors ${
                ausgeschlossen ? "border-brand bg-brand" : "border-border bg-surface-3"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                  ausgeschlossen ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="border-border bg-surface-2">
              Abbrechen
            </Button>
            <Button onClick={save} className="font-display font-bold">
              Speichern
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
