import { createClient } from "@/lib/supabase/server";
import { StundenplanBoard } from "@/components/stundenplan/stundenplan-board";
import type { StundeRow, HausaufgabeRow } from "@/lib/stundenplan/types";
import type { FachRow, KlausurRow } from "@/lib/grades/db";

export default async function StundenplanPage() {
  const supabase = await createClient();

  const [{ data: stundeRows }, { data: fachRows }, { data: haRows }, { data: klausurRows }] =
    await Promise.all([
      supabase.from("stundenplan_stunde").select("*").order("wochentag").order("zeit_start"),
      supabase.from("schule_fach").select("*").order("name"),
      supabase.from("hausaufgabe").select("*").order("faellig_am"),
      supabase.from("schule_klausur").select("*").order("datum"),
    ]);

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-8 sm:px-8">
      <StundenplanBoard
        stunden={(stundeRows ?? []) as StundeRow[]}
        faecher={(fachRows ?? []) as FachRow[]}
        hausaufgaben={(haRows ?? []) as HausaufgabeRow[]}
        klausuren={(klausurRows ?? []) as KlausurRow[]}
      />
    </main>
  );
}
