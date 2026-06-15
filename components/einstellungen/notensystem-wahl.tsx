"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setNotensystem } from "@/lib/actions/schule";
import { ALLE_SYSTEME } from "@/lib/grades/systems";

interface Props {
  initialValue: string;
  /** Anzahl bestehender Noten — steuert den Hinweis nach dem Wechsel. */
  noteAnzahl: number;
}

export function NotensystemWahl({ initialValue, noteAnzahl }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === value) return;
    const prev = value;
    setValue(next); // sofort sichtbar umschalten
    setSaved(false);
    startTransition(async () => {
      const res = await setNotensystem(next);
      if (res.ok) {
        setSaved(true);
        // Warnung nicht-blockierend NACH dem Wechsel, wenn schon Noten da sind.
        if (noteAnzahl > 0) {
          const label = ALLE_SYSTEME.find((s) => s.id === next)?.label ?? next;
          toast.warning(
            `Auf „${label}" umgestellt. Deine ${noteAnzahl} bestehenden Noten wurden nicht umgerechnet.`,
            { duration: 6000 },
          );
        }
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(`Fehler: ${res.error}`);
        setValue(prev); // bei Fehler zurücksetzen
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={value}
        onChange={handleChange}
        disabled={isPending}
        className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand disabled:opacity-60"
      >
        {ALLE_SYSTEME.map((sys) => (
          <option key={sys.id} value={sys.id}>
            {sys.label}
          </option>
        ))}
      </select>
      {saved && <span className="font-mono text-xs text-success">Gespeichert ✓</span>}
    </div>
  );
}
