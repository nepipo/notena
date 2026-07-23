"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setHalbjahr } from "@/lib/actions/schule";
import { halbjahrKurz, halbjahrLabel } from "@/lib/grades/halbjahr";

/**
 * Globaler Halbjahr-Wechsler im Header. Ein Klick = Wechsel, optimistisch gerendert.
 * Rendert nichts, solange es nur ein Halbjahr gibt (dann gibt es nichts zu wechseln —
 * neue Halbjahre legt man im Notenrechner über "+ neues HJ" an).
 */
export function HalbjahrPicker({
  halbjahre,
  aktuell,
  className = "",
}: {
  halbjahre: string[];
  aktuell: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [optimistisch, setOptimistisch] = useOptimistic(aktuell);
  const router = useRouter();

  function wechseln(hj: string) {
    if (hj === aktuell || pending) return;
    startTransition(async () => {
      setOptimistisch(hj);
      const res = await setHalbjahr(hj);
      if (!res.ok) {
        toast.error(`Wechsel fehlgeschlagen: ${res.error}`);
        return;
      }
      router.refresh();
    });
  }

  if (halbjahre.length < 2) return null;

  return (
    <div
      role="group"
      aria-label="Halbjahr wechseln"
      className={`inline-flex items-center gap-0.5 overflow-x-auto rounded-xl border border-border bg-surface-2/60 p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {halbjahre.map((hj) => {
        const aktiv = hj === optimistisch;
        return (
          <button
            key={hj}
            onClick={() => wechseln(hj)}
            disabled={pending}
            title={halbjahrLabel(hj)}
            aria-current={aktiv ? "true" : undefined}
            className={`shrink-0 rounded-[10px] px-2.5 py-1 font-mono text-[11px] font-semibold transition-[background-color,color,opacity] duration-200 disabled:opacity-60 ${
              aktiv
                ? "bg-primary text-primary-foreground"
                : "text-text-dim hover:bg-surface-3 hover:text-foreground"
            }`}
          >
            {halbjahrKurz(hj)}
          </button>
        );
      })}
    </div>
  );
}
