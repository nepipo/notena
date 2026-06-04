import { createClient } from "@/lib/supabase/server";
import { KlausurListe } from "@/components/aufgaben/klausur-liste";
import { HausaufgabenListe } from "@/components/aufgaben/hausaufgaben-liste";
import type { KlausurRow, FachRow } from "@/lib/grades/db";
import type { HausaufgabeRow } from "@/lib/stundenplan/types";

export default async function AufgabenPage() {
  const supabase = await createClient();

  const [{ data: fachRows }, { data: klausurRows }, { data: hausaufgabeRows }] =
    await Promise.all([
      supabase.from("schule_fach").select("*").order("name"),
      supabase
        .from("schule_klausur")
        .select("*")
        .order("datum", { ascending: true }),
      supabase
        .from("hausaufgabe")
        .select("*")
        .order("erledigt", { ascending: true })
        .order("faellig_am", { ascending: true }),
    ]);

  const faecher = (fachRows ?? []) as FachRow[];
  const klausuren = (klausurRows ?? []) as KlausurRow[];
  const hausaufgaben = (hausaufgabeRows ?? []) as HausaufgabeRow[];

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[900px] px-5 py-8 sm:px-8">
      <div className="animate-fade-up mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Aufgaben
        </h1>
        <p className="mt-1 font-mono text-sm text-text-dim">
          {klausuren.filter((k) => {
            const d = new Date(k.datum).getTime() - Date.now();
            return d > 0 && d < 7 * 24 * 60 * 60 * 1000;
          }).length > 0
            ? "Klausur in weniger als 7 Tagen — bereit sein."
            : `${klausuren.length} Klausuren · ${hausaufgaben.filter((h) => !h.erledigt).length} Hausaufgaben offen`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div
          className="animate-fade-up rounded-3xl border border-border p-6"
          style={{ background: "var(--card-grad)", animationDelay: "60ms" }}
        >
          <KlausurListe faecher={faecher} klausuren={klausuren} />
        </div>
        <div
          className="animate-fade-up rounded-3xl border border-border p-6"
          style={{ background: "var(--card-grad)", animationDelay: "120ms" }}
        >
          <HausaufgabenListe faecher={faecher} hausaufgaben={hausaufgaben} />
        </div>
      </div>
    </main>
  );
}
