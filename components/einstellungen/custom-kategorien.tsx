"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addCustomKategorie, removeCustomKategorie } from "@/lib/actions/kategorien";
import type { CustomKategorie } from "@/lib/grades/types";

export function CustomKategorienVerwaltung({
  initial,
}: {
  initial: CustomKategorie[];
}) {
  const [kategorien, setKategorien] = useState<CustomKategorie[]>(initial);
  const [name, setName] = useState("");
  const [kurzname, setKurzname] = useState("");
  const [, startTransition] = useTransition();

  function handleAdd() {
    if (!name.trim() || !kurzname.trim()) {
      toast.error("Name und Kürzel sind Pflicht.");
      return;
    }
    const nameVal = name.trim();
    const kurzVal = kurzname.trim();
    startTransition(async () => {
      const res = await addCustomKategorie(nameVal, kurzVal);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setKategorien((prev) => [...prev, res.entry]);
      setName("");
      setKurzname("");
      toast.success(`"${nameVal}" hinzugefügt.`);
    });
  }

  function handleRemove(id: string, katName: string) {
    startTransition(async () => {
      const res = await removeCustomKategorie(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setKategorien((prev) => prev.filter((k) => k.id !== id));
      toast.success(`"${katName}" entfernt.`);
    });
  }

  return (
    <div className="space-y-4">
      {kategorien.length > 0 && (
        <div className="space-y-1.5">
          {kategorien.map((k) => (
            <div
              key={k.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5"
            >
              <span className="w-8 shrink-0 rounded-lg bg-surface-3 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-text-dim">
                {k.kurzname}
              </span>
              <span className="flex-1 font-sans text-sm font-semibold">{k.name}</span>
              <button
                onClick={() => handleRemove(k.id, k.name)}
                className="font-mono text-xs text-text-mute transition-colors hover:text-destructive"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Name (z. B. Aufsatz)"
          className="h-9 flex-1 bg-surface-2 font-sans text-sm"
          maxLength={40}
        />
        <Input
          value={kurzname}
          onChange={(e) => setKurzname(e.target.value.slice(0, 5))}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Kürzel"
          className="h-9 w-20 bg-surface-2 font-mono text-sm"
          maxLength={5}
        />
        <Button onClick={handleAdd} size="sm" className="h-9 shrink-0 font-display font-bold">
          + Neu
        </Button>
      </div>
      <p className="font-mono text-[11px] text-text-mute">
        Eigene Arten erscheinen überall wo du eine Bewertungsart wählst. Sie zählen wie mündliche Noten.
      </p>
    </div>
  );
}
