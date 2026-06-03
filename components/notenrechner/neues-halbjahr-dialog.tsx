"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { neuesHalbjahr, type NeuesFachInput } from "@/app/dashboard/actions";
import { halbjahrLabel } from "@/lib/grades/halbjahr";
import type { Fach } from "@/lib/grades/types";

interface FachAuswahl {
  uebernehmen: boolean;
  klausurProzent: number;
  fach: Fach;
}

export function NeuesHalbjahrDialog({
  open,
  onClose,
  vorschlagHj,
  aktuelleFaecher,
}: {
  open: boolean;
  onClose: () => void;
  vorschlagHj: string;
  aktuelleFaecher: Fach[];
}) {
  const [hj, setHj] = useState(vorschlagHj);
  const [auswahl, setAuswahl] = useState<FachAuswahl[]>(
    aktuelleFaecher.map((f) => ({
      uebernehmen: true,
      klausurProzent: Math.round((f.gewichtung?.klausur ?? 0.5) * 100),
      fach: f,
    })),
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(i: number) {
    setAuswahl((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, uebernehmen: !a.uebernehmen } : a)),
    );
  }

  function setProzent(i: number, value: number) {
    setAuswahl((prev) =>
      prev.map((a, idx) =>
        idx === i ? { ...a, klausurProzent: Math.min(100, Math.max(0, value)) } : a,
      ),
    );
  }

  function erstellen() {
    const ziel = hj.trim();
    if (!ziel) {
      toast.error("Bitte ein Halbjahr angeben.");
      return;
    }
    const faecher: NeuesFachInput[] = auswahl
      .filter((a) => a.uebernehmen)
      .map((a) => ({
        name: a.fach.name,
        niveau: a.fach.niveau ?? "grund",
        farbe: a.fach.farbe ?? null,
        gewicht_klausur: a.klausurProzent / 100,
        gewicht_muendlich: (100 - a.klausurProzent) / 100,
        fach_gewicht: a.fach.fachGewicht ?? 1,
      }));
    startTransition(async () => {
      const res = await neuesHalbjahr(ziel, faecher);
      if (!res.ok) {
        toast.error(`Konnte nicht erstellt werden: ${res.error}`);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-border bg-surface-1 p-6 shadow-2xl">
          <Dialog.Title className="font-display text-xl font-extrabold">
            Neues Halbjahr anlegen
          </Dialog.Title>
          <p className="mt-1 text-sm text-text-dim">
            Welche Fächer nimmst du mit? Noten werden nicht kopiert.
          </p>

          {/* Halbjahr-Eingabe */}
          <div className="mt-4">
            <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
              Halbjahr (Format JJJJ/JJ-N)
            </div>
            <Input
              value={hj}
              onChange={(e) => setHj(e.target.value)}
              placeholder="2026/27-1"
              className="bg-surface-2 font-mono"
            />
            <p className="mt-1 font-mono text-[11px] text-text-mute">
              {halbjahrLabel(hj)}
            </p>
          </div>

          {/* Fächer-Liste */}
          <div className="mt-4 space-y-2">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
              Fächer übernehmen
            </div>
            {auswahl.length === 0 && (
              <p className="font-mono text-xs text-text-mute">
                Keine Fächer im aktuellen Halbjahr — du startest leer.
              </p>
            )}
            {auswahl.map((a, i) => (
              <div
                key={a.fach.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2"
              >
                <label className="flex flex-1 items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={a.uebernehmen}
                    onChange={() => toggle(i)}
                    className="size-4 accent-brand"
                  />
                  <span
                    className={`font-display font-bold ${a.uebernehmen ? "" : "text-text-mute line-through"}`}
                  >
                    {a.fach.name}
                  </span>
                </label>
                {a.uebernehmen && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-text-dim">
                    Klausur
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={a.klausurProzent}
                      onChange={(e) => setProzent(i, Number(e.target.value))}
                      className="h-7 w-16 bg-surface-1 font-mono text-xs"
                    />
                    %
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-border bg-surface-2"
            >
              Abbrechen
            </Button>
            <Button
              onClick={erstellen}
              disabled={pending}
              className="font-display font-bold"
            >
              {halbjahrLabel(hj).split(" · ")[0]} erstellen
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
