import { createClient } from "@/lib/supabase/server";
import { StundenplanBoard } from "@/components/stundenplan/stundenplan-board";
import type { StundeRow, HausaufgabeRow } from "@/lib/stundenplan/types";
import type { FachRow, KlausurRow } from "@/lib/grades/db";

const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

export default async function StundenplanPage() {
  const supabase = await createClient();

  const [{ data: stundeRows }, { data: fachRows }, { data: haRows }, { data: klausurRows }] =
    await Promise.all([
      supabase.from("stundenplan_stunde").select("*").order("wochentag").order("zeit_start"),
      supabase.from("schule_fach").select("*").order("name"),
      supabase.from("hausaufgabe").select("*").order("faellig_am"),
      supabase.from("schule_klausur").select("*").order("datum"),
    ]);

  const stunden = (stundeRows ?? []) as StundeRow[];
  const heute = new Date().getDay(); // 0=So…6=Sa
  const heuteIso = heute === 0 || heute === 6 ? null : heute; // nur Mo–Fr
  const heutigeStundenAnzahl = heuteIso
    ? stunden.filter((s) => s.wochentag === heuteIso).length
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
              ? `${WOCHENTAGE[heute]} · ${heutigeStundenAnzahl} Stunde${heutigeStundenAnzahl === 1 ? "" : "n"} heute`
              : `${WOCHENTAGE[heute]} · kein Unterricht heute`
            : "Wochenende — genieß es."}
        </p>
      </header>

      <StundenplanBoard
        stunden={stunden}
        faecher={(fachRows ?? []) as FachRow[]}
        hausaufgaben={(haRows ?? []) as HausaufgabeRow[]}
        klausuren={(klausurRows ?? []) as KlausurRow[]}
      />
    </main>
  );
}
