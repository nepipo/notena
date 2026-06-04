import { createClient } from "@/lib/supabase/server";
import { StundenplanBoard } from "@/components/stundenplan/stundenplan-board";
import type { StundeRow } from "@/lib/stundenplan/types";
import type { FachRow } from "@/lib/grades/db";

export default async function StundenplanPage() {
  const supabase = await createClient();

  const [{ data: stundeRows }, { data: fachRows }] = await Promise.all([
    supabase
      .from("stundenplan_stunde")
      .select("*")
      .order("wochentag")
      .order("zeit_start"),
    supabase.from("schule_fach").select("*").order("name"),
  ]);

  const stunden = (stundeRows ?? []) as StundeRow[];
  const faecher = (fachRows ?? []) as FachRow[];

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-8 sm:px-8">
      <StundenplanBoard stunden={stunden} faecher={faecher} />
    </main>
  );
}
