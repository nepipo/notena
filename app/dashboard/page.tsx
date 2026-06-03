import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { NotenrechnerBoard } from "@/components/notenrechner/notenrechner-board";
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const email = typeof claims.email === "string" ? claims.email : "Account";

  // Profil laden (onboarding + halbjahr)
  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("aktuelles_halbjahr, onboarding_abgeschlossen")
    .single();

  // Onboarding noch nicht abgeschlossen → weiterleiten
  if (profil && profil.onboarding_abgeschlossen === false) {
    redirect("/onboarding");
  }

  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();

  // Fächer + Noten für aktuelles Halbjahr
  const { data: fachRows } = await supabase
    .from("schule_fach")
    .select("*")
    .eq("halbjahr", halbjahr)
    .order("created_at", { ascending: true });

  // Verfügbare Halbjahre (distinct) über ALLE Fächer des Users
  const { data: hjRows } = await supabase.from("schule_fach").select("halbjahr");
  const verfuegbareHalbjahre = Array.from(
    new Set([
      halbjahr,
      ...(hjRows ?? [])
        .map((r) => r.halbjahr)
        .filter((h): h is string => !!h),
    ]),
  ).sort();

  const fachIds = (fachRows ?? []).map((f) => f.id);
  const { data: noteRows } = fachIds.length
    ? await supabase.from("schule_note").select("*").in("fach_id", fachIds)
    : { data: [] as NoteRow[] };

  // Upcoming Klausuren (für Countdown-Badge)
  const { data: klausurRows } = await supabase
    .from("schule_klausur")
    .select("*")
    .gte("datum", new Date().toISOString())
    .order("datum", { ascending: true })
    .limit(20);

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );
  const klausuren = (klausurRows ?? []) as KlausurRow[];

  // Vorhalbjahres-Schnitte (pro Fachname) als Referenz im neuen HJ.
  const vorigesHj = vorherigesHalbjahr(halbjahr);
  const { data: vorFachRows } = await supabase
    .from("schule_fach")
    .select("*")
    .eq("halbjahr", vorigesHj);
  const vorFachIds = (vorFachRows ?? []).map((f) => f.id);
  const { data: vorNoteRows } = vorFachIds.length
    ? await supabase.from("schule_note").select("*").in("fach_id", vorFachIds)
    : { data: [] as NoteRow[] };
  const vorFaecher = assembleFaecher(
    (vorFachRows ?? []) as FachRow[],
    (vorNoteRows ?? []) as NoteRow[],
  );
  const vorherSchnitte: Record<string, number> = {};
  for (const vf of vorFaecher) {
    const s = fachSchnittGerundet(vf.noten, vf.gewichtung);
    if (s !== null) vorherSchnitte[vf.name] = s;
  }

  // Jahres-Übersicht: beide Halbjahre des aktuellen Schuljahres
  const [shj1, shj2] = halbjahreImSchuljahr(halbjahr);
  const { data: jahrFachRows } = await supabase
    .from("schule_fach")
    .select("*")
    .in("halbjahr", [shj1, shj2]);
  const jahrFachIds = (jahrFachRows ?? []).map((f) => f.id);
  const { data: jahrNoteRows } = jahrFachIds.length
    ? await supabase.from("schule_note").select("*").in("fach_id", jahrFachIds)
    : { data: [] as NoteRow[] };
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
      <header className="animate-fade-up mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            <span className="inline-block size-1.5 rounded-full bg-success" />
            Dashboard · Schule
          </div>
          <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">
            Dein Notenrechner.
          </h1>
          <p className="mt-2 text-sm text-text-dim">
            {email} · Halbjahr {halbjahr}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="rounded-xl border border-border bg-surface-2 px-4 py-2 font-sans text-sm transition-colors hover:bg-surface-3"
          >
            Einstellungen
          </Link>
          <form action={signOut}>
            <Button
              variant="outline"
              className="border-border bg-surface-2 hover:bg-surface-3"
            >
              Abmelden
            </Button>
          </form>
        </div>
      </header>

      <NotenrechnerBoard
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
