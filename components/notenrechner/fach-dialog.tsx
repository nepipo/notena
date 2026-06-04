"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateFach } from "@/lib/actions/schule";
import type { Fach } from "@/lib/grades/types";

const PRESET_FARBEN = [
  "#1da1ff", // brand blau
  "#5b6eff", // indigo
  "#5bff8a", // grün
  "#f59e0b", // amber
  "#ff3050", // rot
  "#e879f9", // pink
];

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
  const [niveau, setNiveau] = useState(fach.niveau ?? "grund");
  const [farbe, setFarbe] = useState<string | null>(fach.farbe ?? null);
  const [klausurProzent, setKlausurProzent] = useState(
    Math.round((fach.gewichtung?.klausur ?? 0.5) * 100),
  );
  const [, startTransition] = useTransition();

  function save() {
    const kl = Math.min(100, Math.max(0, klausurProzent));
    const fachGewicht = niveau === "erhoeht" ? 2 : 1;
    onUpdate({
      niveau,
      farbe,
      fachGewicht,
      gewichtung: { klausur: kl / 100, muendlich: (100 - kl) / 100, sonstige: 0 },
    });
    onClose();
    startTransition(async () => {
      const res = await updateFach(fach.id, {
        niveau,
        farbe,
        fach_gewicht: fachGewicht,
        gewicht_klausur: kl / 100,
        gewicht_muendlich: (100 - kl) / 100,
      });
      if (!res.ok) toast.error(`Konnte nicht gespeichert werden: ${res.error}`);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border bg-surface-1 p-6 shadow-2xl">
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

          {/* Gewichtung */}
          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
              Gewichtung
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 font-mono text-sm text-text-dim">Klausur</span>
              <input
                type="range"
                min={0}
                max={100}
                value={klausurProzent}
                onChange={(e) => setKlausurProzent(Number(e.target.value))}
                className="flex-1 accent-brand"
              />
              <span className="w-12 text-right font-mono text-sm font-bold text-brand">
                {klausurProzent}%
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="w-20 font-mono text-sm text-text-dim">Mündlich</span>
              <div className="h-1 flex-1 rounded bg-surface-3" />
              <span className="w-12 text-right font-mono text-sm text-text-dim">
                {100 - klausurProzent}%
              </span>
            </div>
          </div>

          {/* Farbe */}
          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
              Farbe
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setFarbe(null)}
                className={`size-8 rounded-full border-2 bg-surface-3 transition-transform ${
                  farbe === null ? "scale-110 border-foreground" : "border-border"
                }`}
                title="Keine Farbe"
              />
              {PRESET_FARBEN.map((f) => (
                <button
                  key={f}
                  onClick={() => setFarbe(f)}
                  className={`size-8 rounded-full border-2 transition-transform ${
                    farbe === f ? "scale-110 border-foreground" : "border-transparent"
                  }`}
                  style={{ background: f }}
                  title={f}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border bg-surface-2"
            >
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
