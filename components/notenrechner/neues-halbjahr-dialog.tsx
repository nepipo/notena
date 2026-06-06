"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { neuesHalbjahr, type NeuesFachInput } from "@/lib/actions/schule";
import { baueHalbjahr, halbjahrLabel } from "@/lib/grades/halbjahr";
import type { Fach, GewichtungConfig } from "@/lib/grades/types";
import { DEFAULT_GEWICHTUNG_CONFIG } from "@/lib/grades/types";

function zerlege(hj: string): { startjahr: number; nummer: 1 | 2 } {
  const m = /^(\d{4})\/\d{2}-([12])$/.exec(hj);
  if (m) return { startjahr: Number(m[1]), nummer: Number(m[2]) as 1 | 2 };
  return { startjahr: new Date().getFullYear(), nummer: 1 };
}

function gewichtungKurztext(c?: GewichtungConfig): string {
  const cfg = c ?? DEFAULT_GEWICHTUNG_CONFIG;
  if (cfg.klausurDynamisch) {
    return `K: ${Math.round(cfg.klausurPro * 100)}%/Stk · max ${cfg.klausurMax}`;
  }
  const parts: string[] = [];
  if (cfg.klausur > 0) parts.push(`K ${Math.round(cfg.klausur * 100)}%`);
  if (cfg.test > 0) parts.push(`T ${Math.round(cfg.test * 100)}%`);
  if (cfg.muendlich > 0) parts.push(`M ${Math.round(cfg.muendlich * 100)}%`);
  if (cfg.referat > 0) parts.push(`R ${Math.round(cfg.referat * 100)}%`);
  if (cfg.hausaufgabe > 0) parts.push(`HA ${Math.round(cfg.hausaufgabe * 100)}%`);
  if (cfg.sonstige > 0) parts.push(`S ${Math.round(cfg.sonstige * 100)}%`);
  return parts.join(" · ") || "Standard";
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
  const initial = zerlege(vorschlagHj);
  const [startjahr, setStartjahr] = useState(initial.startjahr);
  const [nummer, setNummer] = useState<1 | 2>(initial.nummer);
  const hj = baueHalbjahr(startjahr, nummer);
  const [auswahl, setAuswahl] = useState<{ uebernehmen: boolean; fach: Fach }[]>(
    aktuelleFaecher.map((f) => ({ uebernehmen: true, fach: f })),
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(i: number) {
    setAuswahl((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, uebernehmen: !a.uebernehmen } : a)),
    );
  }

  function erstellen() {
    const ziel = hj.trim();
    if (!ziel) { toast.error("Bitte ein Halbjahr angeben."); return; }
    const faecher: NeuesFachInput[] = auswahl
      .filter((a) => a.uebernehmen)
      .map((a) => {
        const cfg = a.fach.gewichtungConfig ?? DEFAULT_GEWICHTUNG_CONFIG;
        return {
          name: a.fach.name,
          niveau: a.fach.niveau ?? "grund",
          farbe: a.fach.farbe ?? null,
          fach_gewicht: a.fach.fachGewicht ?? 1,
          gewicht_klausur: cfg.klausurDynamisch ? 0 : cfg.klausur,
          gewicht_muendlich: cfg.muendlich + cfg.test + cfg.referat + cfg.hausaufgabe + cfg.sonstige,
          gewichtung_config: cfg,
        };
      });
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
            Welche Fächer nimmst du mit? Noten werden nicht kopiert, Gewichtung wird übernommen.
          </p>

          {/* Halbjahr-Auswahl */}
          <div className="mt-4 flex gap-3">
            <div className="flex-1">
              <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
                Schuljahr
              </div>
              <select
                value={startjahr}
                onChange={(e) => setStartjahr(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm"
              >
                {Array.from({ length: 6 }, (_, i) => initial.startjahr - 2 + i).map((jahr) => (
                  <option key={jahr} value={jahr}>
                    {baueHalbjahr(jahr, 1).split("-")[0]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
                Halbjahr
              </div>
              <div className="flex overflow-hidden rounded-lg border border-border">
                {([1, 2] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setNummer(n)}
                    className={`flex-1 py-2 font-mono text-sm transition-colors ${
                      nummer === n
                        ? "bg-brand font-semibold text-black"
                        : "bg-surface-2 text-text-dim hover:bg-surface-3"
                    }`}
                  >
                    {n}.
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2 font-mono text-[11px] text-text-mute">
            → {halbjahrLabel(hj)}
          </p>

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
              <label
                key={a.fach.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5 transition-colors hover:bg-surface-3"
              >
                <input
                  type="checkbox"
                  checked={a.uebernehmen}
                  onChange={() => toggle(i)}
                  className="size-4 accent-brand"
                />
                <div className="flex-1 min-w-0">
                  <span className={`font-display font-bold ${a.uebernehmen ? "" : "text-text-mute line-through"}`}>
                    {a.fach.name}
                  </span>
                  {a.uebernehmen && (
                    <div className="mt-0.5 font-mono text-[10px] text-text-mute truncate">
                      {gewichtungKurztext(a.fach.gewichtungConfig)}
                    </div>
                  )}
                </div>
                {a.fach.niveau && (
                  <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase ${
                    a.fach.niveau === "erhoeht"
                      ? "bg-brand/15 text-brand"
                      : "bg-surface-3 text-text-dim"
                  }`}>
                    {a.fach.niveau === "erhoeht" ? "LK" : "GK"}
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="border-border bg-surface-2">
              Abbrechen
            </Button>
            <Button onClick={erstellen} disabled={pending} className="font-display font-bold">
              {pending ? "Wird erstellt…" : `${halbjahrLabel(hj).split(" · ")[0]} erstellen`}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
