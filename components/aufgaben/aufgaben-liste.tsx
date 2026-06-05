"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addHausaufgabe, removeHausaufgabe, toggleErledigt } from "@/lib/actions/hausaufgaben";
import { addKlausur, removeKlausur } from "@/lib/actions/schule";
import { hexToRgba, FACH_FALLBACK_FARBE, tageBis } from "@/lib/stundenplan/types";
import type { FachRow } from "@/lib/grades/db";
import type { HausaufgabeRow } from "@/lib/stundenplan/types";
import type { KlausurRow } from "@/lib/grades/db";

// ── Typen ─────────────────────────────────────────────────────────────────────

type Tab = "alle" | "hausaufgaben" | "klausuren";
type Urgency = "kritisch" | "bald" | "spaeter" | "vorbei";

type AufgabeItem =
  | { typ: "ha"; data: HausaufgabeRow; fach?: FachRow; urgency: Urgency }
  | { typ: "klausur"; data: KlausurRow; fach?: FachRow; urgency: Urgency };

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function getUrgencyHA(ha: HausaufgabeRow): Urgency {
  if (ha.erledigt) return "vorbei";
  const tage = tageBis(ha.faellig_am);
  if (tage <= 1) return "kritisch";
  if (tage <= 7) return "bald";
  return "spaeter";
}

function getUrgencyKlausur(k: KlausurRow): Urgency {
  const tage = tageBis(k.datum);
  if (tage < 0) return "vorbei";
  if (tage <= 1) return "kritisch";
  if (tage <= 7) return "bald";
  return "spaeter";
}

