"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { removeFach, updateFach, addFach } from "@/lib/actions/schule";
import type { FachRow } from "@/lib/grades/db";

type Niveau = "grund" | "erhoeht";

const FARB_PALETTE = [
  // Blau-Spektrum
  "#1da1ff", "#0ea5e9", "#06b6d4",
  // Violett-Spektrum
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  // Pink/Rot
  "#ec4899", "#f43f5e", "#ef4444",
  // Warm
  "#f97316", "#f59e0b", "#eab308",
  // Grün-Spektrum
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  // Neutral
  "#64748b",
];

export function FaecherVerwaltung({
  faecher,
  halbjahr,
}: {
  faecher: FachRow[];
  halbjahr: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);

  // Fach hinzufügen
  const [neuerName, setNeuerName] = useState("");
  const [neuesNiveau, setNeuesNiveau] = useState<Niveau>("grund");
  const [showAddForm, setShowAddForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  function pickColor(fachId: string, farbe: string) {
    start(async () => {
      const res = await updateFach(fachId, { farbe });
      if (!res.ok) { toast.error(res.error); return; }
      setColorPickerId(null);
      router.refresh();
    });
  }

  function startEdit(f: FachRow) {
    setConfirmDeleteId(null);
    setColorPickerId(null);
    setShowAddForm(false);
    setEditingId(f.id);
    setEditName(f.name);
    setTimeout(() => inputRef.current?.select(), 30);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  function submitRename(fachId: string) {
    const trimmed = editName.trim();
    if (!trimmed) { toast.error("Name darf nicht leer sein."); return; }
    start(async () => {
      const res = await updateFach(fachId, { name: trimmed });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Fach umbenannt.");
      setEditingId(null);
      router.refresh();
    });
  }

  function toggleNiveau(f: FachRow) {
    const newNiveau: Niveau = f.niveau === "grund" ? "erhoeht" : "grund";
    start(async () => {
      const res = await updateFach(f.id, { niveau: newNiveau });
      if (!res.ok) { toast.error(res.error); return; }
      router.refresh();
    });
  }

  function submitDelete(fachId: string) {
    start(async () => {
      const res = await removeFach(fachId);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Fach gelöscht.");
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  function submitAdd() {
    const trimmed = neuerName.trim();
    if (!trimmed) return;
    start(async () => {
      const res = await addFach(trimmed, halbjahr, neuesNiveau);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(`${trimmed} hinzugefügt.`);
      setNeuerName("");
      setNeuesNiveau("grund");
      setShowAddForm(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {faecher.length === 0 && !showAddForm && (
        <p className="font-mono text-sm text-text-mute">
          Noch keine Fächer angelegt.
        </p>
      )}

      {faecher.map((f) => {
        const isEditing = editingId === f.id;
        const isConfirming = confirmDeleteId === f.id;

        return (
          <div
            key={f.id}
            className="rounded-2xl border border-border px-4 py-3 transition-colors"
            style={{ background: "var(--surface-2)" }}
          >
            {isEditing ? (
              <div className="flex items-center gap-2">
                <div className="size-3 shrink-0 rounded-full" style={{ background: f.farbe ?? "#1da1ff" }} />
                <input
                  ref={inputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitRename(f.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1 rounded-lg border border-border bg-surface-1 px-3 py-1.5 font-display text-sm font-bold text-foreground outline-none focus:border-brand"
                  autoFocus
                />
                <button onClick={() => submitRename(f.id)} disabled={pending} className="flex size-7 items-center justify-center rounded-lg transition-colors hover:text-brand disabled:opacity-40" title="Speichern">
                  <Check className="size-4" />
                </button>
                <button onClick={cancelEdit} className="flex size-7 items-center justify-center rounded-lg text-text-mute transition-colors hover:text-foreground" title="Abbrechen">
                  <X className="size-4" />
                </button>
              </div>
            ) : isConfirming ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-3 shrink-0 rounded-full" style={{ background: f.farbe ?? "#1da1ff" }} />
                  <span className="font-display text-sm font-bold">{f.name}</span>
                </div>
                <p className="font-mono text-[11px] text-amber-400">
                  Alle Noten für dieses Fach werden mitgelöscht.
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => submitDelete(f.id)} disabled={pending} className="rounded-lg bg-red-500/20 px-3 py-1.5 font-mono text-[11px] font-bold text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-40">
                    {pending ? "Wird gelöscht…" : "Ja, löschen"}
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)} disabled={pending} className="font-mono text-[11px] text-text-mute transition-colors hover:text-foreground">
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {/* Farbpunkt — klickbar */}
                  <button
                    onClick={() => setColorPickerId(colorPickerId === f.id ? null : f.id)}
                    className="group relative shrink-0 rounded-full p-0.5 transition-all hover:ring-2 hover:ring-white/20"
                    title="Farbe wählen"
                    disabled={pending}
                  >
                    <div className="size-3 rounded-full" style={{ background: f.farbe ?? "#1da1ff" }} />
                  </button>
                  <span className="flex-1 font-display text-sm font-bold">{f.name}</span>
                  {/* GK/LK Toggle */}
                  <button
                    onClick={() => toggleNiveau(f)}
                    disabled={pending}
                    className={`rounded-lg px-2.5 py-2 font-mono text-[11px] font-bold transition-colors disabled:opacity-50 ${
                      f.niveau === "erhoeht"
                        ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
                        : "bg-surface-3 text-text-mute hover:bg-surface-3 hover:text-foreground"
                    }`}
                    title="GK/LK wechseln"
                  >
                    {f.niveau === "erhoeht" ? "LK" : "GK"}
                  </button>
                  <button onClick={() => startEdit(f)} className="flex size-7 items-center justify-center rounded-lg text-text-mute transition-colors hover:text-foreground" title="Umbenennen">
                    <Pencil className="size-3.5" />
                  </button>
                  <button onClick={() => { setEditingId(null); setColorPickerId(null); setConfirmDeleteId(f.id); }} className="flex size-7 items-center justify-center rounded-lg text-text-mute transition-colors hover:text-red-400" title="Löschen">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Color Picker Popup */}
                {colorPickerId === f.id && (
                  <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface-1 p-3">
                    {FARB_PALETTE.map((farbe) => (
                      <button
                        key={farbe}
                        onClick={() => pickColor(f.id, farbe)}
                        disabled={pending}
                        className="size-6 rounded-full transition-transform hover:scale-110 disabled:opacity-50"
                        style={{
                          background: farbe,
                          outline: (f.farbe ?? "#1da1ff") === farbe ? `2px solid ${farbe}` : "none",
                          outlineOffset: "2px",
                        }}
                        title={farbe}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Fach hinzufügen */}
      {showAddForm ? (
        <div className="rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={addInputRef}
              value={neuerName}
              onChange={(e) => setNeuerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitAdd();
                if (e.key === "Escape") { setShowAddForm(false); setNeuerName(""); }
              }}
              placeholder="Fachname…"
              autoFocus
              className="flex-1 rounded-lg border border-border bg-surface-1 px-3 py-1.5 font-display text-sm font-bold outline-none focus:border-brand"
            />
            <select
              value={neuesNiveau}
              onChange={(e) => setNeuesNiveau(e.target.value as Niveau)}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 font-mono text-xs outline-none focus:border-brand"
            >
              <option value="grund">GK</option>
              <option value="erhoeht">LK</option>
            </select>
            <button
              onClick={submitAdd}
              disabled={!neuerName.trim() || pending}
              className="flex size-7 items-center justify-center rounded-lg text-brand transition-colors hover:bg-brand/10 disabled:opacity-40"
              title="Hinzufügen"
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNeuerName(""); }}
              className="flex size-7 items-center justify-center rounded-lg text-text-mute transition-colors hover:text-foreground"
              title="Abbrechen"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setShowAddForm(true); setTimeout(() => addInputRef.current?.focus(), 30); }}
          className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-text-mute transition-colors hover:border-brand/40 hover:text-brand"
        >
          <Plus className="size-4" />
          Fach hinzufügen
        </button>
      )}
    </div>
  );
}
