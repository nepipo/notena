import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCachedProfil } from "@/lib/supabase/cache";
import { BriefingKarte } from "@/components/dashboard/briefing-karte";
import { UpgradePrompt } from "@/components/pro/upgrade-prompt";
import { istPro } from "@/lib/pro/plan";

import { GrussText } from "@/components/dashboard/gruss-text";
import { FerienCountdown } from "@/components/dashboard/ferien-countdown";
import { SchnittKarte } from "@/components/dashboard/schnitt-karte";
import { TiltEffect } from "@/components/tilt-card";
import {
  assembleFaecher,
  type FachRow,
  type NoteRow,
  type KlausurRow,
} from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { gesamtSchnittGerundet } from "@/lib/grades/calc";
import { fmtZeit, type StundeRow } from "@/lib/stundenplan/types";
import { FERIEN, type Bundesland } from "@/lib/ferien/ferien-data";
import { getFeiertag } from "@/lib/ferien/feiertage";
import { ArrowRight } from "lucide-react";

// Gleiche Logik wie im Stundenplan-Tab (stundenplan-board.tsx), damit
// Widget und Tab synchron sind: an welchem ISO-Datum liegen Ferien?
function ferienNameFuerDatum(bundesland: Bundesland | null, iso: string): string | null {
  if (!bundesland) return null;
  for (const p of FERIEN[bundesland] ?? []) {
    if (iso >= p.von && iso <= p.bis) return p.name;
  }
  return null;
}

function tageBis(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const zielt = new Date(y, m - 1, d);
  const heute = new Date();
  const heut = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.round((zielt.getTime() - heut.getTime()) / 86400000);
}

function heutigerWochentag(): number {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

// Shell: Header sofort rendern, Karten streamen sobald DB-Queries fertig.
export default async function DashboardPage() {
  const profil = await getCachedProfil();
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const pro = istPro(profil);

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <TiltEffect />
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          Übersicht · {halbjahr}
        </div>
        <h1 className="text-3xl font-extrabold leading-none sm:text-4xl md:text-5xl">
          <GrussText name={profil?.name ?? null} />
        </h1>
      </header>

      {/* Briefing — Pro-Feature */}
      {pro ? (
        <Suspense fallback={<BriefingSkeleton />}>
          <BriefingKarte />
        </Suspense>
      ) : (
        <UpgradePrompt feature="Tägliches KI-Briefing" />
      )}

      {/* Alle Karten streamen sobald DB-Queries fertig (~100–200ms nach Shell) */}
      <Suspense fallback={<DashboardCardsSkeleton />}>
        <DashboardData halbjahr={halbjahr} />
      </Suspense>


    </main>
  );
}

