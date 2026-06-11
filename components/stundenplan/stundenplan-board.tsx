"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, CalendarDays, ChevronLeft, ChevronRight, BanIcon, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addStunde,
  removeStunde,
  updateStunde,
  addEntfall,
  removeEntfall,
  addTagEntfall,
  removeTagEntfall,
} from "@/lib/actions/stundenplan";
import { updateFach } from "@/lib/actions/schule";
import { hexToRgba, fmtZeit, FACH_FALLBACK_FARBE } from "@/lib/stundenplan/types";
import type { StundeRow, HausaufgabeRow, EntfallRow } from "@/lib/stundenplan/types";
import type { FachRow, KlausurRow } from "@/lib/grades/db";
import { FotoImport } from "@/components/stundenplan/foto-import";

// ── Zeit-Raster ───────────────────────────────────────────────────────────────
const START_H = 7;
const END_H = 19;
const TOTAL_MIN = (END_H - START_H) * 60;

function minVonZeit(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function topPct(t: string) {
  return Math.max(0, ((minVonZeit(t) - START_H * 60) / TOTAL_MIN) * 100);
}
function hoehePct(start: string, end: string) {
  return Math.max(2, ((minVonZeit(end) - minVonZeit(start)) / TOTAL_MIN) * 100);
}

// ── Wochen-Helpers ────────────────────────────────────────────────────────────
function isoVonDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function wocheDaten(offset: number): string[] {
  const heute = new Date();
  const tag = heute.getDay() || 7;
  const montag = new Date(heute);
  montag.setHours(12, 0, 0, 0);
  montag.setDate(heute.getDate() - tag + 1 + offset * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(montag);
    d.setDate(montag.getDate() + i);
    return isoVonDate(d);
  });
}

function kwVonIso(iso: string): number {
  const d = new Date(iso + "T12:00:00");
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 6) / 7);
}

function fmtTagDatum(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}.`;
}

function toLocalIso(datum: string): string {
  return datum.slice(0, 10);
}

function fmtDatum(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}.${m}.`;
}

// ── Typen ─────────────────────────────────────────────────────────────────────
const TAGE = ["Mo", "Di", "Mi", "Do", "Fr"] as const;
const STUNDEN_LABELS = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

interface StundeAngereichert extends StundeRow {
  fach?: FachRow;
}

interface FormWerte {
  wochentag: number;
  zeitStart: string;
  zeitEnd: string;
  fachId: string;
  bezeichnung: string;
  lehrer: string;
  raum: string;
}

const FORM_LEER: FormWerte = {
  wochentag: 1,
  zeitStart: "08:00",
  zeitEnd: "09:30",
  fachId: "",
  bezeichnung: "",
  lehrer: "",
  raum: "",
};

