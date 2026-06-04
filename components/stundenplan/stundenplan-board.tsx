"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addStunde, removeStunde } from "@/lib/actions/stundenplan";
import { hexToRgba, fmtZeit, FACH_FALLBACK_FARBE } from "@/lib/stundenplan/types";
import type { StundeRow } from "@/lib/stundenplan/types";
import type { FachRow } from "@/lib/grades/db";

// ── Zeit-Raster ──────────────────────────────────────────────────────────────
const START_H = 7;
const END_H = 19;
const TOTAL_MIN = (END_H - START_H) * 60;

function minVonZeit(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function topPct(t: string): number {
  return Math.max(0, ((minVonZeit(t) - START_H * 60) / TOTAL_MIN) * 100);
}
function hoehePct(start: string, end: string): number {
  return Math.max(2, ((minVonZeit(end) - minVonZeit(start)) / TOTAL_MIN) * 100);
}

// ── Konstanten ────────────────────────────────────────────────────────────────
const TAGE = ["Mo", "Di", "Mi", "Do", "Fr"] as const;
const STUNDEN_LABELS = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

const STANDARD_ZEITEN = [
  "07:30", "08:15", "09:05", "09:50", "10:50", "11:35", "12:30", "13:15",
  "14:15", "15:00", "15:45", "16:30",
];

// ── Typen ────────────────────────────────────────────────────────────────────
interface StundeAngereichert extends StundeRow {
  fach?: FachRow;
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────
export function StundenplanBoard({
  stunden,
  faecher,
}: {
  stunden: StundeRow[];
  faecher: FachRow[];
}) {
  const fachMap = new Map(faecher.map((f) => [f.id, f]));
  const angereichert: StundeAngereichert[] = stunden.map((s) => ({
    ...s,
    fach: s.fach_id ? fachMap.get(s.fach_id) : undefined,
  }));

  const [showForm, setShowForm] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  // Formular-State
  const [wochentag, setWochentag] = useState<number>(1);
  const [zeitStart, setZeitStart] = useState("08:00");
  const [zeitEnd, setZeitEnd] = useState("09:30");
  const [fachId, setFachId] = useState("");
  const [raum, setRaum] = useState("");

  function hinzufuegen() {
    if (!zeitStart || !zeitEnd) {
      toast.error("Start- und Endzeit sind nötig.");
      return;
    }
    if (zeitStart >= zeitEnd) {
      toast.error("Endzeit muss nach Startzeit liegen.");
      return;
    }
    start(async () => {
      const res = await addStunde({
        fachId: fachId || null,
        wochentag,
        zeitStart,
        zeitEnd,
        raum: raum.trim() || null,
        wocheTyp: null,
      });
      if (!res.ok) {
        toast.error(`Fehler: ${res.error}`);
        return;
      }
      toast.success("Stunde eingetragen.");
      setShowForm(false);
      setRaum("");
      router.refresh();
    });
  }

  function loeschen(id: string) {
    start(async () => {
      const res = await removeStunde(id);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  // Stunden nach Wochentag gruppieren
  const proTag = Array.from({ length: 5 }, (_, i) =>
    angereichert.filter((s) => s.wochentag === i + 1),
  );

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Stundenplan
          </h1>
          <p className="mt-1 font-mono text-sm text-text-dim">
            {stunden.length === 0
              ? "Noch keine Stunden eingetragen."
              : `${stunden.length} Stunde${stunden.length !== 1 ? "n" : ""} diese Woche`}
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          size="sm"
          className="gap-1.5 font-display font-bold"
          style={
            showForm
              ? { background: "var(--surface-2)", color: "var(--foreground)" }
              : undefined
          }
        >
          <Plus className={`size-4 transition-transform ${showForm ? "rotate-45" : ""}`} />
          Stunde
        </Button>
      </div>

      {/* Add-Formular */}
      {showForm && (
        <div
          className="animate-fade-up rounded-3xl border border-border p-5"
          style={{ background: "var(--card-grad)" }}
        >
          <h2 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-text-mute">
            Neue Stunde
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Wochentag */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">
                Tag
              </label>
              <select
                value={wochentag}
                onChange={(e) => setWochentag(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-foreground"
              >
                {TAGE.map((t, i) => (
                  <option key={t} value={i + 1}>{t}</option>
                ))}
              </select>
            </div>
            {/* Start */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">
                Beginn
              </label>
              <select
                value={zeitStart}
                onChange={(e) => setZeitStart(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-foreground"
              >
                {STANDARD_ZEITEN.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
                <option value="custom">Andere…</option>
              </select>
              {zeitStart === "custom" && (
                <Input
                  type="time"
                  onChange={(e) => setZeitStart(e.target.value || "custom")}
                  className="mt-1 h-9 bg-surface-2 font-mono text-sm"
                />
              )}
            </div>
            {/* Ende */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">
                Ende
              </label>
              <select
                value={zeitEnd}
                onChange={(e) => setZeitEnd(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-foreground"
              >
                {STANDARD_ZEITEN.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
                <option value="custom">Andere…</option>
              </select>
              {zeitEnd === "custom" && (
                <Input
                  type="time"
                  onChange={(e) => setZeitEnd(e.target.value || "custom")}
                  className="mt-1 h-9 bg-surface-2 font-mono text-sm"
                />
              )}
            </div>
            {/* Fach */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">
                Fach
              </label>
              <select
                value={fachId}
                onChange={(e) => setFachId(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-foreground"
              >
                <option value="">Fach wählen (optional)</option>
                {faecher.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            {/* Raum */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">
                Raum
              </label>
              <Input
                value={raum}
                onChange={(e) => setRaum(e.target.value)}
                placeholder="z. B. R203 (optional)"
                className="h-9 bg-surface-2 font-mono text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={hinzufuegen}
              disabled={pending || zeitStart === "custom" || zeitEnd === "custom"}
              className="font-display font-bold"
            >
              Eintragen
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="font-display text-text-dim"
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {/* Wochenraster */}
      <div
        className="overflow-x-auto rounded-3xl border border-border"
        style={{ background: "var(--card-grad)" }}
      >
        <div className="min-w-[520px]">
          {/* Tag-Header */}
          <div className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] border-b border-border">
            <div />
            {TAGE.map((t) => (
              <div
                key={t}
                className="py-3 text-center font-display text-sm font-extrabold text-foreground"
              >
                {t}
              </div>
            ))}
          </div>

          {/* Zeitraster */}
          <div
            className="relative grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr]"
            style={{ height: `${TOTAL_MIN}px` }}
          >
            {/* Stunden-Linien */}
            {STUNDEN_LABELS.map((h) => {
              const top = ((h - START_H) / (END_H - START_H)) * 100;
              return (
                <div
                  key={h}
                  className="absolute inset-x-0 flex items-start"
                  style={{ top: `${top}%` }}
                >
                  {/* Zeitlabel */}
                  <div className="flex w-[52px] flex-shrink-0 justify-end pr-2 pt-px">
                    <span className="font-mono text-[10px] text-text-mute leading-none">
                      {h}:00
                    </span>
                  </div>
                  {/* Linie */}
                  <div
                    className="flex-1 border-t"
                    style={{ borderColor: "color-mix(in srgb, var(--border) 60%, transparent)" }}
                  />
                </div>
              );
            })}

            {/* Spalten-Trenner */}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="pointer-events-none absolute inset-y-0"
                style={{
                  left: `calc(52px + ${(i / 5) * 100}%)`,
                  width: "1px",
                  background: "color-mix(in srgb, var(--border) 40%, transparent)",
                }}
              />
            ))}

            {/* Stunden-Blöcke */}
            {proTag.map((stundenAmTag, tagIndex) =>
              stundenAmTag.map((s) => {
                const farbe = s.fach?.farbe ?? FACH_FALLBACK_FARBE;
                const top = topPct(s.zeit_start);
                const height = hoehePct(s.zeit_start, s.zeit_end);
                const colStart = tagIndex + 2; // CSS-Grid 1-indexed, Spalte 1 = Zeit

                return (
                  <div
                    key={s.id}
                    className="absolute px-1 py-0.5"
                    style={{
                      top: `${top}%`,
                      height: `${height}%`,
                      left: `calc(52px + ${(tagIndex / 5) * 100}% + 3px)`,
                      width: `calc(${(1 / 5) * 100}% - 6px)`,
                    }}
                  >
                    <div
                      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl p-2 transition-all hover:scale-[1.02]"
                      style={{
                        background: hexToRgba(farbe, 0.18),
                        border: `1px solid ${hexToRgba(farbe, 0.45)}`,
                        boxShadow: `0 2px 12px ${hexToRgba(farbe, 0.15)}`,
                      }}
                    >
                      {/* Linker Farbstreifen */}
                      <div
                        className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl"
                        style={{ background: farbe }}
                      />
                      <div className="pl-2">
                        <div
                          className="truncate font-display text-xs font-bold leading-tight"
                          style={{ color: farbe }}
                        >
                          {s.fach?.name ?? "Freizeit"}
                        </div>
                        {s.raum && (
                          <div className="truncate font-mono text-[9px] text-text-dim">
                            {s.raum}
                          </div>
                        )}
                      </div>
                      <div className="pl-2 font-mono text-[9px] text-text-mute leading-none">
                        {fmtZeit(s.zeit_start)}–{fmtZeit(s.zeit_end)}
                      </div>

                      {/* Delete-Button */}
                      <button
                        onClick={() => loeschen(s.id)}
                        className="absolute right-1 top-1 hidden size-4 items-center justify-center rounded-full text-text-mute transition-colors hover:text-destructive group-hover:flex"
                        style={{ background: "var(--surface-1)" }}
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>

      {/* Leerer Zustand */}
      {stunden.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CalendarDays className="size-10 text-text-mute" />
          <p className="font-mono text-sm text-text-dim">
            Trag deine erste Stunde ein — Klick auf "+ Stunde" oben.
          </p>
        </div>
      )}
    </div>
  );
}
