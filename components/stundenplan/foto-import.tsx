"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  parseStundenplanFoto,
  importStunden,
  type ParsedStunde,
} from "@/lib/actions/stundenplan-import";
import type { FachRow } from "@/lib/grades/db";

const TAGE = ["Mo", "Di", "Mi", "Do", "Fr"] as const;

type GlobalWoche = "standard" | "A" | "B" | "gemischt";

async function komprimiereBild(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX) {
        height = Math.round((height * MAX) / width);
        width = MAX;
      } else if (height > MAX) {
        width = Math.round((width * MAX) / height);
        height = MAX;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
      URL.revokeObjectURL(url);
      resolve({ base64, mimeType: "image/jpeg" });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Bild konnte nicht geladen werden.")); };
    img.src = url;
  });
}

function WocheTypPills({
  value,
  onChange,
}: {
  value: "A" | "B" | null;
  onChange: (v: "A" | "B" | null) => void;
}) {
  const opts: Array<{ label: string; val: "A" | "B" | null }> = [
    { label: "—", val: null },
    { label: "A", val: "A" },
    { label: "B", val: "B" },
  ];
  return (
    <div className="flex shrink-0 gap-0.5 rounded-lg p-0.5" style={{ background: "var(--surface-1)" }}>
      {opts.map((o) => {
        const aktiv = value === o.val;
        return (
          <button
            key={String(o.val)}
            onClick={() => onChange(o.val)}
            className="h-6 min-w-[22px] rounded-md px-1.5 font-mono text-[10px] font-bold transition-colors"
            style={
              aktiv
                ? { background: "var(--brand)", color: "#000" }
                : { color: "var(--text-mute)" }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FotoImport({ faecher }: { faecher: FachRow[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [parsing, startParsing] = useTransition();
  const [importing, startImporting] = useTransition();
  const [stunden, setStunden] = useState<ParsedStunde[] | null>(null);
  const [globalWoche, setGlobalWoche] = useState<GlobalWoche>("standard");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 2);
    if (files.length === 0) return;
    e.target.value = "";

    startParsing(async () => {
      try {
        const ergebnisse = await Promise.all(
          files.map(async (file) => {
            const { base64, mimeType } = await komprimiereBild(file);
            return parseStundenplanFoto(base64, mimeType, faecher);
          }),
        );

        const fehler = ergebnisse.filter((r) => !r.ok);
        if (fehler.length === ergebnisse.length) {
          toast.error((fehler[0] as { ok: false; error: string }).error);
          return;
        }
        if (fehler.length > 0) {
          toast.warning("Ein Foto konnte nicht ausgelesen werden, das andere wurde importiert.");
        }

        const erfolge = ergebnisse.filter((r) => r.ok) as Array<{
          ok: true; stunden: ParsedStunde[]; neueFachNamen: string[]; hatAbWochen: boolean;
        }>;

        const alleStunden = erfolge.flatMap((r, fotoIndex) =>
          r.stunden.map((s) => ({ ...s, tempId: `f${fotoIndex}_${s.tempId}` })),
        );

        if (alleStunden.length === 0) {
          toast.error("Keine Stunden erkannt. Versuch's mit einem klareren Foto.");
          return;
        }

        // Wenn Claude A/B erkannt hat, auf "gemischt" stellen damit per-Stunde sichtbar wird
        const hatAbWochen = erfolge.some((r) => r.hatAbWochen);
        setGlobalWoche(hatAbWochen ? "gemischt" : "standard");
        setStunden(alleStunden);

        const alleNeueFaecher = [...new Set(erfolge.flatMap((r) => r.neueFachNamen))];
        if (alleNeueFaecher.length > 0) {
          toast.info(
            `${alleNeueFaecher.length} neue${alleNeueFaecher.length > 1 ? " Fächer" : "s Fach"} werden angelegt: ${alleNeueFaecher.join(", ")}`,
          );
        }
        if (hatAbWochen) {
          toast.info("A/B-Wochen erkannt — prüf die Zuordnung kurz.");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Verarbeiten der Bilder.");
      }
    });
  }

  function updateStunde(tempId: string, updates: Partial<ParsedStunde>) {
    setStunden((prev) =>
      prev?.map((s) => (s.tempId === tempId ? { ...s, ...updates } : s)) ?? null,
    );
  }

  function removeStunde(tempId: string) {
    setStunden((prev) => prev?.filter((s) => s.tempId !== tempId) ?? null);
  }

  function handleGlobalWocheChange(woche: GlobalWoche) {
    setGlobalWoche(woche);
    if (woche === "gemischt") return; // per-Stunde bleibt wie's ist
    const typ = woche === "A" ? "A" : woche === "B" ? "B" : null;
    setStunden((prev) => prev?.map((s) => ({ ...s, wocheTyp: typ })) ?? null);
  }

  function stundenMitWoche(): ParsedStunde[] {
    if (!stunden) return [];
    if (globalWoche === "gemischt") return stunden;
    const typ = globalWoche === "A" ? "A" : globalWoche === "B" ? "B" : null;
    return stunden.map((s) => ({ ...s, wocheTyp: typ }));
  }

  function handleImport() {
    const final = stundenMitWoche();
    if (!final.length) return;
    startImporting(async () => {
      const result = await importStunden(final);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(`${final.length} Stunden eingetragen.`);
      setStunden(null);
      router.refresh();
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={parsing}
        className="gap-1.5 font-display font-bold"
        title="Bis zu 2 Stundenplan-Fotos importieren"
      >
        {parsing
          ? <Loader2 className="size-4 animate-spin" />
          : <Camera className="size-4" />}
        {parsing ? "Wird analysiert…" : "Foto"}
      </Button>

      {stunden && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => !importing && setStunden(null)}
          />
          <div
            className="fixed inset-x-4 bottom-4 top-16 z-50 flex flex-col overflow-hidden rounded-3xl border border-border sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-2xl sm:-translate-x-1/2"
            style={{ background: "var(--surface-1)" }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="font-display text-base font-bold">Erkannte Stunden</h2>
                <p className="mt-0.5 font-mono text-[11px] text-text-mute">
                  {stunden.length} Stunden · Prüf kurz ob alles stimmt
                </p>
              </div>
              <button
                onClick={() => setStunden(null)}
                disabled={importing}
                className="flex size-7 items-center justify-center rounded-full text-text-mute transition-colors hover:text-foreground disabled:opacity-40"
                style={{ background: "var(--surface-2)" }}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* A/B-Wochen Toggle */}
            <div
              className="shrink-0 border-b border-border px-5 py-3"
              style={{ background: "color-mix(in srgb, var(--surface-2) 60%, transparent)" }}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-mute">
                  Woche
                </span>
                <div className="flex gap-1">
                  {(
                    [
                      { val: "standard", label: "Standard" },
                      { val: "A", label: "A-Woche" },
                      { val: "B", label: "B-Woche" },
                      { val: "gemischt", label: "Gemischt (A+B)" },
                    ] as const
                  ).map((o) => (
                    <button
                      key={o.val}
                      onClick={() => handleGlobalWocheChange(o.val)}
                      className="rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold transition-colors"
                      style={
                        globalWoche === o.val
                          ? { background: "var(--brand)", color: "#000" }
                          : { background: "var(--surface-2)", color: "var(--text-mute)" }
                      }
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {globalWoche === "gemischt" && (
                <p className="mt-1.5 font-mono text-[10px] text-text-mute">
                  Jede Stunde einzeln zuweisen (—&nbsp;=&nbsp;beide Wochen)
                </p>
              )}
            </div>

            {/* Stunden-Liste */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-2">
                {stunden.map((s) => (
                  <div
                    key={s.tempId}
                    className="rounded-2xl border border-border p-3 space-y-2"
                    style={{ background: "var(--surface-2)" }}
                  >
                    {/* Zeile 1: Tag + Zeit + (A/B wenn gemischt) + Delete */}
                    <div className="flex items-center gap-2">
                      <select
                        value={s.wochentag}
                        onChange={(e) => updateStunde(s.tempId, { wochentag: Number(e.target.value) })}
                        className="h-8 w-[60px] shrink-0 rounded-lg border border-border bg-surface-1 px-2 font-mono text-xs text-foreground"
                      >
                        {TAGE.map((t, i) => (
                          <option key={t} value={i + 1}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={s.zeitStart}
                        onChange={(e) => updateStunde(s.tempId, { zeitStart: e.target.value })}
                        className="h-8 w-[90px] shrink-0 rounded-lg border border-border bg-surface-1 px-2 font-mono text-xs text-foreground"
                      />
                      <span className="shrink-0 font-mono text-xs text-text-mute">–</span>
                      <input
                        type="time"
                        value={s.zeitEnd}
                        onChange={(e) => updateStunde(s.tempId, { zeitEnd: e.target.value })}
                        className="h-8 w-[90px] shrink-0 rounded-lg border border-border bg-surface-1 px-2 font-mono text-xs text-foreground"
                      />
                      {globalWoche === "gemischt" && (
                        <WocheTypPills
                          value={s.wocheTyp}
                          onChange={(v) => updateStunde(s.tempId, { wocheTyp: v })}
                        />
                      )}
                      <div className="flex-1" />
                      <button
                        onClick={() => removeStunde(s.tempId)}
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-text-mute transition-colors hover:text-red-400"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    {/* Zeile 2: Fach + Lehrer + Raum */}
                    <div className="flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-1.5">
                        <Input
                          value={s.fachName}
                          onChange={(e) => updateStunde(s.tempId, { fachName: e.target.value })}
                          className="h-7 min-w-0 flex-1 bg-surface-1 font-display text-sm font-bold"
                        />
                        {s.isNew && (
                          <span
                            className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider"
                            style={{
                              background: "color-mix(in srgb, var(--brand) 20%, transparent)",
                              color: "var(--brand)",
                            }}
                          >
                            neu
                          </span>
                        )}
                      </div>
                      <Input
                        value={s.lehrer}
                        onChange={(e) => updateStunde(s.tempId, { lehrer: e.target.value })}
                        placeholder="Lehrer"
                        className="h-7 w-[90px] shrink-0 bg-surface-1 font-mono text-[11px]"
                      />
                      <Input
                        value={s.raum}
                        onChange={(e) => updateStunde(s.tempId, { raum: e.target.value })}
                        placeholder="Raum"
                        className="h-7 w-[70px] shrink-0 bg-surface-1 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                ))}

                {stunden.length === 0 && (
                  <div className="py-8 text-center font-mono text-sm text-text-mute">
                    Alle Stunden entfernt.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleImport}
                  disabled={importing || stunden.length === 0}
                  className="gap-2 font-display font-bold"
                >
                  {importing
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Check className="size-4" />}
                  {importing
                    ? "Wird eingetragen…"
                    : `${stunden.length} Stunden eintragen`}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStunden(null)}
                  disabled={importing}
                  className="font-display text-text-dim"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
