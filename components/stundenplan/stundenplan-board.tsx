"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, CalendarDays, ChevronLeft, ChevronRight, BanIcon, Thermometer, History, Check, Copy } from "lucide-react";
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
  createHalbjahr,
  setAktivesHalbjahr,
} from "@/lib/actions/stundenplan";
import { updateFach } from "@/lib/actions/schule";
import { hexToRgba, fmtZeit, FACH_FALLBACK_FARBE } from "@/lib/stundenplan/types";
import type { StundeRow, HausaufgabeRow, EntfallRow, HalbjahrRow } from "@/lib/stundenplan/types";
import type { FachRow, KlausurRow } from "@/lib/grades/db";
import { FotoImport } from "@/components/stundenplan/foto-import";
import { FERIEN, type Bundesland } from "@/lib/ferien/ferien-data";
import { getFeiertag } from "@/lib/ferien/feiertage";

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

// ── Ferien-Helpers ────────────────────────────────────────────────────────────
function ferienNameFuerDatum(bundesland: Bundesland | null, iso: string): string | null {
  if (!bundesland) return null;
  const perioden = FERIEN[bundesland] ?? [];
  const d = iso;
  for (const p of perioden) {
    if (d >= p.von && d <= p.bis) return p.name;
  }
  return null;
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

// ── Neues-Halbjahr-Modal ──────────────────────────────────────────────────────
function NeuesHalbjahrModal({
  aktivId,
  onClose,
}: {
  aktivId: string | null;
  onClose: () => void;
}) {
  const [bezeichnung, setBezeichnung] = useState("");
  const [kopieren, setKopieren] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit() {
    if (!bezeichnung.trim()) return;
    start(async () => {
      const res = await createHalbjahr(
        bezeichnung.trim(),
        kopieren && aktivId ? aktivId : undefined,
      );
      if (!res.ok) { toast.error(res.error); return; }
      onClose();
      router.refresh();
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border border-border p-5 sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2"
        style={{ background: "var(--surface-1)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-[.1em] text-text-mute">
            Neues Halbjahr
          </h2>
          <button
            onClick={onClose}
            className="flex size-6 items-center justify-center rounded-full text-text-mute transition-colors hover:text-foreground"
            style={{ background: "var(--surface-2)" }}
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="font-mono text-[10px] uppercase tracking-widest text-text-mute">
              Bezeichnung
            </label>
            <Input
              value={bezeichnung}
              onChange={(e) => setBezeichnung(e.target.value)}
              placeholder="z. B. 11/2, 12/1, Q1 …"
              className="h-9 bg-surface-2 font-display text-sm font-bold"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {aktivId && (
            <button
              onClick={() => setKopieren((v) => !v)}
              className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors"
              style={{
                borderColor: kopieren ? "color-mix(in srgb, var(--brand) 50%, transparent)" : "var(--border)",
                background: kopieren ? "color-mix(in srgb, var(--brand) 8%, transparent)" : "var(--surface-2)",
              }}
            >
              <div
                className="flex size-5 flex-shrink-0 items-center justify-center rounded"
                style={{ background: kopieren ? "var(--brand)" : "var(--surface-3, var(--border))" }}
              >
                {kopieren && <Check className="size-3 text-white" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-display text-sm font-bold">
                  <Copy className="size-3.5" style={{ color: "var(--brand)" }} />
                  Stunden aus aktuellem Halbjahr übernehmen
                </div>
                <div className="font-mono text-[10px] text-text-mute">
                  Fächer &amp; Zeiten kopieren — Entfälle bleiben nicht erhalten
                </div>
              </div>
            </button>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            onClick={submit}
            disabled={pending || !bezeichnung.trim()}
            className="font-display font-bold"
          >
            Anlegen
          </Button>
          <Button variant="ghost" onClick={onClose} className="font-display text-text-dim">
            Abbrechen
          </Button>
        </div>
      </div>
    </>
  );
}

// ── Haupt-Komponente ──────────────────────────────────────────────────────────
export function StundenplanBoard({
  halbjahre,
  aktivesHalbjahrId,
  stunden: stundenInit,
  faecher,
  alleFaecher,
  hausaufgaben,
  klausuren,
  entfaelle: entfaelleInit,
  bundesland,
}: {
  halbjahre: HalbjahrRow[];
  aktivesHalbjahrId: string | null;
  stunden: StundeRow[];
  faecher: FachRow[];
  alleFaecher: FachRow[];
  hausaufgaben: HausaufgabeRow[];
  klausuren: KlausurRow[];
  entfaelle: EntfallRow[];
  bundesland: Bundesland | null;
}) {
  const [alleStunden, setAlleStunden] = useState<StundeRow[]>(stundenInit);
  const [localEntfaelle, setLocalEntfaelle] = useState<EntfallRow[]>(entfaelleInit);
  const [gewaehlteHalbjahrId, setGewaehlteHalbjahrId] = useState<string | null>(aktivesHalbjahrId);
  const [showNeuesHj, setShowNeuesHj] = useState(false);

  // Props syncen nach router.refresh() (FotoImport, NeuesHalbjahr)
  const prevStundenRef = useRef(stundenInit);
  const prevEntfaelleRef = useRef(entfaelleInit);
  useEffect(() => {
    if (stundenInit !== prevStundenRef.current) {
      prevStundenRef.current = stundenInit;
      setAlleStunden(stundenInit);
    }
  }, [stundenInit]);
  useEffect(() => {
    if (entfaelleInit !== prevEntfaelleRef.current) {
      prevEntfaelleRef.current = entfaelleInit;
      setLocalEntfaelle(entfaelleInit);
    }
  }, [entfaelleInit]);

  const stunden = gewaehlteHalbjahrId
    ? alleStunden.filter((s) => s.halbjahr_id === gewaehlteHalbjahrId)
    : alleStunden;

  const istAktivesHalbjahr = !aktivesHalbjahrId || gewaehlteHalbjahrId === aktivesHalbjahrId;

  const fachMap = new Map(alleFaecher.map((f) => [f.id, f]));
  const angereichert: StundeAngereichert[] = stunden.map((s) => ({
    ...s,
    fach: s.fach_id ? fachMap.get(s.fach_id) : undefined,
  }));

  const entfallMap = new Map(
    localEntfaelle.map((e) => [`${e.stunde_id}:${e.datum}`, { typ: e.typ, begruendung: e.begruendung }]),
  );

  const [weekOffset, setWeekOffset] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStunde, setEditingStunde] = useState<StundeAngereichert | null>(null);
  const [addWerte, setAddWerte] = useState<FormWerte>(FORM_LEER);
  const [editWerte, setEditWerte] = useState<FormWerte>(FORM_LEER);
  const [editFachName, setEditFachName] = useState<string>("");
  const [grundEntwurf, setGrundEntwurf] = useState<string>("");
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

  // Ferien + Feiertage pro Tag
  const tagInfos = tagIsos.map((iso) => ({
    ferien: ferienNameFuerDatum(bundesland, iso),
    feiertag: bundesland ? getFeiertag(bundesland, iso) : null,
    kls: klausuren.filter((k) => toLocalIso(k.datum) === iso),
    has: hausaufgaben.filter((h) => !h.erledigt && h.faellig_am === iso),
  }));

  const alleTageFerienName = tagInfos.every((t) => t.ferien !== null)
    ? tagInfos[0].ferien
    : null;

  const proTag = Array.from({ length: 5 }, (_, i) =>
    angereichert.filter((s) => s.wochentag === i + 1),
  );

  function entfallTyp(stundeId: string, tagIndex: number): "entfall" | "krank" | null {
    return entfallMap.get(`${stundeId}:${tagIsos[tagIndex]}`)?.typ ?? null;
  }

  function tagAlleTyp(tagIndex: number): "entfall" | "krank" | "gemischt" | null {
    const stundenAmTag = proTag[tagIndex];
    if (!stundenAmTag.length) return null;
    const typen = stundenAmTag.map((s) => entfallMap.get(`${s.id}:${tagIsos[tagIndex]}`)?.typ ?? null);
    if (typen.every((t) => t === null)) return null;
    if (typen.every((t) => t === "entfall")) return "entfall";
    if (typen.every((t) => t === "krank")) return "krank";
    return "gemischt";
  }

  const editDatum = editingStunde ? tagIsos[editingStunde.wochentag - 1] : null;
  const editEntfall = editingStunde && editDatum
    ? entfallMap.get(`${editingStunde.id}:${editDatum}`) ?? null
    : null;
  const editTyp = editEntfall?.typ ?? null;

  function validiereZeiten(w: FormWerte): boolean {
    if (!w.zeitStart || !w.zeitEnd) { toast.error("Start- und Endzeit sind nötig."); return false; }
    if (w.zeitStart >= w.zeitEnd) { toast.error("Endzeit muss nach Startzeit liegen."); return false; }
    return true;
  }

  function submitAdd() {
    if (!validiereZeiten(addWerte)) return;
    const halbjahrId = gewaehlteHalbjahrId ?? aktivesHalbjahrId ?? "";
    const optId = `temp-${Date.now()}`;
    const opt: StundeRow = {
      id: optId,
      user_id: "",
      halbjahr_id: halbjahrId,
      fach_id: addWerte.fachId || null,
      bezeichnung: addWerte.bezeichnung.trim() || null,
      wochentag: addWerte.wochentag,
      zeit_start: addWerte.zeitStart,
      zeit_end: addWerte.zeitEnd,
      raum: addWerte.raum.trim() || null,
      lehrer: addWerte.lehrer.trim() || null,
      woche_typ: null,
    };
    setAlleStunden((prev) => [...prev, opt]);
    setShowAddForm(false);
    setAddWerte(FORM_LEER);
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
      if (!res.ok) {
        setAlleStunden((prev) => prev.filter((s) => s.id !== optId));
        toast.error(`Fehler: ${res.error}`);
      } else if (res.id) {
        setAlleStunden((prev) => prev.map((s) => s.id === optId ? { ...s, id: res.id!, halbjahr_id: res.halbjahrId ?? s.halbjahr_id } : s));
      }
    });
  }

  function submitEdit() {
    if (!editingStunde || !validiereZeiten(editWerte)) return;
    const snapshot = alleStunden;
    setAlleStunden((prev) => prev.map((s) => s.id === editingStunde.id ? {
      ...s,
      fach_id: editWerte.fachId || null,
      bezeichnung: editWerte.bezeichnung.trim() || null,
      wochentag: editWerte.wochentag,
      zeit_start: editWerte.zeitStart,
      zeit_end: editWerte.zeitEnd,
      raum: editWerte.raum.trim() || null,
      lehrer: editWerte.lehrer.trim() || null,
    } : s));
    setEditingStunde(null);
    start(async () => {
      const neuerName = editFachName.trim();
      const alterName = editingStunde.fach?.name ?? "";
      if (editWerte.fachId && neuerName && neuerName !== alterName) {
        const renameRes = await updateFach(editWerte.fachId, { name: neuerName });
        if (!renameRes.ok) {
          setAlleStunden(snapshot);
          toast.error(`Fach umbenennen: ${renameRes.error}`);
          return;
        }
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
      if (!res.ok) {
        setAlleStunden(snapshot);
        toast.error(`Fehler: ${res.error}`);
      }
    });
  }

  function deleteStunde(id: string) {
    const snapshot = alleStunden;
    setAlleStunden((prev) => prev.filter((s) => s.id !== id));
    setEditingStunde(null);
    start(async () => {
      const res = await removeStunde(id);
      if (!res.ok) {
        setAlleStunden(snapshot);
        toast.error(`Fehler: ${res.error}`);
      }
    });
  }

  function setStundeTyp(stundeId: string, datum: string, typ: "entfall" | "krank" | null, begruendung?: string | null) {
    const snapshot = localEntfaelle;
    if (typ === null) {
      setLocalEntfaelle((prev) => prev.filter((e) => !(e.stunde_id === stundeId && e.datum === datum)));
    } else {
      const opt: EntfallRow = { id: `temp-${Date.now()}`, user_id: "", stunde_id: stundeId, datum, typ, begruendung: begruendung ?? null, created_at: new Date().toISOString() };
      setLocalEntfaelle((prev) => [...prev.filter((e) => !(e.stunde_id === stundeId && e.datum === datum)), opt]);
    }
    start(async () => {
      const res = typ === null
        ? await removeEntfall(stundeId, datum)
        : await addEntfall(stundeId, datum, typ, begruendung ?? null);
      if (!res.ok) {
        setLocalEntfaelle(snapshot);
        toast.error(`Fehler: ${res.error}`);
      }
    });
  }

  function setTagTyp(datum: string, typ: "entfall" | "krank" | null, begruendung?: string | null) {
    const snapshot = localEntfaelle;
    const tagIdx = tagIsos.indexOf(datum);
    const stundenAmTag = tagIdx >= 0 ? proTag[tagIdx] : [];
    if (typ === null) {
      setLocalEntfaelle((prev) => prev.filter((e) => e.datum !== datum));
    } else {
      const neu: EntfallRow[] = stundenAmTag.map((s) => ({
        id: `temp-${Date.now()}-${s.id}`,
        user_id: "",
        stunde_id: s.id,
        datum,
        typ,
        begruendung: begruendung ?? null,
        created_at: new Date().toISOString(),
      }));
      setLocalEntfaelle((prev) => [...prev.filter((e) => e.datum !== datum), ...neu]);
    }
    start(async () => {
      const res = typ === null
        ? await removeTagEntfall(datum)
        : await addTagEntfall(datum, typ, begruendung ?? null);
      if (!res.ok) {
        setLocalEntfaelle(snapshot);
        toast.error(`Fehler: ${res.error}`);
      }
    });
  }

  function openEdit(s: StundeAngereichert) {
    setShowAddForm(false);
    setEditingStunde(s);
    setEditFachName(s.fach?.name ?? "");
    const datum = tagIsos[s.wochentag - 1];
    setGrundEntwurf(entfallMap.get(`${s.id}:${datum}`)?.begruendung ?? "");
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

      {/* ── Halbjahr-Switcher ────────────────────────────────────────────── */}
      {halbjahre.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {halbjahre.map((hj) => {
            const istGewählt = hj.id === gewaehlteHalbjahrId;
            const istAktiv = hj.id === aktivesHalbjahrId;
            return (
              <button
                key={hj.id}
                onClick={() => {
                  setGewaehlteHalbjahrId(hj.id);
                  setShowAddForm(false);
                  setEditingStunde(null);
                }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-xs font-bold transition-all"
                style={
                  istGewählt
                    ? { background: "color-mix(in srgb, var(--brand) 18%, transparent)", color: "var(--brand)", border: "1px solid color-mix(in srgb, var(--brand) 40%, transparent)" }
                    : { background: "var(--surface-2)", color: "var(--text-mute)", border: "1px solid var(--border)" }
                }
              >
                {istAktiv && <span className="size-1.5 rounded-full bg-current opacity-80" />}
                {!istAktiv && <History className="size-3 opacity-60" />}
                {hj.bezeichnung}
                {istAktiv && (
                  <span
                    className="rounded px-1 py-px font-mono text-[9px]"
                    style={{ background: "color-mix(in srgb, var(--brand) 25%, transparent)" }}
                  >
                    aktiv
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setShowNeuesHj(true)}
            className="flex items-center gap-1 rounded-xl border border-dashed px-3 py-1.5 font-mono text-xs text-text-mute transition-colors hover:border-brand/40 hover:text-brand"
            style={{ borderColor: "var(--border)" }}
          >
            <Plus className="size-3" />
            Neues Halbjahr
          </button>
        </div>
      )}

      {/* Read-only Banner für altes Halbjahr */}
      {!istAktivesHalbjahr && (
        <div
          className="flex items-center justify-between rounded-2xl border px-4 py-2.5"
          style={{ background: "color-mix(in srgb, var(--brand) 5%, transparent)", borderColor: "color-mix(in srgb, var(--brand) 25%, transparent)" }}
        >
          <div className="flex items-center gap-2">
            <History className="size-4" style={{ color: "var(--brand)" }} />
            <span className="font-mono text-sm" style={{ color: "var(--brand)" }}>
              Verlauf — {halbjahre.find(h => h.id === gewaehlteHalbjahrId)?.bezeichnung ?? "altes Halbjahr"} · nur ansehen
            </span>
          </div>
          <button
            onClick={() => {
              start(async () => {
                const res = await setAktivesHalbjahr(gewaehlteHalbjahrId!);
                if (!res.ok) { toast.error(res.error); return; }
                router.refresh();
              });
            }}
            disabled={pending}
            className="font-mono text-xs font-bold transition-colors hover:text-foreground"
            style={{ color: "var(--brand)" }}
          >
            Als aktiv setzen →
          </button>
        </div>
      )}

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
          {istAktivesHalbjahr && <FotoImport faecher={faecher} />}
          {istAktivesHalbjahr && (
            <Button
              onClick={() => { setShowAddForm((v) => !v); setEditingStunde(null); }}
              size="sm"
              className="gap-1.5 font-display font-bold"
              style={showAddForm ? { background: "var(--surface-2)", color: "var(--foreground)" } : undefined}
            >
              <Plus className={`size-4 transition-transform ${showAddForm ? "rotate-45" : ""}`} />
              Stunde
            </Button>
          )}
        </div>
      </div>

      {showNeuesHj && (
        <NeuesHalbjahrModal aktivId={aktivesHalbjahrId} onClose={() => setShowNeuesHj(false)} />
      )}

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

      {/* ── Ferien-Banner (ganze Woche in Ferien) ───────────────────────── */}
      {alleTageFerienName && (
        <div
          className="animate-fade-up flex flex-col items-center justify-center gap-2 rounded-3xl border-2 px-6 py-10 text-center"
          style={{
            background: "var(--hero-grad)",
            borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
          }}
        >
          <div className="text-4xl">🌴</div>
          <div className="font-display text-3xl font-extrabold" style={{ color: "var(--brand)" }}>
            {alleTageFerienName}
          </div>
          <div className="font-mono text-sm text-text-dim">
            {fmtTagDatum(tagIsos[0])} – {fmtTagDatum(tagIsos[4])} · kein Unterricht
          </div>
        </div>
      )}

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

      {/* ── Wochenraster (nur wenn nicht alle Tage Ferien) ──────────────── */}
      {!alleTageFerienName && (
        <div
          className="overflow-x-auto rounded-3xl border border-border"
          style={{ background: "var(--card-grad)" }}
        >
          <div className="min-w-[520px]">

            {/* Tag-Header mit Datum + Ferien/Feiertag/Event-Chips */}
            <div className="grid grid-cols-[52px_1fr_1fr_1fr_1fr_1fr] border-b border-border">
              <div />
              {TAGE.map((t, i) => {
                const { ferien, feiertag, kls, has } = tagInfos[i];
                const istHeute = i === heuteIndex;
                const tagTypInfo = tagAlleTyp(i);
                const hatStunden = proTag[i].length > 0;

                const istSonderTag = ferien || feiertag;
                const tagFarbe = tagTypInfo === "entfall"
                  ? "#ff3050"
                  : tagTypInfo === "krank"
                  ? "#f59e0b"
                  : istSonderTag
                  ? "var(--brand)"
                  : istHeute
                  ? "var(--brand)"
                  : "var(--foreground)";

                return (
                  <div
                    key={t}
                    className="py-2 text-center"
                    style={istHeute ? { background: "color-mix(in srgb, var(--brand) 6%, transparent)" } : undefined}
                  >
                    <div
                      className="font-display text-sm font-extrabold"
                      style={{
                        color: tagFarbe,
                        textDecoration: tagTypInfo === "entfall" ? "line-through" : undefined,
                      }}
                    >
                      {t}
                    </div>
                    <div className="font-mono text-[10px] text-text-mute">{fmtTagDatum(tagIsos[i])}</div>

                    {/* Ferien-Badge (Teilferien) */}
                    {ferien && !feiertag && (
                      <div
                        className="mx-auto mt-0.5 w-fit truncate rounded px-1.5 py-0.5 font-mono text-[9px] font-bold max-w-[56px]"
                        style={{ background: "color-mix(in srgb, var(--brand) 20%, transparent)", color: "var(--brand)" }}
                        title={ferien}
                      >
                        Ferien
                      </div>
                    )}

                    {/* Feiertag-Badge */}
                    {feiertag && (
                      <div
                        className="mx-auto mt-0.5 w-fit truncate rounded px-1.5 py-0.5 font-mono text-[9px] font-bold max-w-[60px]"
                        style={{ background: "color-mix(in srgb, var(--brand) 20%, transparent)", color: "var(--brand)" }}
                        title={feiertag}
                      >
                        🎌 Feiertag
                      </div>
                    )}

                    {/* Entfall/Krank Badges */}
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

                    {/* ── Ganzen Tag markieren — immer sichtbar wenn Stunden vorhanden ── */}
                    {hatStunden && !ferien && !feiertag && (
                      <div className="mt-1.5 flex items-center justify-center gap-1">
                        <button
                          onClick={() => setTagTyp(tagIsos[i], tagTypInfo === "entfall" ? null : "entfall")}
                          disabled={pending}
                          title={tagTypInfo === "entfall" ? "Entfall aufheben" : "Ganzen Tag als Entfall"}
                          className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold transition-colors"
                          style={
                            tagTypInfo === "entfall"
                              ? { background: "rgba(255,48,80,.2)", color: "#ff3050" }
                              : { background: "var(--surface-2)", color: "var(--text-mute)" }
                          }
                        >
                          <BanIcon className="size-2.5" />
                        </button>
                        <button
                          onClick={() => setTagTyp(tagIsos[i], tagTypInfo === "krank" ? null : "krank")}
                          disabled={pending}
                          title={tagTypInfo === "krank" ? "Krank aufheben" : "Ganzen Tag krank"}
                          className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold transition-colors"
                          style={
                            tagTypInfo === "krank"
                              ? { background: "rgba(245,158,11,.2)", color: "#f59e0b" }
                              : { background: "var(--surface-2)", color: "var(--text-mute)" }
                          }
                        >
                          <Thermometer className="size-2.5" />
                        </button>
                        {(tagTypInfo === "entfall" || tagTypInfo === "krank") && (
                          <button
                            onClick={() => setTagTyp(tagIsos[i], null)}
                            disabled={pending}
                            title="Markierung aufheben"
                            className="rounded-md px-1 py-0.5 font-mono text-[9px] text-text-mute transition-colors hover:text-foreground"
                            style={{ background: "var(--surface-2)" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}

                    {/* Event-Chips (Klausur, HA) */}
                    {(tagTypInfo === null || tagTypInfo === "gemischt") && (kls.length > 0 || has.length > 0) && !ferien && !feiertag && (
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
                            HA
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

              {/* Feiertag/Ferien Spalten-Overlay */}
              {tagInfos.map((info, i) => {
                if (!info.ferien && !info.feiertag) return null;
                return (
                  <div
                    key={i}
                    className="pointer-events-none absolute inset-y-0 flex items-center justify-center"
                    style={{
                      left: `calc(52px + (100% - 52px) * ${i / 5})`,
                      width: `calc((100% - 52px) / 5)`,
                      background: "color-mix(in srgb, var(--brand) 4%, transparent)",
                    }}
                  >
                    <div
                      className="rotate-[-30deg] font-mono text-[10px] font-bold uppercase tracking-widest opacity-20"
                      style={{ color: "var(--brand)" }}
                    >
                      {info.ferien ?? info.feiertag}
                    </div>
                  </div>
                );
              })}

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

              {/* Stunden-Blöcke (nicht auf Ferien-/Feiertag-Tagen) */}
              {proTag.map((stundenAmTag, tagIndex) =>
                (tagInfos[tagIndex].ferien || tagInfos[tagIndex].feiertag) ? null :
                stundenAmTag.map((s) => {
                  const farbe = s.fach?.farbe ?? FACH_FALLBACK_FARBE;
                  const top = topPct(s.zeit_start);
                  const height = hoehePct(s.zeit_start, s.zeit_end);
                  const isAktiv = editingStunde?.id === s.id;
                  const eTyp = entfallTyp(s.id, tagIndex);
                  const label = s.fach?.name ?? s.bezeichnung ?? "–";
                  const markFarbe = eTyp === "entfall" ? "#ff3050" : eTyp === "krank" ? "#f59e0b" : null;
                  const tagIso = tagIsos[tagIndex];
                  const stundeKlausuren = !eTyp && s.fach_id
                    ? klausuren.filter((k) => k.fach_id === s.fach_id && toLocalIso(k.datum) === tagIso)
                    : [];
                  const stundeHAs = !eTyp && s.fach_id
                    ? hausaufgaben.filter((h) => !h.erledigt && h.fach_id === s.fach_id && h.faellig_am === tagIso)
                    : [];

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
                        onClick={() => istAktivesHalbjahr && openEdit(s)}
                        className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-xl p-2 transition-[filter] ${istAktivesHalbjahr ? "cursor-pointer hover:brightness-110" : "cursor-default opacity-80"}`}
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
                          {(stundeKlausuren.length > 0 || stundeHAs.length > 0) && (
                            <div className="mt-0.5 flex flex-wrap gap-0.5 overflow-hidden">
                              {stundeKlausuren.map((k) => (
                                <span
                                  key={k.id}
                                  className="truncate rounded px-1 font-mono text-[8px] font-bold leading-tight"
                                  style={{ background: "rgba(255,48,80,.2)", color: "#ff3050" }}
                                  title={k.titel}
                                >
                                  ✕ {k.titel}
                                </span>
                              ))}
                              {stundeHAs.map((h) => (
                                <span
                                  key={h.id}
                                  className="truncate rounded px-1 font-mono text-[8px] font-bold leading-tight"
                                  style={{ background: "rgba(251,191,36,.2)", color: "#f59e0b" }}
                                  title={h.beschreibung}
                                >
                                  HA
                                </span>
                              ))}
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
      )}

      {/* Leerer Zustand */}
      {stunden.length === 0 && !alleTageFerienName && (
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

            {/* Krank / Entfall — diese Woche, prominent oben */}
            {editDatum && (
              <div className="mb-4">
                <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-text-mute">
                  {fmtDatum(editDatum)} · Diese Stunde
                </div>
                <div
                  className="flex gap-2 rounded-2xl p-3"
                  style={{
                    background: editTyp === "entfall"
                      ? "rgba(255,48,80,.1)"
                      : editTyp === "krank"
                      ? "rgba(245,158,11,.1)"
                      : "var(--surface-2)",
                  }}
                >
                  <button
                    onClick={() => setStundeTyp(editingStunde.id, editDatum, editTyp === "entfall" ? null : "entfall")}
                    disabled={pending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-sm font-bold transition-colors"
                    style={editTyp === "entfall"
                      ? { background: "rgba(255,48,80,.25)", color: "#ff3050" }
                      : { background: "var(--surface-3, var(--surface-2))", color: "var(--text-dim)" }
                    }
                  >
                    <BanIcon className="size-4" />
                    Entfall
                  </button>
                  <button
                    onClick={() => setStundeTyp(editingStunde.id, editDatum, editTyp === "krank" ? null : "krank")}
                    disabled={pending}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 font-mono text-sm font-bold transition-colors"
                    style={editTyp === "krank"
                      ? { background: "rgba(245,158,11,.25)", color: "#f59e0b" }
                      : { background: "var(--surface-3, var(--surface-2))", color: "var(--text-dim)" }
                    }
                  >
                    <Thermometer className="size-4" />
                    Krank
                  </button>
                </div>
                {editTyp && (
                  <input
                    type="text"
                    value={grundEntwurf}
                    maxLength={280}
                    onChange={(e) => setGrundEntwurf(e.target.value)}
                    onBlur={() => {
                      if ((grundEntwurf.trim() || null) !== (editEntfall?.begruendung ?? null) && editDatum) {
                        setStundeTyp(editingStunde.id, editDatum, editTyp, grundEntwurf);
                      }
                    }}
                    placeholder={editTyp === "krank" ? "Grund (optional) – z. B. Erkältung" : "Grund (optional) – z. B. Lehrer krank"}
                    className="mt-2 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground placeholder:text-text-mute focus:border-brand/40 focus:outline-none"
                  />
                )}
                <p className="mt-1 font-mono text-[10px] text-text-mute">
                  Nochmal tippen = aufheben · Ganzen Tag: Buttons im Wochenraster
                </p>
              </div>
            )}

            <StundeFormFelder
              werte={editWerte}
              faecher={(() => {
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
