"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setLkDoppeltGewichten } from "@/lib/actions/schule";

export function LkGewichtungToggle({ initial }: { initial: boolean }) {
  const [aktiv, setAktiv] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle() {
    const neu = !aktiv;
    setAktiv(neu);
    start(async () => {
      const res = await setLkDoppeltGewichten(neu);
      if (!res.ok) {
        setAktiv(!neu);
        toast.error(res.error);
        return;
      }
      toast.success(neu ? "LK-Fächer zählen jetzt doppelt." : "LK-Fächer zählen einfach.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">LK doppelt gewichten</p>
        <p className="mt-0.5 text-xs text-text-mute">
          LK-Fächer zählen {aktiv ? "doppelt" : "einfach"} im Gesamtschnitt.
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={pending}
        aria-pressed={aktiv}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          aktiv ? "bg-brand" : "bg-surface-3"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            aktiv ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
