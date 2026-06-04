import { createClient } from "@/lib/supabase/server";
import { AufgabenListe } from "@/components/aufgaben/aufgaben-liste";
import type { KlausurRow, FachRow } from "@/lib/grades/db";
import type { HausaufgabeRow } from "@/lib/stundenplan/types";

export default async function AufgabenPage() {
  const supabase = await createClient();

  const [{ data: fachRows }, { data: klausurRows }, { data: hausaufgabeRows }] =
    await Promise.all([
      supabase.from("schule_fach").select("*").order("name"),
      supabase.from("schule_klausur").select("*").order("datum", { ascending: true }),
      supabase.from("hausaufgabe").select("*").order("erledigt", { ascending: true }).order("faellig_am", { ascending: true }),
    ]);

  const faecher = (fachRows ?? []) as FachRow[];
  const klausuren = (klausurRows ?? []) as KlausurRow[];
  const hausaufgaben = (hausaufgabeRows ?? []) as HausaufgabeRow[];

  const offeneHA = hausaufgaben.filter((h) => !h.erledigt).length;
  const naechsteKlausur = klausuren.find((k) => new Date(k.datum) > new Date());
  const tageBisKlausur = naechsteKlausur
    ? Math.ceil((new Date(naechsteKlausur.datum).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[720px] px-5 py-8 sm:px-8">
      <div className="animate-fade-up mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Aufgaben</h1>
        <p className="mt-1 font-mono text-sm text-text-dim">
          {tageBisKlausur !== null && tageBisKlausur <= 7
            ? `Nächste Klausur in ${tageBisKlausur}T — jetzt vorbereiten.`
            : `${offeneHA} HA offen · ${klausuren.length} Klausuren`}
        </p>
      </div>

      <div
        className="animate-fade-up rounded-3xl border border-border p-5 sm:p-6"
        style={{ background: "var(--card-grad)", animationDelay: "60ms" }}
      >
        <AufgabenListe faecher={faecher} hausaufgaben={hausaufgaben} klausuren={klausuren} />
      </div>
    </main>
  );
}
