"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setHalbjahr } from "@/lib/actions/schule";
import { halbjahrLabel, naechstesHalbjahr } from "@/lib/grades/halbjahr";
import { NeuesHalbjahrDialog } from "./neues-halbjahr-dialog";
import type { Fach } from "@/lib/grades/types";

export function HalbjahrSwitcher({
  verfuegbareHalbjahre,
  aktuellesHj,
  aktuelleFaecher,
}: {
  verfuegbareHalbjahre: string[];
  aktuellesHj: string;
  aktuelleFaecher: Fach[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function wechseln(hj: string) {
    if (hj === aktuellesHj) return;
    startTransition(async () => {
      const res = await setHalbjahr(hj);
      if (!res.ok) {
        toast.error(`Wechsel fehlgeschlagen: ${res.error}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-surface-2 p-1">
        {verfuegbareHalbjahre.map((hj) => {
          const [nummer, jahr] = halbjahrLabel(hj).split(" · ");
          return (
            <button
              key={hj}
              onClick={() => wechseln(hj)}
              disabled={pending}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                hj === aktuellesHj
                  ? "bg-brand font-semibold text-black"
                  : "text-text-dim hover:bg-surface-3"
              }`}
            >
              {nummer}
              {jahr && <span className="ml-1 opacity-60">{jahr}</span>}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => setDialogOpen(true)}
        className="rounded-xl border border-dashed border-brand/40 bg-brand/5 px-3 py-1.5 font-mono text-xs text-brand hover:bg-brand/10"
      >
        + neues HJ
      </button>

      <NeuesHalbjahrDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        vorschlagHj={naechstesHalbjahr(aktuellesHj)}
        aktuelleFaecher={aktuelleFaecher}
      />
    </div>
  );
}
