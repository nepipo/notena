import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BriefingKarte } from "@/components/dashboard/briefing-karte";
import { CoachChat } from "@/components/dashboard/coach-chat";
import { GrussText } from "@/components/dashboard/gruss-text";
import { FerienCountdown } from "@/components/dashboard/ferien-countdown";
import {
  assembleFaecher,
  type FachRow,
  type NoteRow,
  type KlausurRow,
} from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { gesamtSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import { fmtZeit, type StundeRow } from "@/lib/stundenplan/types";
import { ArrowRight, ClipboardList } from "lucide-react";

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function tageBis(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const zielt = new Date(y, m - 1, d);
  const heute = new Date();
  const heut = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.round((zielt.getTime() - heut.getTime()) / 86400000);
}

// ISO-Wochentag 1=Mo…5=Fr, 0/6=WE
function heutigerWochentag(): number {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub ?? "";

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("aktuelles_halbjahr, name")
    .eq("id", userId)
    .single();
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();

  const { data: fachRows } = await supabase
    .from("schule_fach")
    .select("*")
    .eq("halbjahr", halbjahr)
    .order("created_at", { ascending: true });
  const fachIds = (fachRows ?? []).map((f) => f.id);
  const { data: noteRows } = fachIds.length
    ? await supabase.from("schule_note").select("*").in("fach_id", fachIds)
    : { data: [] as NoteRow[] };

  const todayUtc = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
  const { data: klausurRows } = await supabase
    .from("schule_klausur")
    .select("*")
    .gte("datum", todayUtc)
    .order("datum", { ascending: true })
    .limit(1);

  const { data: stundeRows } = await supabase
    .from("stundenplan_stunde")
    .select("*")
    .eq("wochentag", heutigerWochentag())
    .order("zeit_start");

  const { count: offeneHA } = await supabase
    .from("hausaufgabe")
    .select("*", { count: "exact", head: true })
    .eq("erledigt", false);

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );
  const gesamt = gesamtSchnittGerundet(faecher);
  const fachName = new Map(faecher.map((f) => [f.id, f.name]));
  const naechste = ((klausurRows ?? []) as KlausurRow[])[0] ?? null;
  const heutigeStunden = (stundeRows ?? []) as StundeRow[];
  const gesamtNoten = faecher.reduce((s, f) => s + f.noten.length, 0);

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          Übersicht · {halbjahr}
        </div>
        <h1 className="text-3xl font-extrabold leading-none sm:text-4xl md:text-5xl">
          <GrussText name={profil?.name ?? null} />
        </h1>
      </header>

      {/* Briefing */}
      <Suspense fallback={<BriefingSkeleton />}>
        <BriefingKarte />
      </Suspense>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Gesamtschnitt */}
        <section
          className="lift animate-fade-up relative overflow-hidden rounded-[28px] border-2 p-8"
          style={{
            background: "var(--hero-grad)",
            borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
            animationDelay: "0.05s",
          }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Gesamtschnitt
          </div>
          <div className="mt-3 flex items-end">
            <span
              className="font-display text-[60px] font-extrabold leading-[0.85] tracking-[-0.06em] sm:text-[88px]"
              style={{ color: schnittFarbe(gesamt) }}
            >
              {fmt(gesamt)}
            </span>
            <span className="mb-2 ml-1 text-2xl font-medium text-text-mute">/15</span>
          </div>
          {gesamt !== null && (
            <div className="mt-2 font-mono text-sm text-text-dim">
              Note {punkteZuNote(gesamt)} · {faecher.length} Fächer
            </div>
          )}
        </section>

        {/* Nächste Klausur */}
        <section
          className="lift animate-fade-up rounded-[28px] border border-border p-8"
          style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Nächste Klausur
          </div>
          {naechste ? (
            <div className="mt-3">
              <div className="font-display text-2xl font-extrabold">{naechste.titel}</div>
              <div className="mt-1 font-mono text-sm text-text-dim">
                {naechste.fach_id && fachName.get(naechste.fach_id)
                  ? `${fachName.get(naechste.fach_id)} · `
                  : ""}
                in {tageBis(naechste.datum)} Tagen
              </div>
            </div>
          ) : (
            <p className="mt-3 font-mono text-sm text-text-mute">
              Kein Termin eingetragen.
            </p>
          )}
        </section>
      </div>

      {/* Schnellzugriff — Stat-Karten */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Aufgaben */}
        <Link
          href="/aufgaben"
          className="lift animate-fade-up group relative overflow-hidden rounded-3xl border border-border p-5 transition-colors hover:border-brand/40"
          style={{ background: "var(--card-grad)", animationDelay: "0.15s" }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-brand">
            Aufgaben
          </div>
          <div className={`mt-2 font-display text-2xl font-extrabold leading-tight ${(offeneHA ?? 0) > 0 ? "" : "text-text-dim"}`}>
            {(offeneHA ?? 0) > 0 ? `${offeneHA} offen` : "Alles erledigt"}
          </div>
          <div className="mt-1 font-mono text-xs text-text-dim">
            {naechste ? `Klausur in ${tageBis(naechste.datum)} Tagen` : "Keine Klausur geplant"}
          </div>
          <ArrowRight className="absolute bottom-4 right-4 size-4 text-text-mute opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>

        {/* What-If */}
        <Link
          href="/what-if"
          className="lift animate-fade-up group relative overflow-hidden rounded-3xl border border-border p-5 transition-colors hover:border-brand/40"
          style={{ background: "var(--card-grad)", animationDelay: "0.2s" }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-brand">
            What-If
          </div>
          <div className="mt-2 font-display text-2xl font-extrabold leading-tight">
            Schnitt<br />simulieren
          </div>
          <div className="mt-1 font-mono text-xs text-text-dim">
            {gesamtNoten > 0
              ? `${gesamtNoten} Noten · fiktive Note eintragen`
              : "Noten eintragen & durchrechnen"}
          </div>
          <ArrowRight className="absolute bottom-4 right-4 size-4 text-text-mute opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>

        {/* Stundenplan */}
        <Link
          href="/stundenplan"
          className="lift animate-fade-up group relative overflow-hidden rounded-3xl border border-border p-5 transition-colors hover:border-brand/40"
          style={{ background: "var(--card-grad)", animationDelay: "0.25s" }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-brand">
            Heute · {heutigeStunden.length > 0 ? `${heutigeStunden.length} Stunde${heutigeStunden.length !== 1 ? "n" : ""}` : "Stundenplan"}
          </div>
          {heutigeStunden.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {heutigeStunden.map((s) => {
                const name = s.fach_id ? (fachName.get(s.fach_id) ?? "Stunde") : "Stunde";
                return (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="w-[72px] shrink-0 font-mono text-[10px] text-text-mute tabular-nums">
                      {fmtZeit(s.zeit_start)}–{fmtZeit(s.zeit_end)}
                    </span>
                    <span className="truncate font-display text-sm font-bold leading-tight">
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="mt-2 font-display text-xl font-extrabold leading-tight text-text-dim">
                Heute frei
              </div>
              <div className="mt-1 font-mono text-xs text-text-mute">
                Kein Unterricht eingetragen
              </div>
            </>
          )}
          <ArrowRight className="absolute bottom-4 right-4 size-4 text-text-mute opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>

        {/* Ferien-Countdown */}
        <Suspense fallback={<FerienSkeleton />}>
          <FerienCountdown />
        </Suspense>
      </div>

      {/* KI-Coach — ganz unten */}
      <div className="mt-4">
        <CoachChat />
      </div>
    </main>
  );
}

function FerienSkeleton() {
  return (
    <div
      className="animate-pulse rounded-3xl border border-border p-5"
      style={{ background: "var(--card-grad)" }}
    >
      <div className="h-2 w-16 rounded bg-surface-2" />
      <div className="mt-3 h-8 w-20 rounded bg-surface-2" />
      <div className="mt-2 h-2.5 w-28 rounded bg-surface-2" />
    </div>
  );
}

function BriefingSkeleton() {
  return (
    <div
      className="animate-pulse rounded-[28px] border border-border p-6 sm:p-8"
      style={{ background: "var(--surface-1)" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="size-1.5 rounded-full bg-brand/40" />
        <div className="h-2.5 w-24 rounded bg-surface-2" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-surface-2" />
        <div className="h-4 w-4/5 rounded bg-surface-2" />
        <div className="h-4 w-3/5 rounded bg-surface-2" />
      </div>
    </div>
  );
}
