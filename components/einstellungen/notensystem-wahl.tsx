"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setNotensystem } from "@/lib/actions/schule";
import { ALLE_SYSTEME } from "@/lib/grades/systems";

interface Props {
  initialValue: string;
  /** Anzahl bestehender Noten — steuert die Wechsel-Warnung. */
  noteAnzahl: number;
}

export function NotensystemWahl({ initialValue, noteAnzahl }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  // Bei vorhandenen Noten wird der Wechsel erst nach Bestätigung angewendet.
  const [pendingValue, setPendingValue] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function apply(next: string) {
    setSaved(false);
    startTransition(async () => {
      const res = await setNotensystem(next);
      if (res.ok) {
        setValue(next);
        setPendingValue(null);
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(`Fehler: ${res.error}`);
      }
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    if (next === value) return;
    if (noteAnzahl > 0) {
      // Wechsel mit bestehenden Noten -> erst warnen, nicht sofort speichern.
      setPendingValue(next);
    } else {
      apply(next);
    }
  }

  const pendingLabel = pendingValue
    ? ALLE_SYSTEME.find((s) => s.id === pendingValue)?.label ?? pendingValue
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <select
          value={pendingValue ?? value}
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

      {pendingValue && (
        <div className="rounded-xl border border-border bg-surface-2 p-3.5">
          <p className="text-sm text-text-dim">
            Du hast{" "}
            <span className="font-semibold text-foreground">
              {noteAnzahl} {noteAnzahl === 1 ? "bestehende Note" : "bestehende Noten"}
            </span>{" "}
            im aktuellen System. Ein Wechsel zu{" "}
            <span className="font-semibold text-foreground">{pendingLabel}</span> rechnet sie{" "}
            <span className="font-semibold text-foreground">nicht</span> um — empfohlen nur, wenn
            du neu startest.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => apply(pendingValue)}
              disabled={isPending}
              className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Trotzdem wechseln
            </button>
            <button
              type="button"
              onClick={() => setPendingValue(null)}
              disabled={isPending}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-dim transition-colors hover:text-foreground disabled:opacity-60"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
