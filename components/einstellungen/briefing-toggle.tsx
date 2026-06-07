"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setBriefingAktiv } from "@/lib/actions/schule";

export function BriefingToggle({ initial }: { initial: boolean }) {
  const [aktiv, setAktiv] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !aktiv;
    setAktiv(next);
    startTransition(async () => {
      const res = await setBriefingAktiv(next);
      if (!res.ok) {
        setAktiv(!next);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold">
          {aktiv ? "Briefing aktiv" : "Briefing deaktiviert"}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-text-mute">
          {aktiv
            ? "Täglich ein KI-Text oben im Dashboard."
            : "Die Briefing-Karte wird ausgeblendet."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={isPending}
        aria-pressed={aktiv}
        className={`relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200 disabled:opacity-50 ${
          aktiv ? "border-brand bg-brand" : "border-border bg-surface-3"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform duration-200 ${
            aktiv ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
