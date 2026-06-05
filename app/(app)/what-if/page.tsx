import { createClient } from "@/lib/supabase/server";
import {
  assembleFaecher,
  type FachRow,
  type NoteRow,
} from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { WasWaereWennSeite } from "@/components/was-waere-wenn-seite";

export default async function WasWaereWennPage() {
  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("aktuelles_halbjahr")
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

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[760px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-brand" />
          What-If Simulator
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
          Spiel es durch.
        </h1>
        <p className="mt-2 max-w-lg text-sm text-text-dim">
          Füge hypothetische Noten hinzu und sieh in Echtzeit, wie sich dein Fach-Schnitt{" "}
          <em>und</em> Gesamtschnitt verändern. Oder rechne aus, was du mindestens brauchst.
        </p>
      </header>

      <WasWaereWennSeite faecher={faecher} />
    </main>
  );
}