function fmtDatum(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

const URGENCY_ORDER: Urgency[] = ["kritisch", "bald", "spaeter", "vorbei"];

const URGENCY_LABEL: Record<Urgency, string> = {
  kritisch: "Dringend",
  bald:     "Diese Woche",
  spaeter:  "Später",
  vorbei:   "Erledigt & Vorbei",
};

// ── Komponente ────────────────────────────────────────────────────────────────

export function AufgabenListe({
  faecher,
  hausaufgaben,
  klausuren,
}: {
  faecher: FachRow[];
  hausaufgaben: HausaufgabeRow[];
  klausuren: KlausurRow[];
}) {
  const fachMap = new Map(faecher.map((f) => [f.id, f]));

  const [tab, setTab] = useState<Tab>("alle");
  const [aktiverFach, setAktiverFach] = useState<string>("alle");
  const [showForm, setShowForm] = useState(false);
  const [formTyp, setFormTyp] = useState<"ha" | "klausur">("ha");
  const [vorbeiOpen, setVorbeiOpen] = useState(false);

  // Formular-State HA
  const [haBeschreibung, setHaBeschreibung] = useState("");
  const [haFaellig, setHaFaellig] = useState("");
  const [haFachId, setHaFachId] = useState("");

  // Formular-State Klausur
  const [kTitel, setKTitel] = useState("");
  const [kDatum, setKDatum] = useState("");
  const [kFachId, setKFachId] = useState("");

  const [pending, start] = useTransition();
  const router = useRouter();

  // ── Daten aufbereiten ───────────────────────────────────────────────────────

  const alleItems: AufgabeItem[] = [
    ...hausaufgaben.map((ha): AufgabeItem => ({
      typ: "ha",
      data: ha,
      fach: ha.fach_id ? fachMap.get(ha.fach_id) : undefined,
      urgency: getUrgencyHA(ha),
    })),
    ...klausuren.map((k): AufgabeItem => ({
      typ: "klausur",
      data: k,
      fach: k.fach_id ? fachMap.get(k.fach_id) : undefined,
      urgency: getUrgencyKlausur(k),
    })),
  ];

  const gefiltert = alleItems.filter((item) => {
    if (tab === "hausaufgaben" && item.typ !== "ha") return false;
    if (tab === "klausuren" && item.typ !== "klausur") return false;
    if (aktiverFach !== "alle") {
      if (item.data.fach_id !== aktiverFach) return false;
    }
    return true;
  });

  const gruppen = new Map<Urgency, AufgabeItem[]>();
  for (const u of URGENCY_ORDER) gruppen.set(u, []);
  for (const item of gefiltert) {
    gruppen.get(item.urgency)!.push(item);
  }

  // Fächer, die tatsächlich vorkommen (für Filter-Pills)
  const vorkommendeFachIds = new Set(alleItems.map((i) => (i.typ === "ha" ? i.data.fach_id : i.data.fach_id) ?? "").filter(Boolean));
  const filterFaecher = faecher.filter((f) => vorkommendeFachIds.has(f.id));

  // ── Actions ─────────────────────────────────────────────────────────────────

  function addHA() {
    if (!haBeschreibung.trim() || !haFaellig) { toast.error("Beschreibung und Datum fehlen."); return; }
    start(async () => {
      const res = await addHausaufgabe({ fachId: haFachId || null, beschreibung: haBeschreibung, faelligAm: haFaellig });
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      setHaBeschreibung(""); setHaFaellig(""); setHaFachId("");
      setShowForm(false);
      router.refresh();
    });
  }

  function addK() {
    if (!kTitel.trim() || !kDatum) { toast.error("Titel und Datum fehlen."); return; }
    start(async () => {
      const res = await addKlausur(kTitel, kDatum + "T12:00:00.000Z", kFachId || undefined);
      if (!res.ok) { toast.error(`Fehler: ${res.error}`); return; }
      setKTitel(""); setKDatum(""); setKFachId("");
      setShowForm(false);
      router.refresh();
    });
  }

  function toggleHA(id: string, erledigt: boolean) {
    start(async () => {
      const res = await toggleErledigt(id, erledigt);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  function deleteHA(id: string) {
    start(async () => {
      const res = await removeHausaufgabe(id);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  function deleteK(id: string) {
    start(async () => {
      const res = await removeKlausur(id);
      if (!res.ok) toast.error(`Fehler: ${res.error}`);
      else router.refresh();
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const aktiveItems = gefiltert.filter((i) => i.urgency !== "vorbei");
  const vorbeiItems = gruppen.get("vorbei")!;

  return (
    <div className="space-y-5">
      {/* Tab-Leiste + Add-Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 rounded-xl border border-border p-1" style={{ background: "var(--surface-2)" }}>
          {(["alle", "hausaufgaben", "klausuren"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-all"
              style={
                tab === t
                  ? { background: "var(--surface-1)", color: "var(--foreground)", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }
                  : { color: "var(--text-mute)" }
              }
            >
              {t === "alle" ? "Alle" : t === "hausaufgaben" ? "Hausaufgaben" : "Klausuren"}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setFormTyp(tab === "klausuren" ? "klausur" : "ha");
            setShowForm((v) => !v);
          }}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 font-display text-sm font-bold transition-all hover:border-brand hover:text-brand"
          style={{ background: "var(--surface-2)" }}
        >
          <Plus className={`size-3.5 transition-transform ${showForm ? "rotate-45" : ""}`} />
          {tab === "klausuren" ? "Klausur" : "HA"} hinzufügen
        </button>
      </div>

      {/* Fach-Filter-Pills */}
      {filterFaecher.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setAktiverFach("alle")}
            className="rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-all"
            style={
              aktiverFach === "alle"
                ? { background: "rgba(29,161,255,.18)", color: "var(--brand)", border: "1px solid rgba(29,161,255,.35)" }
                : { background: "var(--surface-2)", color: "var(--text-mute)", border: "1px solid var(--border)" }
            }
          >
            Alle Fächer
          </button>
          {filterFaecher.map((f) => {
            const farbe = f.farbe ?? FACH_FALLBACK_FARBE;
            const aktiv = aktiverFach === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setAktiverFach(aktiv ? "alle" : f.id)}
                className="rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-all"
                style={
                  aktiv
                    ? { background: hexToRgba(farbe, 0.2), color: farbe, border: `1px solid ${hexToRgba(farbe, 0.4)}` }
                    : { background: "var(--surface-2)", color: "var(--text-mute)", border: "1px solid var(--border)" }
                }
              >
                {f.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Formular */}
      {showForm && (
        <div className="animate-fade-up rounded-2xl border border-border p-4" style={{ background: "var(--card-grad)" }}>
          {/* Typ-Toggle (nur bei "alle"-Tab) */}
          {tab === "alle" && (
            <div className="mb-3 flex gap-1 w-fit rounded-lg border border-border p-0.5" style={{ background: "var(--surface-2)" }}>
              <button
                onClick={() => setFormTyp("ha")}
                className="rounded-md px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-all"
                style={formTyp === "ha" ? { background: "var(--surface-1)", color: "var(--foreground)" } : { color: "var(--text-mute)" }}
              >
                Hausaufgabe
              </button>
              <button
                onClick={() => setFormTyp("klausur")}
                className="rounded-md px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-all"
                style={formTyp === "klausur" ? { background: "var(--surface-1)", color: "var(--foreground)" } : { color: "var(--text-mute)" }}
              >
                Klausur
              </button>
            </div>
          )}

          {formTyp === "ha" ? (
            <div className="flex flex-wrap gap-2">
              <Input value={haBeschreibung} onChange={(e) => setHaBeschreibung(e.target.value)} placeholder="z. B. S. 47 Aufg. 3+4" className="h-9 flex-1 min-w-[180px] bg-surface-2 font-mono text-sm" onKeyDown={(e) => e.key === "Enter" && addHA()} />
              <Input type="date" value={haFaellig} onChange={(e) => setHaFaellig(e.target.value)} className="h-9 w-36 bg-surface-2 font-mono text-sm" />
              <select value={haFachId} onChange={(e) => setHaFachId(e.target.value)} className="h-9 rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-text-dim">
                <option value="">Fach</option>
                {faecher.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <Button onClick={addHA} disabled={pending} size="sm" className="font-display font-bold">Eintragen</Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Input value={kTitel} onChange={(e) => setKTitel(e.target.value)} placeholder="z. B. 2. Mathe-Klausur" className="h-9 flex-1 min-w-[180px] bg-surface-2 font-mono text-sm" onKeyDown={(e) => e.key === "Enter" && addK()} />
              <Input type="date" value={kDatum} onChange={(e) => setKDatum(e.target.value)} className="h-9 w-36 bg-surface-2 font-mono text-sm" />
              <select value={kFachId} onChange={(e) => setKFachId(e.target.value)} className="h-9 rounded-lg border border-border bg-surface-2 px-2 font-mono text-sm text-text-dim">
                <option value="">Fach</option>
                {faecher.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <Button onClick={addK} disabled={pending} size="sm" className="font-display font-bold">Eintragen</Button>
            </div>
          )}
        </div>
      )}

      {/* Leerer Zustand */}
      {aktiveItems.length === 0 && vorbeiItems.length === 0 && (
        <p className="py-6 text-center font-mono text-sm text-text-mute">
          {tab === "alle" ? "Alles erledigt — top." : tab === "hausaufgaben" ? "Keine offenen Hausaufgaben." : "Keine Klausuren eingetragen."}
        </p>
      )}

      {/* Aktive Items — gruppiert nach Dringlichkeit */}
      {(["kritisch", "bald", "spaeter"] as Urgency[]).map((urgency) => {
        const items = gruppen.get(urgency)!;
        if (items.length === 0) return null;
        return (
          <div key={urgency}>
            <div className="mb-2 flex items-center gap-2">
              <div
                className="h-px flex-1"
                style={{ background: urgency === "kritisch" ? "rgba(255,48,80,.3)" : "var(--border)" }}
              />
              <span
                className="font-mono text-[9px] font-bold uppercase tracking-[.12em]"
                style={{ color: urgency === "kritisch" ? "#ff3050" : "var(--text-mute)" }}
              >
                {URGENCY_LABEL[urgency]}
              </span>
              <div
                className="h-px flex-1"
                style={{ background: urgency === "kritisch" ? "rgba(255,48,80,.3)" : "var(--border)" }}
              />
            </div>
            <div className="space-y-1.5">
              {items.map((item) => (
                <AufgabeItemRow
                  key={item.typ + item.data.id}
                  item={item}
                  onToggleHA={toggleHA}
                  onDeleteHA={deleteHA}
                  onDeleteK={deleteK}
                  pending={pending}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Erledigt & Vorbei — einklappbar */}
      {vorbeiItems.length > 0 && (
        <div>
          <button
            onClick={() => setVorbeiOpen((v) => !v)}
            className="mb-2 flex w-full items-center gap-2 text-left"
          >
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[.12em] text-text-mute">
              {URGENCY_LABEL.vorbei}
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[8px]">{vorbeiItems.length}</span>
              <ChevronDown className={`size-3 transition-transform ${vorbeiOpen ? "rotate-180" : ""}`} />
            </span>
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          </button>

          {vorbeiOpen && (
            <div className="space-y-1.5">
              {vorbeiItems.map((item) => (
                <AufgabeItemRow
                  key={item.typ + item.data.id}
                  item={item}
                  onToggleHA={toggleHA}
                  onDeleteHA={deleteHA}
                  onDeleteK={deleteK}
                  pending={pending}
                  dimmed
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Item-Zeile ────────────────────────────────────────────────────────────────

function AufgabeItemRow({
  item,
  onToggleHA,
  onDeleteHA,
  onDeleteK,
  pending,
  dimmed = false,
}: {
  item: AufgabeItem;
  onToggleHA: (id: string, erledigt: boolean) => void;
  onDeleteHA: (id: string) => void;
  onDeleteK: (id: string) => void;
  pending: boolean;
  dimmed?: boolean;
}) {
  const fach = item.fach;
  const farbe = fach?.farbe ?? FACH_FALLBACK_FARBE;

  if (item.typ === "ha") {
    const ha = item.data;
    const tage = tageBis(ha.faellig_am);
    const isUeberfaellig = tage < 0 && !ha.erledigt;
    return (
      <div
        className="group flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-all hover:border-border"
        style={{
          background: "var(--surface-2)",
          opacity: dimmed ? 0.5 : 1,
        }}
      >
        {/* Farbstreifen */}
        <div className="h-7 w-0.5 flex-shrink-0 rounded-full" style={{ background: farbe }} />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="font-display text-sm font-bold leading-tight"
              style={{ textDecoration: ha.erledigt ? "line-through" : "none", color: ha.erledigt ? "var(--text-mute)" : "var(--foreground)" }}
            >
              {ha.beschreibung}
            </span>
            {fach && (
              <span className="flex-shrink-0 font-mono text-[9px] uppercase tracking-widest text-text-mute">{fach.name}</span>
            )}
          </div>
          <span
            className="font-mono text-[10px]"
            style={{
              color: isUeberfaellig ? "#ff3050" : ha.erledigt ? "var(--text-mute)" : tage <= 1 ? "#f59e0b" : "var(--text-mute)",
            }}
          >
            {ha.erledigt ? "erledigt" : tage < 0 ? `${Math.abs(tage)}T überfällig` : tage === 0 ? "heute" : tage === 1 ? "morgen" : `${fmtDatum(ha.faellig_am)}`}
          </span>
        </div>

        {/* HA-Typ-Badge */}
        <span className="flex-shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-text-mute" style={{ background: "var(--surface-1)" }}>HA</span>

        {/* Checkbox */}
        <button
          onClick={() => onToggleHA(ha.id, !ha.erledigt)}
          disabled={pending}
          className="flex size-5 flex-shrink-0 items-center justify-center rounded-md border border-border transition-all hover:border-brand"
          style={ha.erledigt ? { background: "linear-gradient(135deg,var(--brand),var(--indigo))", borderColor: "transparent" } : {}}
        >
          {ha.erledigt && <span className="text-[10px] font-black text-white">✓</span>}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDeleteHA(ha.id)}
          disabled={pending}
          className="flex-shrink-0 text-[14px] leading-none text-text-mute opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
        >
          ×
        </button>
      </div>
    );
  }

  // Klausur
  const k = item.data;
  const tage = tageBis(k.datum);
  return (
    <div
      className="group flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-all"
      style={{
        background: "var(--surface-2)",
        opacity: dimmed ? 0.5 : 1,
      }}
    >
      {/* Farbstreifen */}
      <div
        className="h-7 w-0.5 flex-shrink-0 rounded-full"
        style={{ background: tage < 0 ? "var(--text-mute)" : tage <= 7 ? "#ff3050" : farbe }}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-sm font-bold leading-tight">{k.titel}</span>
          {fach && (
            <span className="flex-shrink-0 font-mono text-[9px] uppercase tracking-widest text-text-mute">{fach.name}</span>
          )}
        </div>
        <span className="font-mono text-[10px] text-text-mute">{fmtDatum(k.datum)}</span>
      </div>

      {/* Klausur-Typ-Badge */}
      <span className="flex-shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-text-mute" style={{ background: "var(--surface-1)" }}>Klausur</span>

      {/* Countdown-Chip */}
      <span
        className="flex-shrink-0 rounded-lg px-2 py-0.5 font-mono text-xs font-bold"
        style={
          tage < 0
            ? { background: "var(--surface-1)", color: "var(--text-mute)" }
            : tage <= 7
            ? { background: "rgba(255,48,80,.15)", color: "#ff3050", border: "1px solid rgba(255,48,80,.25)" }
            : { background: "rgba(29,161,255,.12)", color: "var(--brand)", border: "1px solid rgba(29,161,255,.2)" }
        }
      >
        {tage < 0 ? "vorbei" : tage === 0 ? "heute" : `${tage}T`}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDeleteK(k.id)}
        disabled={pending}
        className="flex-shrink-0 text-[14px] leading-none text-text-mute opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}
