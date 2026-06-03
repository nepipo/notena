import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { NotenrechnerBoard } from "@/components/notenrechner/notenrechner-board";
import {
  assembleFaecher,
  assembleKlausuren,
  type FachRow,
  type NoteRow,
  type KlausurRow,
} from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";

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
  const klausurMap = assembleKlausuren((klausurRows ?? []) as KlausurRow[]);
  const klausuren = Array.from(klausurMap.values());

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
      />
    </main>
  );
}
