import { createClient } from "@/lib/supabase/server";
import { getCachedProfil } from "@/lib/supabase/cache";
import dynamic from "next/dynamic";

const NotenrechnerBoard = dynamic(
  () => import("@/components/notenrechner/notenrechner-board").then((m) => m.NotenrechnerBoard),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-white/5" /> },
);
import {
  assembleFaecher,
  type FachRow,
  type NoteRow,
  type KlausurRow,
} from "@/lib/grades/db";
import {
  aktuellesHalbjahr,
  vorherigesHalbjahr,
  halbjahreImSchuljahr,
  schuljahrLabel,
} from "@/lib/grades/halbjahr";
import { fachSchnittGerundet } from "@/lib/grades/calc";
import { berechneJahresUebersicht } from "@/lib/grades/jahr";

// Auth + Onboarding-Check macht app/(app)/layout.tsx zentral.
export default async function NotenPage() {
  const supabase = await createClient();

  // getCachedProfil() dedupliziert — Layout hat es bereits geladen, kein extra DB-Call.
  const profil = await getCachedProfil();
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const vorigesHj = vorherigesHalbjahr(halbjahr);
  const [shj1, shj2] = halbjahreImSchuljahr(halbjahr);
  const todayUtc = new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";

  // Batch 1: Alle Fach-Queries parallel (brauchen nur halbjahr, nicht fachIds)
  const [
    { data: fachRows, error: fachErr },
    { data: hjRows, error: hjErr },
    { data: klausurRows, error: klausurErr },
    { data: vorFachRows, error: vorFachErr },
    { data: jahrFachRows, error: jahrFachErr },
  ] = await Promise.all([
    supabase.from("schule_fach").select("*").or(`halbjahr.eq.${halbjahr},halbjahr.is.null`).order("created_at", { ascending: true }),
    supabase.from("schule_fach").select("halbjahr"),
    supabase.from("schule_klausur").select("*").gte("datum", todayUtc).order("datum", { ascending: true }).limit(20),
    supabase.from("schule_fach").select("*").eq("halbjahr", vorigesHj),
    supabase.from("schule_fach").select("*").in("halbjahr", [shj1, shj2]),
  ]);
  if (fachErr) console.error("[noten] schule_fach fetch error:", fachErr);
  if (hjErr) console.error("[noten] halbjahr distinct fetch error:", hjErr);
  if (klausurErr) console.error("[noten] schule_klausur fetch error:", klausurErr);
  if (vorFachErr) console.error("[noten] vorFachRows fetch error:", vorFachErr);
  if (jahrFachErr) console.error("[noten] jahrFachRows fetch error:", jahrFachErr);

  const verfuegbareHalbjahre = Array.from(
    new Set([halbjahr, ...(hjRows ?? []).map((r) => r.halbjahr).filter((h): h is string => !!h)]),
  ).sort();

  // Batch 2: Alle Noten-Queries parallel (brauchen fachIds aus Batch 1)
  const fachIds = (fachRows ?? []).map((f) => f.id);
  const vorFachIds = (vorFachRows ?? []).map((f) => f.id);
  const jahrFachIds = (jahrFachRows ?? []).map((f) => f.id);

  const [
    { data: noteRows, error: noteErr },
    { data: vorNoteRows, error: vorNoteErr },
    { data: jahrNoteRows, error: jahrNoteErr },
  ] = await Promise.all([
    fachIds.length
      ? supabase.from("schule_note").select("*").in("fach_id", fachIds)
      : Promise.resolve({ data: [] as NoteRow[], error: null }),
    vorFachIds.length
      ? supabase.from("schule_note").select("*").in("fach_id", vorFachIds)
      : Promise.resolve({ data: [] as NoteRow[], error: null }),
    jahrFachIds.length
      ? supabase.from("schule_note").select("*").in("fach_id", jahrFachIds)
      : Promise.resolve({ data: [] as NoteRow[], error: null }),
  ]);
  if (noteErr) console.error("[noten] schule_note fetch error:", noteErr);
  if (vorNoteErr) console.error("[noten] vorNoteRows fetch error:", vorNoteErr);
  if (jahrNoteErr) console.error("[noten] jahrNoteRows fetch error:", jahrNoteErr);

  const faecher = assembleFaecher((fachRows ?? []) as FachRow[], (noteRows ?? []) as NoteRow[]);
  const klausuren = (klausurRows ?? []) as KlausurRow[];

  const vorFaecher = assembleFaecher((vorFachRows ?? []) as FachRow[], (vorNoteRows ?? []) as NoteRow[]);
  const vorherSchnitte: Record<string, number> = {};
  for (const vf of vorFaecher) {
    const s = fachSchnittGerundet(vf.noten, vf.gewichtungConfig);
    if (s !== null) vorherSchnitte[vf.name] = s;
  }

  const alleJahrFach = (jahrFachRows ?? []) as FachRow[];
  const alleJahrNoten = (jahrNoteRows ?? []) as NoteRow[];
  const shj1Faecher = assembleFaecher(
    alleJahrFach.filter((f) => f.halbjahr === shj1),
    alleJahrNoten,
  );
  const shj2Faecher = assembleFaecher(
    alleJahrFach.filter((f) => f.halbjahr === shj2),
    alleJahrNoten,
  );
  const jahresUebersicht = berechneJahresUebersicht(shj1Faecher, shj2Faecher);

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          Notenrechner
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
          Deine Noten.
        </h1>
        <p className="mt-2 font-mono text-sm text-text-dim">Halbjahr {halbjahr}</p>
      </header>

      <NotenrechnerBoard
        key={halbjahr}
        initialFaecher={faecher}
        halbjahr={halbjahr}
        initialKlausuren={klausuren}
        verfuegbareHalbjahre={verfuegbareHalbjahre}
        vorherSchnitte={vorherSchnitte}
        jahresUebersicht={jahresUebersicht}
        schuljahr={schuljahrLabel(halbjahr)}
      />
    </main>
  );
}
