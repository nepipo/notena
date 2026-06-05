"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addKlausur, removeKlausur } from "@/lib/actions/schule";
import type { Fach } from "@/lib/grades/types";
import type { KlausurRow } from "@/lib/grades/db";

function tageBis(datumIso: string): number {
  const [y, m, d] = datumIso.slice(0, 10).split("-").map(Number);
  const ziel = new Date(y, m - 1, d);
  const heute = new Date();
  const heut = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.round((ziel.getTime() - heut.getTime()) / 86400000);
}

function fmtDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function KlausurSection({
  faecher,
  klausuren,
}: {
  faecher: Fach[];
  klausuren: KlausurRow[];
}) {
  const [titel, setTitel] = useState("");
  const [datum, setDatum] = useState("");
  const [fachId, setFachId] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const fachName = new Map(faecher.map((f) => [f.id, f.name]));

  function hinzufuegen() {
    if (!titel.trim() || !datum) {
      toast.error("Titel und Datum sind nötig.");
      return;
    }
    startTransition(async () => {
      const res = await addKlausur(
        titel,
        datum + "T12:00:00.000Z",
        fachId || undefined,
      );
      if (!res.ok) {
        toast.error(`Fehler: ${res.error}`);
      } else {
        setTitel("");
        setDatum("");
        setFachId("");
        router.refresh();
      }
    });
  }

  function loeschen(id: string) {
    startTransition(async () => {
      const res = await removeKlausur(id);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  return (
    <section
      className="animate-fade-up mt-6 rounded-3xl border border-border p-6"
      style={{ background: "var(--card-grad)" }}
    >
      <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">
        Klausuren &amp; Termine
      </h2>

      {/* Formular */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          value={titel}
          onChange={(e) => setTitel(e.target.value)}
          placeholder="Titel, z. B. 2. Klausur"
          className="h-9 flex-1 bg-surface-2 font-mono text-sm"
        />
        <Input
          type="date"
          value={datum}
          onChange={(e) => setDatum(e.target.value)}
          className="h-9 w-40 bg-surface-2 font-mono text-sm"
        />
        <select
          value={fachId}
          onChange={(e) => setFachId(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-text-dim"
        >
          <option value="">Fach (optional)</option>
          {faecher.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <Button
          onClick={hinzufuegen}
          disabled={pending}
          size="sm"
          className="font-display font-bold"
        >
          + Termin
        </Button>
      </div>

      {/* Liste */}
      <div className="mt-4 space-y-2">
        {klausuren.length === 0 && (
          <p className="font-mono text-xs text-text-mute">
            Noch keine Termine — trag deine nächste Klausur ein.
          </p>
        )}
        {klausuren.map((k) => {
          const tage = tageBis(k.datum);
          return (
            <div
              key={k.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate font-display font-bold">{k.titel}</div>
                <div className="font-mono text-[11px] text-text-dim">
                  {k.fach_id && fachName.get(k.fach_id)
                    ? `${fachName.get(k.fach_id)} · `
                    : ""}
                  {fmtDatum(k.datum)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-xs ${tage <= 7 ? "text-destructive" : "text-text-dim"}`}
                >
                  {tage < 0
                    ? "vorbei"
                    : tage === 0
                    ? "heute"
                    : tage === 1
                    ? "morgen"
                    : `in ${tage} T`}
                </span>
                <button
                  onClick={() => loeschen(k.id)}
                  title="Termin löschen"
                  className="text-text-mute transition-colors hover:text-destructive"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
