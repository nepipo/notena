import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  assembleFaecher,
  type FachRow,
  type NoteRow,
  type KlausurRow,
} from "@/lib/grades/db";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { gesamtSchnittGerundet, punkteZuNote } from "@/lib/grades/calc";
import { schnittFarbe } from "@/lib/grades/schnitt-farbe";
import { Calculator, Sparkles, CalendarDays } from "lucide-react";

function fmt(n: number | null): string {
  return n === null ? "–" : n.toLocaleString("de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function tageBis(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

const SCHNELLZUGRIFF = [
  { href: "/noten", label: "Notenrechner", icon: Calculator },
  { href: "/what-if", label: "What-If", icon: Sparkles },
  { href: "/stundenplan", label: "Stundenplan", icon: CalendarDays },
];

export default async function DashboardPage() {
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

  const { data: klausurRows } = await supabase
    .from("schule_klausur")
    .select("*")
    .gte("datum", new Date().toISOString())
    .order("datum", { ascending: true })
    .limit(1);

  const faecher = assembleFaecher(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
  );
  const gesamt = gesamtSchnittGerundet(faecher);
  const fachName = new Map(faecher.map((f) => [f.id, f.name]));
  const naechste = ((klausurRows ?? []) as KlausurRow[])[0] ?? null;

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          Übersicht · {halbjahr}
        </div>
        <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">Dein Cockpit.</h1>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Gesamtschnitt */}
        <section
          className="lift animate-fade-up relative overflow-hidden rounded-[28px] border-2 p-8"
          style={{
            background: "var(--hero-grad)",
            borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
            animationDelay: "0.05s",
          }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Gesamtschnitt
          </div>
          <div className="mt-3 flex items-end">
            <span
              className="font-display text-[88px] font-extrabold leading-[0.85] tracking-[-0.06em]"
              style={{ color: schnittFarbe(gesamt) }}
            >
              {fmt(gesamt)}
            </span>
            <span className="mb-2 ml-1 text-2xl font-medium text-text-mute">/15</span>
          </div>
          {gesamt !== null && (
            <div className="mt-2 font-mono text-sm text-text-dim">
              Note {punkteZuNote(gesamt)} · {faecher.length} Fächer
            </div>
          )}
        </section>

        {/* Nächste Klausur */}
        <section
          className="lift animate-fade-up rounded-[28px] border border-border p-8"
          style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
        >
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Nächste Klausur
          </div>
          {naechste ? (
            <div className="mt-3">
              <div className="font-display text-2xl font-extrabold">{naechste.titel}</div>
              <div className="mt-1 font-mono text-sm text-text-dim">
                {naechste.fach_id && fachName.get(naechste.fach_id)
                  ? `${fachName.get(naechste.fach_id)} · `
                  : ""}
                in {tageBis(naechste.datum)} Tagen
              </div>
            </div>
          ) : (
            <p className="mt-3 font-mono text-sm text-text-mute">
              Kein Termin eingetragen.
            </p>
          )}
        </section>
      </div>

      {/* Schnellzugriff */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {SCHNELLZUGRIFF.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="lift animate-fade-up flex items-center gap-3 rounded-3xl border border-border p-5 transition-colors hover:border-brand/40"
              style={{ background: "var(--card-grad)", animationDelay: `${0.15 + i * 0.05}s` }}
            >
              <Icon className="size-5 text-brand" />
              <span className="font-display font-bold">{s.label}</span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
