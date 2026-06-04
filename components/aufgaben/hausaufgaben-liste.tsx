"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addHausaufgabe, removeHausaufgabe, toggleErledigt } from "@/lib/actions/hausaufgaben";
import { hexToRgba, FACH_FALLBACK_FARBE, tageBis } from "@/lib/stundenplan/types";
import type { FachRow } from "@/lib/grades/db";
import type { HausaufgabeRow } from "@/lib/stundenplan/types";

export function HausaufgabenListe({
  faecher,
  hausaufgaben,
}: {
  faecher: FachRow[];
  hausaufgaben: HausaufgabeRow[];
}) {
  const [beschreibung, setBeschreibung] = useState("");
  const [faelligAm, setFaelligAm] = useState("");
  const [fachId, setFachId] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const fachMap = new Map(faecher.map((f) => [f.id, f]));

  // Offen zuerst, erledigte ans Ende, dann nach Datum sortiert
  const sortiert = [...hausaufgaben].sort((a, b) => {
    if (a.erledigt !== b.erledigt) return a.erledigt ? 1 : -1;
    return a.faellig_am.localeCompare(b.faellig_am);
  });

  function hinzufuegen() {
    if (!beschreibung.trim() || !faelligAm) {
      toast.error("Beschreibung und Datum sind nötig.");
      return;
    }
    start(async () => {
      const res = await addHausaufgabe({
        fachId: fachId || null,
        beschreibung,
        faelligAm,
      });
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      setBeschreibung(""); setFaelligAm(""); setFachId("");
      router.refresh();
    });
  }

  function toggle(id: string, erledigt: boolean) {
    start(async () => {
      const res = await toggleErledigt(id, erledigt);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  function loeschen(id: string) {
    start(async () => {
      const res = await removeHausaufgabe(id);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  return (
    <section>
      <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-text-mute">
        Hausaufgaben
      </h2>

      {/* Formular */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          value={beschreibung} onChange={(e) => setBeschreibung(e.target.value)}
          placeholder="z. B. S. 47 Aufg. 3+4 lesen"
          className="h-9 flex-1 bg-surface-2 font-mono text-sm"
        />
        <Input
          type="date" value={faelligAm} onChange={(e) => setFaelligAm(e.target.value)}
          className="h-9 w-40 bg-surface-2 font-mono text-sm"
        />
        <select
          value={fachId} onChange={(e) => setFachId(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-text-dim"
        >
          <option value="">Fach (optional)</option>
          {faecher.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <Button onClick={hinzufuegen} disabled={pending} size="sm" className="font-display font-bold">
          + HA
        </Button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {sortiert.length === 0 && (
          <p className="font-mono text-xs text-text-mute">
            Keine offenen Hausaufgaben — gut gemacht.
          </p>
        )}
        {sortiert.map((ha) => {
          const fach = ha.fach_id ? fachMap.get(ha.fach_id) : null;
          const farbe = fach?.farbe ?? FACH_FALLBACK_FARBE;
          const tage = tageBis(ha.faellig_am);
          return (
            <div
              key={ha.id}
              className="lift flex items-center gap-3 rounded-2xl border border-border p-3 transition-all"
              style={{
                background: "linear-gradient(145deg, var(--surface-2), var(--surface-1))",
                opacity: ha.erledigt ? 0.45 : 1,
              }}
            >
              <div
                className="h-10 w-1 flex-shrink-0 rounded-full"
                style={{
                  background: farbe,
                  boxShadow: ha.erledigt ? "none" : `0 0 10px ${hexToRgba(farbe, 0.5)}`,
                }}
              />
              <div className="min-w-0 flex-1">
                {fach && (
                  <div className="font-mono text-[9px] uppercase tracking-widest text-text-mute">
                    {fach.name}
                  </div>
                )}
                <div
                  className="font-display font-bold leading-tight"
                  style={{ textDecoration: ha.erledigt ? "line-through" : "none" }}
                >
                  {ha.beschreibung}
                </div>
                <div
                  className="mt-0.5 font-mono text-[10px]"
                  style={{ color: tage <= 1 && !ha.erledigt ? "var(--destructive)" : "var(--text-mute)" }}
                >
                  {tage < 0 ? "überfällig" : tage === 0 ? "fällig heute" : `fällig in ${tage}T`}
                </div>
              </div>
              {/* Checkbox */}
              <button
                onClick={() => toggle(ha.id, !ha.erledigt)}
                className="flex size-6 flex-shrink-0 items-center justify-center rounded-lg border border-border transition-all hover:border-brand hover:shadow-[0_0_10px_rgba(29,161,255,.3)]"
                style={
                  ha.erledigt
                    ? { background: "linear-gradient(135deg,var(--brand),var(--indigo))", borderColor: "transparent" }
                    : {}
                }
              >
                {ha.erledigt && <span className="text-[11px] font-black text-white">✓</span>}
              </button>
              <button
                onClick={() => loeschen(ha.id)}
                className="flex-shrink-0 text-text-mute transition-colors hover:text-destructive"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
