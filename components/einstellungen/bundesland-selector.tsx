"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveBundesland } from "@/lib/actions/schule";
import { BUNDESLAND_LABEL, type Bundesland } from "@/lib/ferien/ferien-data";

interface Props {
  initialValue: string | null;
}

export function BundeslandSelector({ initialValue }: Props) {
  const [value, setValue] = useState<string>(initialValue ?? "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    setValue(next);
    setSaved(false);
    startTransition(async () => {
      const res = await saveBundesland(next || null);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(`Fehler: ${res.error}`);
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
        <option value="">Kein Bundesland</option>
        {(Object.entries(BUNDESLAND_LABEL) as [Bundesland, string][]).map(
          ([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ),
        )}
      </select>
      {saved && (
        <span className="font-mono text-xs text-success">Gespeichert ✓</span>
      )}
    </div>
  );
}
