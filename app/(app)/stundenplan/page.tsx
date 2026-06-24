import { createClient } from "@/lib/supabase/server";
import { getCachedClaims, getCachedProfil } from "@/lib/supabase/cache";
import { StundenplanBoard } from "@/components/stundenplan/stundenplan-board";
import type { StundeRow, HausaufgabeRow, EntfallRow, HalbjahrRow } from "@/lib/stundenplan/types";
import type { FachRow, KlausurRow } from "@/lib/grades/db";
import type { Bundesland } from "@/lib/ferien/ferien-data";

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export default async function StundenplanPage() {
  const supabase = await createClient();
  // getCachedClaims() + getCachedProfil() sind dedupliziert — Layout hat beides bereits geladen.
  const claims = await getCachedClaims();
  const userId = claims?.sub ?? "";
  const cachedProfil = await getCachedProfil();

  // Load entfälle for ±8 weeks around today
  const heute = new Date();
  const vonDatum = new Date(heute); vonDatum.setDate(heute.getDate() - 56);
  const bisDatum = new Date(heute); bisDatum.setDate(heute.getDate() + 56);

  const [
    { data: halbjahreRows },
    { data: stundeRows },
    { data: alleFachRows },
    { data: haRows },
    { data: klausurRows },
    { data: entfallRows },
  ] = await Promise.all([
    supabase.from("stundenplan_halbjahr").select("*").eq("user_id", userId).order("created_at"),
    supabase.from("stundenplan_stunde").select("*").order("wochentag").order("zeit_start"),
    supabase.from("schule_fach").select("*").order("name"),
    supabase.from("hausaufgabe").select("*").order("faellig_am"),
    supabase.from("schule_klausur").select("*").order("datum"),
    supabase.from("stundenplan_entfall").select("*")
      .gte("datum", vonDatum.toISOString().slice(0, 10))
      .lte("datum", bisDatum.toISOString().slice(0, 10)),
  ]);

  const halbjahre = (halbjahreRows ?? []) as HalbjahrRow[];
  const aktivesHalbjahr = halbjahre.find((h) => h.aktiv) ?? halbjahre[0] ?? null;
  const fachRows = alleFachRows ?? [];
  const bundesland = (cachedProfil?.bundesland as Bundesland | null | undefined) ?? null;

  const alleStunden = (stundeRows ?? []) as StundeRow[];
  // Stunden des aktiven Halbjahrs (für Header-Zähler)
  const aktivStunden = aktivesHalbjahr
    ? alleStunden.filter((s) => s.halbjahr_id === aktivesHalbjahr.id)
    : alleStunden;
  const heuteWochentag = heute.getDay();
  const heuteIso = heuteWochentag === 0 || heuteWochentag === 6 ? null : heuteWochentag;
  const heutigeStundenAnzahl = heuteIso
    ? aktivStunden.filter((s) => s.wochentag === heuteIso).length
    : 0;

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-6">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          Stundenplan
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
          Deine Woche.
        </h1>
        <p className="mt-2 font-mono text-sm text-text-dim">
          {heuteIso
            ? heutigeStundenAnzahl > 0
              ? `${WOCHENTAGE[heuteWochentag]} · ${heutigeStundenAnzahl} Stunde${heutigeStundenAnzahl === 1 ? "" : "n"} heute`
              : `${WOCHENTAGE[heuteWochentag]} · kein Unterricht heute`
            : "Wochenende — genieß es."}
        </p>
      </header>

      <StundenplanBoard
        halbjahre={halbjahre}
        aktivesHalbjahrId={aktivesHalbjahr?.id ?? null}
        stunden={alleStunden}
        faecher={fachRows as FachRow[]}
        alleFaecher={(alleFachRows ?? []) as FachRow[]}
        hausaufgaben={(haRows ?? []) as HausaufgabeRow[]}
        klausuren={(klausurRows ?? []) as KlausurRow[]}
        entfaelle={(entfallRows ?? []) as EntfallRow[]}
        bundesland={bundesland}
      />
    </main>
  );
}
