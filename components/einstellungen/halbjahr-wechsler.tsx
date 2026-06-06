"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setHalbjahr } from "@/lib/actions/schule";
import {
  halbjahrLabel,
  naechstesHalbjahr,
  vorherigesHalbjahr,
} from "@/lib/grades/halbjahr";

export function HalbjahrWechsler({ current }: { current: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // 2 zurück, aktuell, 2 vor
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
      toast.success(`Gewechselt zu ${halbjahrLabel(hj)}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((hj) => {
          const aktiv = hj === current;
          return (
            <button
              key={hj}
              onClick={() => wechsle(hj)}
              disabled={isPending}
              className={`rounded-xl border px-3.5 py-2 font-mono text-xs font-semibold transition-all disabled:opacity-50 ${
                aktiv
                  ? "border-brand bg-brand text-black"
                  : "border-border bg-surface-2 text-text-dim hover:border-brand/40 hover:text-foreground"
              }`}
            >
              {halbjahrLabel(hj)}
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[11px] text-text-mute">
        Fächer und Noten sind halbjahrsgebunden — wechsle das Halbjahr um vergangene oder zukünftige Daten zu sehen.
      </p>
    </div>
  );
}
