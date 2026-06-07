"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { setKlausurErinnerungTage } from "@/lib/actions/schule";

const OPTIONEN = [
  { tage: 1, label: "1 Tag vorher" },
  { tage: 3, label: "3 Tage vorher" },
  { tage: 7, label: "7 Tage vorher" },
] as const;

export function KlausurErinnerungConfig({ initial }: { initial: number[] }) {
  const [ausgewaehlt, setAusgewaehlt] = useState<number[]>(initial);
  const [pushAktiv, setPushAktiv] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushAktiv(false);
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setPushAktiv(!!sub);
    });
  }, []);

  function toggle(tage: number) {
    const prev = ausgewaehlt;
    const naechste = ausgewaehlt.includes(tage)
      ? ausgewaehlt.filter((t) => t !== tage)
      : [...ausgewaehlt, tage].sort((a, b) => a - b);

    setAusgewaehlt(naechste);
    startTransition(async () => {
      const res = await setKlausurErinnerungTage(naechste);
      if (!res.ok) {
        setAusgewaehlt(prev);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="mb-1 text-sm font-semibold">Klausur-Erinnerungen</p>
      <p className="mb-3 font-mono text-[11px] text-text-mute">
        Wann soll Project X dich an bevorstehende Klausuren erinnern?
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONEN.map(({ tage, label }) => {
          const aktiv = ausgewaehlt.includes(tage);
          const disabled = pushAktiv === false || isPending;
          return (
            <button
              key={tage}
              onClick={() => toggle(tage)}
              disabled={disabled}
              aria-pressed={aktiv}
              className={`rounded-xl border px-4 py-2 font-display text-sm font-bold transition-all disabled:opacity-40 ${
                aktiv
                  ? "border-brand/40 bg-brand/12 text-brand"
                  : "border-border bg-surface-2 text-foreground hover:bg-surface-3"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {pushAktiv === false && (
        <p className="mt-2 font-mono text-[11px] text-destructive">
          Push-Benachrichtigungen oben erst aktivieren.
        </p>
      )}
    </div>
  );
}
