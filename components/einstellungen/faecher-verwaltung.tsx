"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { removeFach, updateFach } from "@/lib/actions/schule";
import type { FachRow } from "@/lib/grades/db";

export function FaecherVerwaltung({ faecher }: { faecher: FachRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(f: FachRow) {
    setConfirmDeleteId(null);
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

  function submitDelete(fachId: string) {
    start(async () => {
      const res = await removeFach(fachId);
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Fach gelöscht.");
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  if (faecher.length === 0) {
    return (
      <p className="font-mono text-sm text-text-mute">
        Noch keine Fächer angelegt.
      </p>
    );
  }

  return (
    <div className="space-y-2">
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
              /* Umbenennen */
              <div className="flex items-center gap-2">
                <div
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: f.farbe ?? "#1da1ff" }}
                />
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
                <button
                  onClick={() => submitRename(f.id)}
                  disabled={pending}
                  className="flex size-7 items-center justify-center rounded-lg transition-colors hover:text-brand disabled:opacity-40"
                  title="Speichern"
                >
                  <Check className="size-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex size-7 items-center justify-center rounded-lg text-text-mute transition-colors hover:text-foreground"
                  title="Abbrechen"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : isConfirming ? (
              /* Löschen bestätigen */
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: f.farbe ?? "#1da1ff" }}
                  />
                  <span className="font-display text-sm font-bold">{f.name}</span>
                </div>
                <p className="font-mono text-[11px] text-amber-400">
                  Alle Noten für dieses Fach werden mitgelöscht. Stunden bleiben erhalten, verlieren aber die Fach-Zuordnung.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => submitDelete(f.id)}
                    disabled={pending}
                    className="rounded-lg bg-red-500/20 px-3 py-1.5 font-mono text-[11px] font-bold text-red-400 transition-colors hover:bg-red-500/30 disabled:opacity-40"
                  >
                    {pending ? "Wird gelöscht…" : "Ja, löschen"}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    disabled={pending}
                    className="font-mono text-[11px] text-text-mute transition-colors hover:text-foreground"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              /* Normal */
              <div className="flex items-center gap-3">
                <div
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: f.farbe ?? "#1da1ff" }}
                />
                <span className="flex-1 font-display text-sm font-bold">{f.name}</span>
                <span className="font-mono text-[10px] text-text-mute">
                  {f.niveau === "erhoeht" ? "erhöht" : "Grund"}
                </span>
                <button
                  onClick={() => startEdit(f)}
                  className="flex size-7 items-center justify-center rounded-lg text-text-mute transition-colors hover:text-foreground"
                  title="Umbenennen"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => { setEditingId(null); setConfirmDeleteId(f.id); }}
                  className="flex size-7 items-center justify-center rounded-lg text-text-mute transition-colors hover:text-red-400"
                  title="Löschen"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
