"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addKlausur, removeKlausur } from "@/lib/actions/schule";
import { tageBis, hexToRgba, FACH_FALLBACK_FARBE } from "@/lib/stundenplan/types";
import type { KlausurRow, FachRow } from "@/lib/grades/db";

function fmtDatum(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function KlausurListe({
  faecher,
  klausuren,
}: {
  faecher: FachRow[];
  klausuren: KlausurRow[];
}) {
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState("");
  const [fachId, setFachId] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const fachMap = new Map(faecher.map((f) => [f.id, f]));

  function hinzufuegen() {
    if (!titel.trim() || !datum) {
      toast.error("Titel und Datum sind nötig.");
      return;
    }
    start(async () => {
      const res = await addKlausur(titel, datum + "T12:00:00.000Z", fachId || undefined);
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      setTitel(""); setDatum(""); setFachId("");
      router.refresh();
    });
  }

  function loeschen(id: string) {
    start(async () => {
      const res = await removeKlausur(id);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  return (
    <section>
      <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-text-mute">
        Klausuren
      </h2>

      {/* Formular */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          value={titel} onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel, z. B. 2. Klausur"
          className="h-9 flex-1 bg-surface-2 font-mono text-sm"
        />
        <Input
          type="date" value={datum} onChange={(e) => setDatum(e.target.value)}
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
          + Klausur
        </Button>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {klausuren.length === 0 && (
          <p className="font-mono text-xs text-text-mute">
            Noch keine Klausuren eingetragen.
          </p>
        )}
        {klausuren.map((k) => {
          const tage = tageBis(k.datum);
          const fach = k.fach_id ? fachMap.get(k.fach_id) : null;
          const farbe = fach?.farbe ?? FACH_FALLBACK_FARBE;
          return (
            <div
              key={k.id}
              className="lift flex items-center gap-3 rounded-2xl border border-border p-3 transition-all"
              style={{ background: "linear-gradient(145deg, var(--surface-2), var(--surface-1))" }}
            >
              {/* Farbiger Stripe */}
              <div
                className="h-10 w-1 flex-shrink-0 rounded-full"
                style={{
                  background: farbe,
                  boxShadow: `0 0 10px ${hexToRgba(farbe, 0.5)}`,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold leading-tight">{k.titel}</div>
                <div className="mt-0.5 font-mono text-[10px] text-text-dim">
                  {fach ? `${fach.name} · ` : ""}
                  {fmtDatum(k.datum)}
                </div>
              </div>
              {/* Countdown-Chip */}
              <span
                className="flex-shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-bold"
                style={
                  tage <= 7
                    ? { background: "rgba(255,48,80,.18)", color: "var(--destructive)", border: "1px solid rgba(255,48,80,.3)" }
                    : { background: "rgba(29,161,255,.15)", color: "var(--brand)", border: "1px solid rgba(29,161,255,.25)" }
                }
              >
                {tage < 0 ? "vorbei" : tage === 0 ? "heute" : `${tage}T`}
              </span>
              <button
                onClick={() => loeschen(k.id)}
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