async function DashboardData({ halbjahr }: { halbjahr: string }) {
  const supabase = await createClient();

  const todayUtc = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
  const jetzt = new Date();
  const heuteLokal = `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, "0")}-${String(jetzt.getDate()).padStart(2, "0")}`;

  // Bundesland aus dem Profil (getCachedProfil ist dedupliziert — kein Extra-Query).
  const profil = await getCachedProfil();
  const bundesland = (profil?.bundesland as Bundesland | null | undefined) ?? null;
  const ferienHeute = ferienNameFuerDatum(bundesland, heuteLokal);
  const feiertagHeute = bundesland ? getFeiertag(bundesland, heuteLokal) : null;
  const freierTag = ferienHeute ?? feiertagHeute;

  const [
    { data: fachRows, error: fachErr },
    { data: klausurRows, error: klausurErr },
    { data: stundeRows, error: stundeErr },
    { data: entfallRows, error: entfallErr },
    { count: offeneHA, error: haErr },
    { data: alleFachRows, error: alleFachErr },
  ] = await Promise.all([
    supabase.from("schule_fach").select("*").eq("halbjahr", halbjahr).order("created_at", { ascending: true }),
    supabase.from("schule_klausur").select("*").gte("datum", todayUtc).order("datum", { ascending: true }).limit(1),
    supabase.from("stundenplan_stunde").select("*").eq("wochentag", heutigerWochentag()).order("zeit_start"),
    supabase.from("stundenplan_entfall").select("stunde_id, typ, begruendung").eq("datum", heuteLokal),
    supabase.from("hausaufgabe").select("*", { count: "exact", head: true }).eq("erledigt", false),
    supabase.from("schule_fach").select("id, name, farbe").order("name"),
  ]);
  if (fachErr) console.error("[dashboard] schule_fach fetch error:", fachErr);
  if (klausurErr) console.error("[dashboard] schule_klausur fetch error:", klausurErr);
  if (stundeErr) console.error("[dashboard] stundenplan_stunde fetch error:", stundeErr);
  if (entfallErr) console.error("[dashboard] stundenplan_entfall fetch error:", entfallErr);
  if (haErr) console.error("[dashboard] hausaufgabe count error:", haErr);
  if (alleFachErr) console.error("[dashboard] alleFachRows fetch error:", alleFachErr);

  const fachIds = (fachRows ?? []).map((f) => f.id);
  const { data: noteRows, error: noteErr } = fachIds.length
    ? await supabase.from("schule_note").select("*").in("fach_id", fachIds)
    : { data: [] as NoteRow[], error: null };
  if (noteErr) console.error("[dashboard] schule_note fetch error:", noteErr);

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );
  const gesamt = gesamtSchnittGerundet(faecher);
  const fachInfo = new Map((alleFachRows ?? []).map((f) => [f.id, { name: f.name as string, farbe: f.farbe as string | null }]));
  const naechste = ((klausurRows ?? []) as KlausurRow[])[0] ?? null;
  const heutigeStunden = (stundeRows ?? []) as StundeRow[];
  const entfallHeute = new Map(
    (entfallRows ?? []).map((e) => [e.stunde_id as string, { typ: e.typ as "entfall" | "krank", begruendung: (e.begruendung as string | null) ?? null }]),
  );
  const entfalleneStunden = heutigeStunden.filter((s) => entfallHeute.has(s.id));
  const tagKomplettWeg = heutigeStunden.length > 0 && entfalleneStunden.length === heutigeStunden.length;
  const tagKrank = tagKomplettWeg && entfalleneStunden.every((s) => entfallHeute.get(s.id)?.typ === "krank");
  const tagGrund = entfalleneStunden.map((s) => entfallHeute.get(s.id)?.begruendung).find((g) => g) ?? null;
  const gesamtNoten = faecher.reduce((s, f) => s + f.noten.length, 0);

  if (faecher.length === 0) {
    return (
      <section
        className="tilt-card animate-fade-up mt-4 rounded-3xl border border-border p-8"
        style={{ background: "var(--card-grad)", animationDelay: "0.05s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          Los geht&rsquo;s
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
          Willkommen! Trag deine Fächer ein und dein Schnitt erscheint hier.
        </h2>
        <p className="mt-2 font-mono text-sm text-text-dim">
          Fächer anlegen, Noten eintragen — den Rest rechnet der Notenrechner.
        </p>
        <Link
          href="/einstellungen#faecher"
          className="group mt-5 inline-flex items-center gap-1.5 font-display text-sm font-bold text-brand"
        >
          Erstes Fach hinzufügen
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </section>
    );
  }

  return (
    <>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SchnittKarte
          gesamt={gesamt}
          faecherAnzahl={faecher.length}
          animationDelay="0.05s"
        />

        <section
          className="tilt-card animate-fade-up rounded-3xl border border-border p-8"
          style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Nächste Klausur
          </div>
          {naechste ? (
            <div className="mt-3">
              <div className="font-display text-2xl font-extrabold">{naechste.titel}</div>
              <div className="mt-1 font-mono text-sm text-text-dim">
                {naechste.fach_id && fachInfo.get(naechste.fach_id)?.name
                  ? `${fachInfo.get(naechste.fach_id)?.name} · `
                  : ""}
                in {tageBis(naechste.datum)} Tagen
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <p className="font-display text-2xl font-extrabold text-text-dim">Alles frei.</p>
              <p className="mt-1 font-mono text-sm text-text-mute">Kein Termin eingetragen.</p>
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/aufgaben"
          className="tilt-card animate-fade-up group relative overflow-hidden rounded-3xl border border-border p-5 transition-colors hover:border-brand/40"
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
          <ArrowRight className="absolute bottom-4 right-4 size-4 text-text-mute opacity-0 transition-[transform,opacity] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>

        <Link
          href="/what-if"
          className="tilt-card animate-fade-up group relative overflow-hidden rounded-3xl border border-border p-5 transition-colors hover:border-brand/40"
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
          <ArrowRight className="absolute bottom-4 right-4 size-4 text-text-mute opacity-0 transition-[transform,opacity] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>

        <Link
          href="/stundenplan"
          className="tilt-card animate-fade-up group relative overflow-hidden rounded-3xl border border-border p-5 transition-colors hover:border-brand/40"
          style={{ background: "var(--card-grad)", animationDelay: "0.25s" }}
        >
          <div
            className="font-mono text-[10px] font-semibold uppercase tracking-[.2em]"
            style={{ color: freierTag ? "var(--brand)" : tagKomplettWeg ? (tagKrank ? "#f59e0b" : "#ff3050") : "var(--brand)" }}
          >
            Heute · {freierTag
              ? ferienHeute ? "Ferien" : "Feiertag"
              : tagKomplettWeg
              ? tagKrank ? "Krankgemeldet" : "Fällt aus"
              : heutigeStunden.length > 0 ? `${heutigeStunden.length} Stunde${heutigeStunden.length !== 1 ? "n" : ""}` : "Stundenplan"}
          </div>
          {freierTag ? (
            <>
              <div className="mt-2 font-display text-xl font-extrabold leading-tight">
                {freierTag}
              </div>
              <div className="mt-1 font-mono text-xs text-text-mute">
                {ferienHeute ? "Genieß die freie Zeit." : "Heute ist schulfrei."}
              </div>
            </>
          ) : tagKomplettWeg ? (
            <>
              <div
                className="mt-2 font-display text-xl font-extrabold leading-tight"
                style={{ color: tagKrank ? "#f59e0b" : "#ff3050" }}
              >
                {tagKrank ? "Du bist krank" : "Heute frei"}
              </div>
              <div className="mt-1 font-mono text-xs text-text-mute">
                {tagGrund ?? (tagKrank ? "Gute Besserung." : "Alle Stunden fallen aus")}
              </div>
            </>
          ) : heutigeStunden.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              {heutigeStunden.map((s) => {
                const info = s.fach_id ? fachInfo.get(s.fach_id) : null;
                const name = info?.name ?? s.bezeichnung ?? "–";
                const farbe = info?.farbe ?? null;
                const e = entfallHeute.get(s.id);
                return (
                  <div key={s.id} className={`flex items-center gap-2 ${e ? "opacity-45" : ""}`}>
                    <span className="w-[72px] shrink-0 font-mono text-[10px] text-text-mute tabular-nums">
                      {fmtZeit(s.zeit_start)}–{fmtZeit(s.zeit_end)}
                    </span>
                    {farbe && (
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: farbe }}
                      />
                    )}
                    <span
                      className="truncate font-display text-sm font-bold leading-tight"
                      style={{ color: farbe ?? undefined, textDecoration: e ? "line-through" : undefined }}
                    >
                      {name}
                    </span>
                    {e && (
                      <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider" style={{ color: e.typ === "krank" ? "#f59e0b" : "#ff3050" }}>
                        {e.typ === "krank" ? "krank" : "entfällt"}
                      </span>
                    )}
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
          <ArrowRight className="absolute bottom-4 right-4 size-4 text-text-mute opacity-0 transition-[transform,opacity] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>

        <Suspense fallback={<FerienSkeleton />}>
          <FerienCountdown />
        </Suspense>
      </div>
    </>
  );
}

function DashboardCardsSkeleton() {
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl border border-border p-8"
            style={{ background: "var(--card-grad)" }}
          >
            <div className="h-2 w-16 rounded bg-surface-2" />
            <div className="mt-4 h-10 w-28 rounded bg-surface-2" />
            <div className="mt-2 h-2.5 w-36 rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl border border-border p-5"
            style={{ background: "var(--card-grad)" }}
          >
            <div className="h-2 w-14 rounded bg-surface-2" />
            <div className="mt-3 h-8 w-20 rounded bg-surface-2" />
            <div className="mt-2 h-2 w-24 rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
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