// ── Formular-Felder (shared) ──────────────────────────────────────────────────
function StundeFormFelder({
  werte,
  faecher,
  onChange,
}: {
  werte: FormWerte;
  faecher: FachRow[];
  onChange: (v: Partial<FormWerte>) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">Tag</label>
        <select
          value={werte.wochentag}
          onChange={(e) => onChange({ wochentag: Number(e.target.value) })}
          className="h-9 w-full rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-foreground"
        >
          {TAGE.map((t, i) => <option key={t} value={i + 1}>{t}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">Beginn</label>
        <Input type="time" value={werte.zeitStart} onChange={(e) => onChange({ zeitStart: e.target.value })} className="h-9 bg-surface-2 font-mono text-sm" />
      </div>
      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">Ende</label>
        <Input type="time" value={werte.zeitEnd} onChange={(e) => onChange({ zeitEnd: e.target.value })} className="h-9 bg-surface-2 font-mono text-sm" />
      </div>
      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">Fach</label>
        <select
          value={werte.fachId}
          onChange={(e) => onChange({ fachId: e.target.value })}
          className="h-9 w-full rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-foreground"
        >
          <option value="">Fach wählen (optional)</option>
          {faecher.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      {!werte.fachId && (
        <div className="space-y-1">
          <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">Bezeichnung</label>
          <Input
            value={werte.bezeichnung}
            onChange={(e) => onChange({ bezeichnung: e.target.value })}
            placeholder="z. B. Freistunde, Sport-AG …"
            className="h-9 bg-surface-2 font-mono text-sm"
          />
        </div>
      )}
      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">Lehrer</label>
        <Input value={werte.lehrer} onChange={(e) => onChange({ lehrer: e.target.value })} placeholder="Hr. Müller (optional)" className="h-9 bg-surface-2 font-mono text-sm" />
      </div>
      <div className="space-y-1">
        <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">Raum</label>
        <Input value={werte.raum} onChange={(e) => onChange({ raum: e.target.value })} placeholder="R203 (optional)" className="h-9 bg-surface-2 font-mono text-sm" />
      </div>
    </div>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────
export function StundenplanBoard({
  stunden,
  faecher,
  alleFaecher,
  hausaufgaben,
  klausuren,
  entfaelle,
}: {
  stunden: StundeRow[];
  faecher: FachRow[];        // Aktuelles Halbjahr → nur für Dropdown
  alleFaecher: FachRow[];    // Alle Halbjahre → für Farb/Name-Anzeige bestehender Stunden
  hausaufgaben: HausaufgabeRow[];
  klausuren: KlausurRow[];
  entfaelle: EntfallRow[];
}) {
  const fachMap = new Map(alleFaecher.map((f) => [f.id, f]));
  const angereichert: StundeAngereichert[] = stunden.map((s) => ({
    ...s,
    fach: s.fach_id ? fachMap.get(s.fach_id) : undefined,
  }));

  // Fast lookup: "stundeId:datum" → "entfall" | "krank"
  const entfallMap = new Map(entfaelle.map((e) => [`${e.stunde_id}:${e.datum}`, e.typ]));

  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStunde, setEditingStunde] = useState<StundeAngereichert | null>(null);
  const [addWerte, setAddWerte] = useState<FormWerte>(FORM_LEER);
  const [editWerte, setEditWerte] = useState<FormWerte>(FORM_LEER);
  const [editFachName, setEditFachName] = useState<string>("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const [jetztMin, setJetztMin] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date();
      setJetztMin(n.getHours() * 60 + n.getMinutes());
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const heuteWochentag = new Date().getDay();
  const heuteIndex = weekOffset === 0 && heuteWochentag >= 1 && heuteWochentag <= 5
    ? heuteWochentag - 1
    : -1;
  const jetztTopPct =
    heuteIndex >= 0
      ? Math.max(0, Math.min(100, ((jetztMin - START_H * 60) / TOTAL_MIN) * 100))
      : -1;

  const tagIsos = wocheDaten(weekOffset);
  const kw = kwVonIso(tagIsos[0]);

  // Events (HA + Klausuren) pro Wochentag
  const eventsProTag = tagIsos.map((iso) => {
    const kls = klausuren.filter((k) => toLocalIso(k.datum) === iso);
    const has = hausaufgaben.filter((h) => !h.erledigt && h.faellig_am === iso);
    return { kls, has };
  });

  const proTag = Array.from({ length: 5 }, (_, i) =>
    angereichert.filter((s) => s.wochentag === i + 1),
  );

  // Entfall-Helpers
  function entfallTyp(stundeId: string, tagIndex: number): "entfall" | "krank" | null {
    return entfallMap.get(`${stundeId}:${tagIsos[tagIndex]}`) ?? null;
  }

  function tagAlleTyp(tagIndex: number): "entfall" | "krank" | "gemischt" | null {
    const stundenAmTag = proTag[tagIndex];
    if (!stundenAmTag.length) return null;
    const typen = stundenAmTag.map((s) => entfallMap.get(`${s.id}:${tagIsos[tagIndex]}`) ?? null);
    if (typen.every((t) => t === null)) return null;
    if (typen.every((t) => t === "entfall")) return "entfall";
    if (typen.every((t) => t === "krank")) return "krank";
    return "gemischt";
  }

  // Datum der editierten Stunde in der aktuellen Woche
  const editDatum = editingStunde ? tagIsos[editingStunde.wochentag - 1] : null;
  const editTyp = editingStunde && editDatum
    ? entfallMap.get(`${editingStunde.id}:${editDatum}`) ?? null
    : null;

  function validiereZeiten(w: FormWerte): boolean {
    if (!w.zeitStart || !w.zeitEnd) { toast.error("Start- und Endzeit sind nötig."); return false; }
    if (w.zeitStart >= w.zeitEnd) { toast.error("Endzeit muss nach Startzeit liegen."); return false; }
    return true;
  }

  function submitAdd() {
    if (!validiereZeiten(addWerte)) return;
    start(async () => {
      const res = await addStunde({
        fachId: addWerte.fachId || null,
        bezeichnung: addWerte.bezeichnung.trim() || null,
        wochentag: addWerte.wochentag,
        zeitStart: addWerte.zeitStart,
        zeitEnd: addWerte.zeitEnd,
        raum: addWerte.raum.trim() || null,
        lehrer: addWerte.lehrer.trim() || null,
        wocheTyp: null,
      });
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      toast.success("Stunde eingetragen.");
      setShowAddForm(false);
      setAddWerte(FORM_LEER);
      router.refresh();
    });
  }

  function submitEdit() {
    if (!editingStunde || !validiereZeiten(editWerte)) return;
    start(async () => {
      const neuerName = editFachName.trim();
      const alterName = editingStunde.fach?.name ?? "";
      if (editWerte.fachId && neuerName && neuerName !== alterName) {
        const renameRes = await updateFach(editWerte.fachId, { name: neuerName });
        if (!renameRes.ok) { toast.error(`Fach umbenennen: ${renameRes.error}`); return; }
      }
      const res = await updateStunde(editingStunde.id, {
        fachId: editWerte.fachId || null,
        bezeichnung: editWerte.bezeichnung.trim() || null,
        wochentag: editWerte.wochentag,
        zeitStart: editWerte.zeitStart,
        zeitEnd: editWerte.zeitEnd,
        raum: editWerte.raum.trim() || null,
        lehrer: editWerte.lehrer.trim() || null,
        wocheTyp: editingStunde.woche_typ,
      });
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      toast.success("Stunde aktualisiert.");
      setEditingStunde(null);
      router.refresh();
    });
  }

  function deleteStunde(id: string) {
    start(async () => {
      const res = await removeStunde(id);
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      toast.success("Stunde gelöscht.");
      setEditingStunde(null);
      router.refresh();
    });
  }

  function setStundeTyp(stundeId: string, datum: string, typ: "entfall" | "krank" | null) {
    start(async () => {
      const res = typ === null
        ? await removeEntfall(stundeId, datum)
        : await addEntfall(stundeId, datum, typ);
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      const label = typ === null ? "Markierung aufgehoben." : typ === "krank" ? "Als Krank markiert." : "Als Entfall markiert.";
      toast.success(label);
      router.refresh();
    });
  }

  function setTagTyp(datum: string, typ: "entfall" | "krank" | null) {
    start(async () => {
      const res = typ === null
        ? await removeTagEntfall(datum)
        : await addTagEntfall(datum, typ);
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      const label = typ === null ? "Markierung aufgehoben." : typ === "krank" ? "Tag als Krank markiert." : "Ganzer Tag als Entfall markiert.";
      toast.success(label);
      router.refresh();
    });
  }

  function openEdit(s: StundeAngereichert) {
    setShowAddForm(false);
    setEditingStunde(s);
    setEditFachName(s.fach?.name ?? "");
    setEditWerte({
      wochentag: s.wochentag,
      zeitStart: s.zeit_start.slice(0, 5),
      zeitEnd: s.zeit_end.slice(0, 5),
      fachId: s.fach_id ?? "",
      bezeichnung: s.bezeichnung ?? "",
      lehrer: s.lehrer ?? "",
      raum: s.raum ?? "",
    });
  }

  return (
    <div className="animate-fade-up space-y-4">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Stundenplan</h1>
          <p className="mt-1 font-mono text-sm text-text-dim">
            {stunden.length === 0
              ? "Noch keine Stunden eingetragen."
              : `${stunden.length} Stunde${stunden.length !== 1 ? "n" : ""} · Klick zum Bearbeiten`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FotoImport faecher={faecher} />
          <Button
            onClick={() => { setShowAddForm((v) => !v); setEditingStunde(null); }}
            size="sm"
            className="gap-1.5 font-display font-bold"
            style={showAddForm ? { background: "var(--surface-2)", color: "var(--foreground)" } : undefined}
          >
            <Plus className={`size-4 transition-transform ${showAddForm ? "rotate-45" : ""}`} />
            Stunde
          </Button>
        </div>
      </div>

      {/* ── Wochen-Navigation ───────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between rounded-2xl border border-border px-4 py-2.5"
        style={{ background: "var(--card-grad)" }}
      >
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="flex size-8 items-center justify-center rounded-xl text-text-dim transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 font-display text-sm font-extrabold">
            KW {kw}
            {weekOffset === 0 && (
              <span
                className="rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase"
                style={{ background: "color-mix(in srgb, var(--brand) 20%, transparent)", color: "var(--brand)" }}
              >
                diese Woche
              </span>
            )}
            {weekOffset === 1 && <span className="font-mono text-[10px] font-normal text-text-mute">nächste Woche</span>}
            {weekOffset === -1 && <span className="font-mono text-[10px] font-normal text-text-mute">letzte Woche</span>}
            {Math.abs(weekOffset) > 1 && (
              <span className="font-mono text-[10px] font-normal text-text-mute">
                {weekOffset > 0 ? `+${weekOffset} Wochen` : `${weekOffset} Wochen`}
              </span>
            )}
          </div>
          <div className="mt-0.5 font-mono text-xs text-text-dim">
            {fmtTagDatum(tagIsos[0])} – {fmtTagDatum(tagIsos[4])}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="mr-1 rounded-lg px-2 py-1 font-mono text-[10px] text-text-mute transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              heute
            </button>
          )}
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="flex size-8 items-center justify-center rounded-xl text-text-dim transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* ── Add-Formular ────────────────────────────────────────────────── */}
      {showAddForm && (
        <div
          className="animate-fade-up rounded-3xl border border-border p-5"
          style={{ background: "var(--card-grad)" }}
        >
          <h2 className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-text-mute">
            Neue Stunde
          </h2>
          <StundeFormFelder
            werte={addWerte}
            faecher={faecher}
            onChange={(v) => setAddWerte((p) => ({ ...p, ...v }))}
          />
          <div className="mt-4 flex gap-2">
            <Button onClick={submitAdd} disabled={pending} className="font-display font-bold">Eintragen</Button>
            <Button variant="ghost" onClick={() => { setShowAddForm(false); setAddWerte(FORM_LEER); }} className="font-display text-text-dim">Abbrechen</Button>
          </div>
        </div>
      )}

      {/* ── Wochenraster ────────────────────────────────────────────────── */}
      <div
        className="overflow-x-auto rounded-3xl border border-border"
        style={{ background: "var(--card-grad)" }}
      >
        <div className="min-w-[520px]">

          {/* Tag-Header mit Datum + Event-Chips */}
          <div className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] border-b border-border">
            <div />
            {TAGE.map((t, i) => {
              const { kls, has } = eventsProTag[i];
              const istHeute = i === heuteIndex;
              const tagTypInfo = tagAlleTyp(i);
              const hatStunden = proTag[i].length > 0;
              const tagFarbe = tagTypInfo === "entfall" ? "#ff3050" : tagTypInfo === "krank" ? "#f59e0b" : istHeute ? "var(--brand)" : "var(--foreground)";
              return (
                <div
                  key={t}
                  className="group/tag py-2 text-center"
                  style={istHeute ? { background: "color-mix(in srgb, var(--brand) 6%, transparent)" } : undefined}
                >
                  <div className="flex items-center justify-center gap-0.5">
                    <div
                      className="font-display text-sm font-extrabold"
                      style={{
                        color: tagFarbe,
                        textDecoration: tagTypInfo === "entfall" ? "line-through" : undefined,
                      }}
                    >
                      {t}
                    </div>
                    {/* Tag-Markierung Buttons */}
                    {hatStunden && (
                      <div className="flex gap-0.5 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                        <button
                          onClick={() => setTagTyp(tagIsos[i], tagTypInfo === "entfall" ? null : "entfall")}
                          disabled={pending}
                          title={tagTypInfo === "entfall" ? "Entfall aufheben" : "Ganzen Tag als Entfall"}
                          className="flex size-4 items-center justify-center rounded text-text-mute hover:text-[#ff3050]"
                        >
                          <BanIcon className="size-3" />
                        </button>
                        <button
                          onClick={() => setTagTyp(tagIsos[i], tagTypInfo === "krank" ? null : "krank")}
                          disabled={pending}
                          title={tagTypInfo === "krank" ? "Krank aufheben" : "Ganzen Tag krank"}
                          className="flex size-4 items-center justify-center rounded text-text-mute hover:text-[#f59e0b]"
                        >
                          <Thermometer className="size-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-text-mute">{fmtTagDatum(tagIsos[i])}</div>
                  {tagTypInfo === "entfall" && (
                    <div
                      className="mx-auto mt-0.5 w-fit rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                      style={{ background: "rgba(255,48,80,.15)", color: "#ff3050" }}
                    >
                      Entfall
                    </div>
                  )}
                  {tagTypInfo === "krank" && (
                    <div
                      className="mx-auto mt-0.5 w-fit rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                      style={{ background: "rgba(245,158,11,.15)", color: "#f59e0b" }}
                    >
                      Krank
                    </div>
                  )}
                  {(tagTypInfo === null || tagTypInfo === "gemischt") && (kls.length > 0 || has.length > 0) && (
                    <div className="mt-1 flex flex-wrap items-center justify-center gap-0.5 px-1">
                      {kls.map((k) => (
                        <span
                          key={k.id}
                          className="truncate rounded px-1 py-0.5 font-mono text-[10px] font-bold max-w-[60px]"
                          style={{ background: "rgba(255,48,80,.18)", color: "#ff3050" }}
                          title={k.titel}
                        >
                          ✕ {k.titel}
                        </span>
                      ))}
                      {has.map((h) => (
                        <span
                          key={h.id}
                          className="truncate rounded px-1 py-0.5 font-mono text-[10px] font-bold max-w-[60px]"
                          style={{ background: "rgba(251,191,36,.18)", color: "#f59e0b" }}
                          title={h.beschreibung}
                        >
                          HA {h.beschreibung}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
                <div key={h} className="absolute inset-x-0 flex items-start" style={{ top: `${top}%` }}>
                  <div className="flex w-[52px] flex-shrink-0 justify-end pr-2 pt-px">
                    <span className="font-mono text-[10px] text-text-mute leading-none">{h}:00</span>
                  </div>
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
                  left: `calc(52px + (100% - 52px) * ${i / 5})`,
                  width: "1px",
                  background: "color-mix(in srgb, var(--border) 40%, transparent)",
                }}
              />
            ))}

            {/* Heute-Spalte Highlight */}
            {heuteIndex >= 0 && (
              <div
                className="pointer-events-none absolute inset-y-0"
                style={{
                  left: `calc(52px + (100% - 52px) * ${heuteIndex / 5})`,
                  width: `calc((100% - 52px) / 5)`,
                  background: "color-mix(in srgb, var(--brand) 4%, transparent)",
                }}
              />
            )}

            {/* Jetzt-Linie */}
            {heuteIndex >= 0 && jetztTopPct >= 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                style={{ top: `${jetztTopPct}%` }}
              >
                <div className="w-[52px] flex-shrink-0 pr-1.5 text-right">
                  <span className="font-mono text-[10px] font-bold" style={{ color: "#ff3050" }}>
                    {String(Math.floor(jetztMin / 60)).padStart(2, "0")}:{String(jetztMin % 60).padStart(2, "0")}
                  </span>
                </div>
                <div
                  className="flex-1 border-t-2"
                  style={{ borderColor: "#ff3050", opacity: 0.7 }}
                />
                <div
                  className="absolute h-2 w-2 rounded-full"
                  style={{
                    background: "#ff3050",
                    left: `calc(52px + (100% - 52px) * ${heuteIndex / 5})`,
                    transform: "translate(-50%, -50%)",
                    boxShadow: "0 0 8px #ff3050",
                  }}
                />
              </div>
            )}

            {/* Stunden-Blöcke */}
            {proTag.map((stundenAmTag, tagIndex) =>
              stundenAmTag.map((s) => {
                const farbe = s.fach?.farbe ?? FACH_FALLBACK_FARBE;
                const top = topPct(s.zeit_start);
                const height = hoehePct(s.zeit_start, s.zeit_end);
                const isAktiv = editingStunde?.id === s.id;
                const eTyp = entfallTyp(s.id, tagIndex);
                const label = s.fach?.name ?? s.bezeichnung ?? "–";
                const markFarbe = eTyp === "entfall" ? "#ff3050" : eTyp === "krank" ? "#f59e0b" : null;

                return (
                  <div
                    key={s.id}
                    className="absolute px-1 py-0.5"
                    style={{
                      top: `${top}%`,
                      height: `${height}%`,
                      left: `calc(52px + (100% - 52px) * ${tagIndex / 5} + 3px)`,
                      width: `calc((100% - 52px) / 5 - 6px)`,
                    }}
                  >
                    <div
                      onClick={() => openEdit(s)}
                      className="group relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-xl p-2 transition-all hover:scale-[1.02]"
                      style={{
                        background: eTyp === "entfall"
                          ? "rgba(255,48,80,.08)"
                          : eTyp === "krank"
                          ? "rgba(245,158,11,.08)"
                          : hexToRgba(farbe, isAktiv ? 0.3 : 0.18),
                        border: markFarbe
                          ? `1px solid ${markFarbe}55`
                          : `1px solid ${hexToRgba(farbe, isAktiv ? 0.8 : 0.45)}`,
                        boxShadow: isAktiv && !eTyp
                          ? `0 0 0 2px ${hexToRgba(farbe, 0.4)}, 0 4px 16px ${hexToRgba(farbe, 0.2)}`
                          : `0 2px 12px ${hexToRgba(farbe, 0.15)}`,
                        opacity: eTyp ? 0.55 : 1,
                      }}
                    >
                      <div
                        className="absolute left-0 top-0 h-full w-[3px] rounded-l-xl"
                        style={{ background: markFarbe ?? farbe }}
                      />
                      <div className="pl-2">
                        <div
                          className="truncate font-display text-xs font-bold leading-tight"
                          style={{
                            color: markFarbe ?? farbe,
                            textDecoration: eTyp === "entfall" ? "line-through" : undefined,
                          }}
                        >
                          {label}
                        </div>
                        {eTyp && (
                          <div className="font-mono text-[9px] font-bold" style={{ color: markFarbe! }}>
                            {eTyp === "krank" ? "Krank" : "Entfall"}
                          </div>
                        )}
                        {!eTyp && (s.lehrer || s.raum) && (
                          <div className="truncate font-mono text-[9px] text-text-dim">
                            {[s.lehrer, s.raum].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                      <div className="pl-2 font-mono text-[9px] text-text-mute leading-none">
                        {fmtZeit(s.zeit_start)}–{fmtZeit(s.zeit_end)}
                      </div>
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
          <p className="font-mono text-sm text-text-dim">Trag deine erste Stunde ein — Klick auf &quot;+ Stunde&quot; oben.</p>
        </div>
      )}

      {/* ── Edit-Modal ──────────────────────────────────────────────────── */}
      {editingStunde && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingStunde(null)}
          />
          <div
            className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border border-border p-5 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2"
            style={{ background: "var(--surface-1)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-[.1em] text-text-mute">
                Stunde bearbeiten
              </h2>
              <button
                onClick={() => setEditingStunde(null)}
                className="flex size-6 items-center justify-center rounded-full text-text-mute transition-colors hover:text-foreground"
                style={{ background: "var(--surface-2)" }}
              >
                <X className="size-3.5" />
              </button>
            </div>
            <StundeFormFelder
              werte={editWerte}
              faecher={(() => {
                // Stunde's current fach may be from an older halbjahr → always include it
                if (!editingStunde?.fach_id) return faecher;
                const schonDrin = faecher.some((f) => f.id === editingStunde.fach_id);
                if (schonDrin) return faecher;
                const altesFach = alleFaecher.find((f) => f.id === editingStunde.fach_id);
                return altesFach ? [...faecher, altesFach] : faecher;
              })()}
              onChange={(v) => {
                setEditWerte((p) => ({ ...p, ...v }));
                if (v.fachId !== undefined) {
                  const f = alleFaecher.find((f) => f.id === v.fachId);
                  setEditFachName(f?.name ?? "");
                }
              }}
            />
            {editWerte.fachId && (
              <div className="mt-3 space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">
                  Fach umbenennen
                </label>
                <Input
                  value={editFachName}
                  onChange={(e) => setEditFachName(e.target.value)}
                  placeholder="Fachname"
                  className="h-9 bg-surface-2 font-display text-sm font-bold"
                />
              </div>
            )}

            {/* Entfall / Krank für diesen konkreten Tag */}
            {editDatum && (
              <div
                className="mt-4 rounded-xl px-3 py-2.5"
                style={{
                  background: editTyp === "entfall"
                    ? "rgba(255,48,80,.1)"
                    : editTyp === "krank"
                    ? "rgba(245,158,11,.1)"
                    : "var(--surface-2)",
                }}
              >
                <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-text-mute">
                  {fmtDatum(editDatum)} – Diese Woche
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStundeTyp(editingStunde.id, editDatum, editTyp === "entfall" ? null : "entfall")}
                    disabled={pending}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition-colors"
                    style={editTyp === "entfall"
                      ? { background: "rgba(255,48,80,.2)", color: "#ff3050" }
                      : { background: "var(--surface-3, var(--surface-2))", color: "var(--text-dim)" }
                    }
                  >
                    <BanIcon className="size-3" />
                    Entfall
                  </button>
                  <button
                    onClick={() => setStundeTyp(editingStunde.id, editDatum, editTyp === "krank" ? null : "krank")}
                    disabled={pending}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition-colors"
                    style={editTyp === "krank"
                      ? { background: "rgba(245,158,11,.2)", color: "#f59e0b" }
                      : { background: "var(--surface-3, var(--surface-2))", color: "var(--text-dim)" }
                    }
                  >
                    <Thermometer className="size-3" />
                    Krank
                  </button>
                  {editTyp && (
                    <button
                      onClick={() => setStundeTyp(editingStunde.id, editDatum, null)}
                      disabled={pending}
                      className="ml-auto rounded-lg px-2 py-1.5 font-mono text-[10px] text-text-mute transition-colors hover:text-foreground"
                      style={{ background: "var(--surface-3, var(--surface-2))" }}
                    >
                      Aufheben
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <Button onClick={submitEdit} disabled={pending} className="font-display font-bold">
                Speichern
              </Button>
              <Button variant="ghost" onClick={() => setEditingStunde(null)} className="font-display text-text-dim">
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteStunde(editingStunde.id)}
                disabled={pending}
                className="ml-auto font-display"
              >
                Löschen
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
