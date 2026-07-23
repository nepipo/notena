"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setHalbjahr, loescheHalbjahr } from "@/lib/actions/schule";
import {
  halbjahrLabel,
  naechstesHalbjahr,
  vorherigesHalbjahr,
} from "@/lib/grades/halbjahr";

export function HalbjahrWechsler({ current }: { current: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const router = useRouter();

  const hj2back = vorherigesHalbjahr(vorherigesHalbjahr(current));
  const hj1back = vorherigesHalbjahr(current);
  const hj1next = naechstesHalbjahr(current);
  const hj2next = naechstesHalbjahr(naechstesHalbjahr(current));
  const options = [hj2back, hj1back, current, hj1next, hj2next];

  function wechsle(hj: string) {
    if (hj === current || isPending) return;
    startTransition(async () => {
      const res = await setHalbjahr(hj);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  function loesche(hj: string) {
    if (isPending) return;
    setConfirmDelete(null);
    startTransition(async () => {
      const res = await loescheHalbjahr(hj);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((hj) => {
          const aktiv = hj === current;
          return (
            <div key={hj} className="relative">
              <button
                onClick={() => {
                  if (confirmDelete === hj) {
                    setConfirmDelete(null);
                  } else {
                    wechsle(hj);
                  }
                }}
                disabled={isPending}
                className={`rounded-xl border px-3.5 py-2 pr-8 font-mono text-xs font-semibold transition-[background-color,border-color,color,opacity] disabled:opacity-50 ${
                  aktiv
                    ? "border-brand bg-primary text-primary-foreground"
                    : "border-border bg-surface-2 text-text-dim hover:border-brand/40 hover:text-foreground"
                }`}
              >
                {halbjahrLabel(hj)}
              </button>
              {/* Trash icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(confirmDelete === hj ? null : hj);
                }}
                disabled={isPending}
                title={`${halbjahrLabel(hj)} löschen`}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-mute transition-colors hover:text-red-400 disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="size-3"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* Bestätigungs-Banner */}
      {confirmDelete && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
          <p className="mb-2.5 font-mono text-xs font-semibold text-red-400">
            ⚠ Alle Fächer und Noten für{" "}
            <span className="text-red-300">{halbjahrLabel(confirmDelete)}</span>{" "}
            werden unwiderruflich gelöscht.
            {confirmDelete === current && (
              <span className="block mt-1 text-red-300">
                Das ist dein aktives Halbjahr — du wirst danach automatisch ins vorherige gewechselt.
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loesche(confirmDelete)}
              disabled={isPending}
              className="rounded-lg bg-red-500 px-3 py-1.5 font-mono text-xs font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              Löschen bestätigen
            </button>
            <button
              onClick={() => setConfirmDelete(null)}
              disabled={isPending}
              className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-mono text-xs font-semibold text-text-dim transition-colors hover:text-foreground disabled:opacity-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      <p className="font-mono text-[11px] text-text-mute">
        Fächer und Noten sind halbjahrsgebunden — wechsle das Halbjahr um vergangene oder zukünftige Daten zu sehen.
      </p>
    </div>
  );
}
