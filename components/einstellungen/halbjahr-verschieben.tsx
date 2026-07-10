"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { verschiebeHalbjahr } from "@/lib/actions/schule";
import {
  halbjahrLabel,
  naechstesHalbjahr,
  vorherigesHalbjahr,
} from "@/lib/grades/halbjahr";

export type HalbjahrInfo = { hj: string; faecher: number; noten: number };

/** Ziel-Kandidaten: jedes bekannte Halbjahr + je zwei Nachbarn davor/danach,
 *  ohne die Quelle. So ist der angrenzende (leere) Slot immer dabei. */
function zielKandidaten(halbjahre: HalbjahrInfo[], quelle: string): string[] {
  const set = new Set<string>();
  for (const h of halbjahre) {
    set.add(h.hj);
    set.add(vorherigesHalbjahr(h.hj));
    set.add(vorherigesHalbjahr(vorherigesHalbjahr(h.hj)));
    set.add(naechstesHalbjahr(h.hj));
    set.add(naechstesHalbjahr(naechstesHalbjahr(h.hj)));
  }
  set.delete(quelle);
  return Array.from(set).sort();
}

const selectClass =
  "rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground transition-colors hover:border-brand/40 focus:border-brand focus:outline-none";

export function HalbjahrVerschieben({
  halbjahre,
  aktuell,
}: {
  halbjahre: HalbjahrInfo[];
  aktuell: string;
}) {
  const belegte = useMemo(
    () => halbjahre.filter((h) => h.faecher > 0),
    [halbjahre],
  );
  const countMap = useMemo(
    () => new Map(halbjahre.map((h) => [h.hj, h])),
    [halbjahre],
  );

  const [quelle, setQuelle] = useState(
    () =>
      belegte.find((h) => h.hj === aktuell)?.hj ?? belegte[0]?.hj ?? "",
  );
  const kandidaten = useMemo(
    () => zielKandidaten(halbjahre, quelle),
    [halbjahre, quelle],
  );
  const [ziel, setZiel] = useState(() => kandidaten[0] ?? "");
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (belegte.length === 0) {
    return (
      <p className="font-mono text-[11px] text-text-mute">
        Noch keine Fächer angelegt — es gibt nichts zu verschieben.
      </p>
    );
  }

  const zielInfo = countMap.get(ziel);
  const zielBelegt = (zielInfo?.faecher ?? 0) > 0;

  function onQuelleChange(next: string) {
    setQuelle(next);
    setConfirm(false);
    // Ziel neu wählen, falls es jetzt mit der Quelle kollidiert.
    if (ziel === next) {
      setZiel(zielKandidaten(halbjahre, next)[0] ?? "");
    }
  }

  function ausfuehren() {
    if (!quelle || !ziel || quelle === ziel || pending) return;
    startTransition(async () => {
      const res = await verschiebeHalbjahr(quelle, ziel);
      setConfirm(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Verschoben nach ${halbjahrLabel(ziel)}.`);
      router.refresh();
    });
  }

  function klick() {
    if (quelle === ziel) {
      toast.error("Quelle und Ziel dürfen nicht gleich sein.");
      return;
    }
    if (zielBelegt) {
      setConfirm(true); // destruktiv → erst bestätigen
    } else {
      ausfuehren();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={quelle}
          onChange={(e) => onQuelleChange(e.target.value)}
          disabled={pending}
          className={selectClass}
          aria-label="Quell-Halbjahr"
        >
          {belegte.map((h) => (
            <option key={h.hj} value={h.hj}>
              {halbjahrLabel(h.hj)} · {h.faecher} Fächer
            </option>
          ))}
        </select>

        <span className="font-mono text-xs text-text-mute">→</span>

        <select
          value={ziel}
          onChange={(e) => {
            setZiel(e.target.value);
            setConfirm(false);
          }}
          disabled={pending}
          className={selectClass}
          aria-label="Ziel-Halbjahr"
        >
          {kandidaten.map((hj) => {
            const c = countMap.get(hj);
            return (
              <option key={hj} value={hj}>
                {halbjahrLabel(hj)}
                {c && c.faecher > 0 ? ` · ${c.faecher} Fächer` : " · leer"}
              </option>
            );
          })}
        </select>

        <button
          onClick={klick}
          disabled={pending || !quelle || !ziel}
          className="rounded-xl border border-brand/40 bg-brand/10 px-3.5 py-2 font-mono text-xs font-semibold text-brand transition-colors hover:bg-brand/20 disabled:opacity-50"
        >
          Verschieben
        </button>
      </div>

      {/* Bestätigung nur wenn das Ziel überschrieben wird */}
      {confirm && zielInfo && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
          <p className="mb-2.5 font-mono text-xs font-semibold text-red-400">
            ⚠ Die {zielInfo.faecher} Fächer und {zielInfo.noten} Noten in{" "}
            <span className="text-red-300">{halbjahrLabel(ziel)}</span> werden
            gelöscht und durch{" "}
            <span className="text-red-300">{halbjahrLabel(quelle)}</span>{" "}
            ersetzt. Das kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex gap-2">
            <button
              onClick={ausfuehren}
              disabled={pending}
              className="rounded-lg bg-red-500 px-3 py-1.5 font-mono text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              Ersetzen bestätigen
            </button>
            <button
              onClick={() => setConfirm(false)}
              disabled={pending}
              className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs font-semibold text-text-dim transition-colors hover:text-foreground disabled:opacity-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <p className="font-mono text-[11px] text-text-mute">
        Verschiebt alle Fächer samt Noten in ein anderes Halbjahr. Ist das Ziel
        nicht leer, wird sein Inhalt ersetzt.
      </p>
    </div>
  );
}
