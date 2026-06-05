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

export function FotoImport({ faecher }: { faecher: FachRow[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [parsing, startParsing] = useTransition();
  const [importing, startImporting] = useTransition();
  const [stunden, setStunden] = useState<ParsedStunde[] | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    startParsing(async () => {
      try {
        const { base64, mimeType } = await komprimiereBild(file);
        const result = await parseStundenplanFoto(base64, mimeType, faecher);
        if (!result.ok) { toast.error(result.error); return; }
        setStunden(result.stunden);
        if (result.neueFachNamen.length > 0) {
          toast.info(
            `${result.neueFachNamen.length} neue${result.neueFachNamen.length > 1 ? " Fächer" : "s Fach"} werden angelegt: ${result.neueFachNamen.join(", ")}`,
          );
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Verarbeiten des Bildes.");
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

  function handleImport() {
    if (!stunden?.length) return;
    startImporting(async () => {
      const result = await importStunden(stunden);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success(`${stunden.length} Stunden eingetragen.`);
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
        className="hidden"
        onChange={handleFileChange}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={parsing}
        className="gap-1.5 font-display font-bold"
        title="Stundenplan-Foto importieren"
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

            {/* Stunden-Liste */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="space-y-2">
                {stunden.map((s) => (
                  <div
                    key={s.tempId}
                    className="rounded-2xl border border-border p-3 space-y-2"
                    style={{ background: "var(--surface-2)" }}
                  >
                    {/* Zeile 1: Tag + Zeit + Delete */}
                    <div className="flex items-center gap-2">
                      <select
                        value={s.wochentag}
                        onChange={(e) => updateStunde(s.tempId, { wochentag: Number(e.target.value) })}
                        className="h-8 rounded-lg border border-border bg-surface-1 px-2 font-mono text-xs text-foreground w-[60px] shrink-0"
                      >
                        {TAGE.map((t, i) => (
                          <option key={t} value={i + 1}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={s.zeitStart}
                        onChange={(e) => updateStunde(s.tempId, { zeitStart: e.target.value })}
                        className="h-8 rounded-lg border border-border bg-surface-1 px-2 font-mono text-xs text-foreground w-[90px] shrink-0"
                      />
                      <span className="font-mono text-xs text-text-mute shrink-0">–</span>
                      <input
                        type="time"
                        value={s.zeitEnd}
                        onChange={(e) => updateStunde(s.tempId, { zeitEnd: e.target.value })}
                        className="h-8 rounded-lg border border-border bg-surface-1 px-2 font-mono text-xs text-foreground w-[90px] shrink-0"
                      />
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
                        <span className="truncate font-display text-sm font-bold">{s.fachName}</span>
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
