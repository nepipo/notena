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
  const todayStr = new Date().toISOString().slice(0, 10);
  const naechsteKlausur = klausuren.find((k) => k.datum.slice(0, 10) >= todayStr);
  const tageBisKlausur = naechsteKlausur
    ? Math.round(
        (new Date(naechsteKlausur.datum.slice(0, 10) + "T00:00:00.000Z").getTime() -
          new Date(todayStr + "T00:00:00.000Z").getTime()) /
          86400000,
      )
    : null;

  const zukunftKlausuren = klausuren.filter((k) => k.datum.slice(0, 10) >= todayStr).length;

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[720px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span
            className={`inline-block size-1.5 rounded-full ${
              tageBisKlausur !== null && tageBisKlausur <= 3
                ? "animate-pulse bg-destructive"
                : "bg-brand"
            }`}
          />
          Aufgaben
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
          {tageBisKlausur !== null && tageBisKlausur <= 3
            ? "Klausur in Kürze."
            : "Dein Pensum."}
        </h1>
        <p className="mt-2 font-mono text-sm text-text-dim">
          {tageBisKlausur !== null && tageBisKlausur <= 7 ? (
            <>
              <span className="text-destructive font-semibold">
                {naechsteKlausur?.titel} in {tageBisKlausur === 0 ? "heute" : `${tageBisKlausur} Tag${tageBisKlausur === 1 ? "" : "en"}`}
              </span>
              {offeneHA > 0 && ` · ${offeneHA} HA offen`}
            </>
          ) : (
            `${offeneHA} Hausaufgabe${offeneHA === 1 ? "" : "n"} offen · ${zukunftKlausuren} Klausur${zukunftKlausuren === 1 ? "" : "en"} geplant`
          )}
        </p>
      </header>

      <div
        className="animate-fade-up rounded-3xl border border-border p-5 sm:p-6"
        style={{ background: "var(--card-grad)", animationDelay: "60ms" }}
      >
        <AufgabenListe faecher={faecher} hausaufgaben={hausaufgaben} klausuren={klausuren} />
      </div>
    </main>
  );
}
