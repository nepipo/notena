"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, Check, X, RotateCcw } from "lucide-react";
import {
  addNote, updateNote, removeNote,
  addFach, updateFach, removeFach,
  addKlausur, updateKlausur, removeKlausur,
} from "@/lib/actions/schule";
import {
  addHausaufgabe, updateHausaufgabe, removeHausaufgabe, toggleErledigt,
} from "@/lib/actions/hausaufgaben";
import {
  addStunde, updateStunde, removeStunde,
} from "@/lib/actions/stundenplan";
import type { ClientMessage, CoachApiResponse } from "@/app/api/coach/route";
import type { Kategorie } from "@/lib/grades/types";

// ── Typen ──────────────────────────────────────────────────────────────

type UndoEntry = {
  id: string;
  description: string;
  undo: () => Promise<void>;
};

type UiMsg =
  | { kind: "text"; role: "user" | "assistant"; content: string }
  | { kind: "pending"; tool_use_id: string; preview: string; name: string; input: Record<string, unknown>; snapshot: Record<string, unknown> | null }
  | { kind: "result"; success: boolean; summary: string }
  | { kind: "loading" };

const STARTER = "Was steht heute an — wie kann ich helfen?";

// ── Execution Switch ───────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  snapshot: Record<string, unknown> | null,
): Promise<{ ok: boolean; summary: string; undoFn: (() => Promise<void>) | null }> {
  try {
    switch (name) {
      // ── Noten ──
      case "note_erstellen": {
        const r = await addNote(
          input.fach_id as string,
          input.punkte as number,
          input.kategorie as Kategorie,
          input.bezeichnung as string | undefined,
          input.gewicht as number | undefined,
        );
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        const newId = r.id;
        return {
          ok: true,
          summary: `Note eingetragen (${input.punkte}P ${input.kategorie}).`,
          undoFn: async () => { await removeNote(newId); },
        };
      }
      case "note_bearbeiten": {
        if (!snapshot) return { ok: false, summary: "Note nicht gefunden.", undoFn: null };
        const prev = snapshot as { punkte: number; kategorie: Kategorie; bezeichnung: string | null; gewicht: number };
        const r = await updateNote(
          input.note_id as string,
          (input.punkte as number) ?? prev.punkte,
          (input.kategorie as Kategorie) ?? prev.kategorie,
          (input.bezeichnung as string | undefined) ?? prev.bezeichnung ?? undefined,
          (input.gewicht as number | undefined) ?? prev.gewicht,
        );
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: "Note aktualisiert.",
          undoFn: async () => {
            await updateNote(input.note_id as string, prev.punkte, prev.kategorie, prev.bezeichnung ?? undefined, prev.gewicht);
          },
        };
      }
      case "note_loeschen": {
        const r = await removeNote(input.note_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Note gelöscht.", undoFn: null };
      }

      // ── Klausuren ──
      case "klausur_erstellen": {
        const r = await addKlausur(
          input.titel as string,
          input.datum as string,
          input.fach_id as string | undefined,
        );
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: `Klausur "${input.titel}" am ${input.datum} eingetragen.`,
          undoFn: null,
        };
      }
      case "klausur_bearbeiten": {
        if (!snapshot) return { ok: false, summary: "Klausur nicht gefunden.", undoFn: null };
        const prev = snapshot as { titel: string; datum: string };
        const r = await updateKlausur(input.klausur_id as string, {
          titel: input.titel as string | undefined,
          datum: input.datum as string | undefined,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: "Klausur aktualisiert.",
          undoFn: async () => {
            await updateKlausur(input.klausur_id as string, { titel: prev.titel, datum: prev.datum });
          },
        };
      }
      case "klausur_loeschen": {
        const r = await removeKlausur(input.klausur_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Klausur gelöscht.", undoFn: null };
      }

      // ── Hausaufgaben ──
      case "aufgabe_erstellen": {
        const r = await addHausaufgabe({
          fachId: (input.fach_id as string | undefined) ?? null,
          beschreibung: input.beschreibung as string,
          faelligAm: input.faellig_am as string,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: `Hausaufgabe "${input.beschreibung}" eingetragen.`,
          undoFn: null,
        };
      }
      case "aufgabe_erledigt": {
        const prev = snapshot as { erledigt: boolean } | null;
        const r = await toggleErledigt(input.aufgabe_id as string, input.erledigt as boolean);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: `Hausaufgabe als ${input.erledigt ? "erledigt" : "offen"} markiert.`,
          undoFn: prev
            ? async () => { await toggleErledigt(input.aufgabe_id as string, prev.erledigt); }
            : null,
        };
      }
      case "aufgabe_loeschen": {
        const r = await removeHausaufgabe(input.aufgabe_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Hausaufgabe gelöscht.", undoFn: null };
      }

      // ── Stundenplan ──
      case "stunde_erstellen": {
        const r = await addStunde({
          fachId: (input.fach_id as string | undefined) ?? null,
          wochentag: input.wochentag as number,
          zeitStart: input.zeit_start as string,
          zeitEnd: input.zeit_end as string,
          raum: (input.raum as string | undefined) ?? null,
          lehrer: (input.lehrer as string | undefined) ?? null,
          wocheTyp: null,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Stunde eingetragen.", undoFn: null };
      }
      case "stunde_bearbeiten": {
        if (!snapshot) return { ok: false, summary: "Stunde nicht gefunden.", undoFn: null };
        const prev = snapshot as { wochentag: number; zeit_start: string; zeit_end: string; fach_id: string | null; raum: string | null; lehrer: string | null; woche_typ: "A" | "B" | null };
        const r = await updateStunde(input.stunde_id as string, {
          fachId: (input.fach_id as string | undefined) ?? prev.fach_id,
          wochentag: (input.wochentag as number | undefined) ?? prev.wochentag,
          zeitStart: (input.zeit_start as string | undefined) ?? prev.zeit_start.slice(0, 5),
          zeitEnd: (input.zeit_end as string | undefined) ?? prev.zeit_end.slice(0, 5),
          raum: (input.raum as string | undefined) ?? prev.raum,
          lehrer: (input.lehrer as string | undefined) ?? prev.lehrer,
          wocheTyp: prev.woche_typ,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return {
          ok: true,
          summary: "Stunde aktualisiert.",
          undoFn: async () => {
            await updateStunde(input.stunde_id as string, {
              fachId: prev.fach_id,
              wochentag: prev.wochentag,
              zeitStart: prev.zeit_start.slice(0, 5),
              zeitEnd: prev.zeit_end.slice(0, 5),
              raum: prev.raum,
              lehrer: prev.lehrer,
              wocheTyp: prev.woche_typ,
            });
          },
        };
      }
      case "stunde_loeschen": {
        const r = await removeStunde(input.stunde_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Stunde gelöscht.", undoFn: null };
      }

      // ── Fächer ──
      case "fach_erstellen": {
        const r = await addFach(
          input.name as string,
          input.halbjahr as string,
          (input.niveau as "grund" | "erhoeht") ?? "grund",
        );
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        const newId = r.id;
        return {
          ok: true,
          summary: `Fach "${input.name}" angelegt.`,
          undoFn: async () => { await removeFach(newId); },
        };
      }
      case "fach_bearbeiten": {
        const r = await updateFach(input.fach_id as string, {
          name: input.name as string | undefined,
          niveau: input.niveau as string | undefined,
          farbe: input.farbe as string | undefined,
        });
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Fach aktualisiert.", undoFn: null };
      }
      case "fach_loeschen": {
        const r = await removeFach(input.fach_id as string);
        if (!r.ok) return { ok: false, summary: r.error, undoFn: null };
        return { ok: true, summary: "Fach gelöscht.", undoFn: null };
      }

      default:
        return { ok: false, summary: "Unbekanntes Tool.", undoFn: null };
    }
  } catch (e) {
    return { ok: false, summary: e instanceof Error ? e.message : "Fehler.", undoFn: null };
  }
}

// ── Hauptkomponente ────────────────────────────────────────────────────

const STORAGE_KEY = "coach-chat-v1";

export function CoachChat() {
  const [uiMessages, setUiMessages] = useState<UiMsg[]>([
    { kind: "text", role: "assistant", content: STARTER },
  ]);
  const [apiMessages, setApiMessages] = useState<ClientMessage[]>([]);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [lastUndoVisible, setLastUndoVisible] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persisted state nach Mount laden
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          uiMessages: (UiMsg & { kind: "text" })[];
          apiMessages: ClientMessage[];
        };
        if (saved.uiMessages?.length) setUiMessages(saved.uiMessages);
        if (saved.apiMessages?.length) setApiMessages(saved.apiMessages);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // State bei jeder Änderung speichern (nur text-Nachrichten, keine ephemeren)
  useEffect(() => {
    if (!hydrated) return;
    try {
      const persistable = uiMessages.filter((m): m is UiMsg & { kind: "text" } => m.kind === "text");
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ uiMessages: persistable, apiMessages }));
    } catch { /* ignore */ }
  }, [uiMessages, apiMessages, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [uiMessages]);

  // ── Undo ausführen ──────────────────────────────────────────────────

  async function handleUndo() {
    if (!undoStack.length) return;
    const entry = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setLastUndoVisible(false);
    await entry.undo();
    setUiMessages((prev) => [
      ...prev,
      { kind: "result", success: true, summary: `Rückgängig: ${entry.description}` },
    ]);
  }

  // ── Nachricht senden ────────────────────────────────────────────────

  async function send(overrideInput?: string) {
    const text = (overrideInput ?? input).trim();
    if (!text || loading) return;

    if (/^r[üu]ckg[äa]ngig$/i.test(text)) {
      setInput("");
      if (undoStack.length) {
        await handleUndo();
      } else {
        setUiMessages((prev) => [
          ...prev,
          { kind: "text", role: "user", content: text },
          { kind: "text", role: "assistant", content: "Nichts zum Rückgängigmachen vorhanden." },
        ]);
      }
      return;
    }

    const userMsg: ClientMessage = { role: "user", content: text };
    const nextApiMessages = [...apiMessages, userMsg];

    setUiMessages((prev) => [...prev, { kind: "text", role: "user", content: text }, { kind: "loading" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextApiMessages }),
      });

      const data: CoachApiResponse = await res.json();
      setLoading(false);
      setUiMessages((prev) => prev.filter((m) => m.kind !== "loading"));

      if (data.type === "text") {
        setApiMessages([...nextApiMessages, { role: "assistant", content: data.content }]);
        setUiMessages((prev) => [...prev, { kind: "text", role: "assistant", content: data.content }]);
      } else {
        setApiMessages([
          ...nextApiMessages,
          { role: "tool_call", tool_use_id: data.tool_use_id, name: data.name, input: data.input },
        ]);
        setUiMessages((prev) => [
          ...prev,
          {
            kind: "pending",
            tool_use_id: data.tool_use_id,
            preview: data.preview,
            name: data.name,
            input: data.input,
            snapshot: data.snapshot,
          },
        ]);
      }
    } catch {
      setLoading(false);
      setUiMessages((prev) => [
        ...prev.filter((m) => m.kind !== "loading"),
        { kind: "text", role: "assistant", content: "Fehler — bitte nochmal versuchen." },
      ]);
    } finally {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  // ── Tool-Call bestätigen ────────────────────────────────────────────

  async function confirmTool(msg: UiMsg & { kind: "pending" }) {
    setUiMessages((prev) => prev.map((m) => (m === msg ? { kind: "loading" as const } : m)));
    setLoading(true);

    const exec = await executeTool(msg.name, msg.input, msg.snapshot);

    const toolResultMsg: ClientMessage = {
      role: "tool_result",
      tool_use_id: msg.tool_use_id,
      output: exec.ok ? `Erfolg: ${exec.summary}` : `Fehler: ${exec.summary}`,
    };
    const nextApiMessages = [...apiMessages, toolResultMsg];
    setApiMessages(nextApiMessages);

    if (exec.ok && exec.undoFn) {
      const entry: UndoEntry = {
        id: crypto.randomUUID(),
        description: exec.summary,
        undo: exec.undoFn,
      };
      setUndoStack((prev) => [...prev.slice(-4), entry]);
      setLastUndoVisible(true);
      setTimeout(() => setLastUndoVisible(false), 5000);
    }

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextApiMessages }),
      });
      const data: CoachApiResponse = await res.json();
      setLoading(false);
      setUiMessages((prev) => prev.filter((m) => m.kind !== "loading"));

      if (data.type === "text") {
        setApiMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        setUiMessages((prev) => [...prev, { kind: "text", role: "assistant", content: data.content }]);
      }
    } catch {
      setLoading(false);
      setUiMessages((prev) => [
        ...prev.filter((m) => m.kind !== "loading"),
        { kind: "result", success: exec.ok, summary: exec.summary },
      ]);
    }
  }

  // ── Tool-Call abbrechen ─────────────────────────────────────────────

  async function cancelTool(msg: UiMsg & { kind: "pending" }) {
    const toolResultMsg: ClientMessage = {
      role: "tool_result",
      tool_use_id: msg.tool_use_id,
      output: "Abgebrochen — der User hat die Aktion nicht bestätigt.",
    };
    const nextApiMessages = [...apiMessages, toolResultMsg];
    setApiMessages(nextApiMessages);
    setUiMessages((prev) =>
      prev.map((m) =>
        m === msg ? { kind: "result" as const, success: false, summary: "Abgebrochen." } : m,
      ),
    );

    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextApiMessages }),
      });
      const data: CoachApiResponse = await res.json();
      if (data.type === "text") {
        setApiMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        setUiMessages((prev) => [...prev, { kind: "text", role: "assistant", content: data.content }]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <section
      className="animate-fade-up rounded-[28px] border border-border"
      style={{ background: "var(--card-grad)", animationDelay: "0.08s" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3 sm:px-6">
        <Bot className="size-4 text-brand" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          KI-Coach
        </span>
        <span className="ml-auto font-mono text-[9px] text-text-mute">Haiku 4.5</span>
      </div>

      {/* Nachrichten */}
      <div className="max-h-80 overflow-y-auto px-5 py-4 sm:px-6">
        <div className="space-y-3">
          {uiMessages.map((m, i) => {
            if (m.kind === "loading") {
              return (
                <div key={i} className="flex justify-start">
                  <div
                    className="rounded-2xl rounded-bl-sm px-4 py-2.5 text-text-mute"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <Loader2 className="size-3 animate-spin" />
                  </div>
                </div>
              );
            }

            if (m.kind === "text") {
              return (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 font-sans text-sm leading-relaxed ${
                      m.role === "user"
                        ? "rounded-br-sm font-medium text-black"
                        : "rounded-bl-sm text-foreground"
                    }`}
                    style={
                      m.role === "user"
                        ? { background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }
                        : { background: "var(--surface-2)" }
                    }
                  >
                    {m.content}
                  </div>
                </div>
              );
            }

            if (m.kind === "pending") {
              return (
                <div key={i} className="flex justify-start">
                  <div
                    className="w-full max-w-[90%] rounded-2xl rounded-bl-sm border px-4 py-3"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "color-mix(in srgb, var(--brand) 30%, var(--border))",
                    }}
                  >
                    <p className="mb-3 font-sans text-sm text-foreground">{m.preview}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void confirmTool(m)}
                        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[11px] font-semibold text-black transition-opacity hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-2))" }}
                      >
                        <Check className="size-3" />
                        Bestätigen
                      </button>
                      <button
                        onClick={() => void cancelTool(m)}
                        className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 font-mono text-[11px] font-semibold text-text-mute transition-colors hover:text-foreground"
                        style={{ background: "var(--surface-1)" }}
                      >
                        <X className="size-3" />
                        Abbrechen
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (m.kind === "result") {
              return (
                <div key={i} className="flex justify-start">
                  <div
                    className="flex items-center gap-2 rounded-2xl rounded-bl-sm px-4 py-2.5 font-mono text-xs"
                    style={{
                      background: m.success
                        ? "color-mix(in srgb, var(--success) 15%, var(--surface-2))"
                        : "color-mix(in srgb, var(--error, #ef4444) 15%, var(--surface-2))",
                      color: m.success ? "var(--success)" : "var(--error, #ef4444)",
                    }}
                  >
                    {m.success ? <Check className="size-3" /> : <X className="size-3" />}
                    {m.summary}
                  </div>
                </div>
              );
            }

            return null;
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Eingabe + Undo */}
      <div className="border-t border-border px-4 py-3 sm:px-5">
        {lastUndoVisible && undoStack.length > 0 && (
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-mute">
              {undoStack[undoStack.length - 1].description}
            </span>
            <button
              onClick={() => void handleUndo()}
              className="flex items-center gap-1 font-mono text-[10px] font-semibold text-brand transition-opacity hover:opacity-70"
            >
              <RotateCcw className="size-3" />
              Rückgängig
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Frag mich was oder gib einen Befehl…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-border bg-surface-2 px-3 py-2 font-sans text-sm text-foreground placeholder:text-text-mute focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
            style={{ maxHeight: "96px", overflowY: "auto" }}
          />
          <button
            onClick={() => void send()}
            disabled={!input.trim() || loading}
            className="flex size-9 flex-shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, var(--brand), var(--brand-2))",
              boxShadow: input.trim() ? "0 4px 14px color-mix(in srgb, var(--brand) 40%, transparent)" : "none",
            }}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin text-black" />
            ) : (
              <Send className="size-4 text-black" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
