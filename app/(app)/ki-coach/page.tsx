import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCachedProfil } from "@/lib/supabase/cache";
import { istPro } from "@/lib/pro/plan";
import { aktuellesHalbjahr } from "@/lib/grades/halbjahr";
import { berechneTrend } from "@/lib/grades/trend";
import type { FachRow, NoteRow } from "@/lib/grades/db";
import { getNotensystem } from "@/lib/grades/systems";
import { CoachChat } from "@/components/dashboard/coach-chat";
import { UpgradePrompt } from "@/components/pro/upgrade-prompt";
import { PaywallOverlay } from "@/components/pro/paywall-overlay";
import { TrendChart } from "@/components/coach/trend-chart";

export default async function CoachPage() {
  const profil = await getCachedProfil();
  const pro = istPro(profil);

  // Trend-Daten fürs aktive Halbjahr laden (Historie gratis, Prognose Pro).
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const systemId = profil?.notensystem ?? getNotensystem("de_0_15").id;
  const supabase = await createClient();
  const { data: fachRows } = await supabase
    .from("schule_fach")
    .select("*")
    .or(`halbjahr.eq.${halbjahr},halbjahr.is.null`)
    .order("created_at", { ascending: true });
  const fachIds = (fachRows ?? []).map((f) => f.id);
  const { data: noteRows } = fachIds.length
    ? await supabase.from("schule_note").select("*").in("fach_id", fachIds)
    : { data: [] as NoteRow[] };
  const trend = berechneTrend(
    (fachRows ?? []) as FachRow[],
    (noteRows ?? []) as NoteRow[],
    getNotensystem(systemId),
  );

  return (
    <main className="mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          Coach
        </div>
        <h1 className="font-display text-3xl font-extrabold leading-none sm:text-4xl md:text-5xl">
          Dein Lernbegleiter
        </h1>
      </header>

      {/* Notenverlauf — Historie gratis, Prognose Pro */}
      <div className="animate-fade-up mb-4" style={{ animationDelay: "0.03s" }}>
        <TrendChart
          gesamt={trend.gesamt}
          proFach={trend.proFach}
          prognose={trend.prognose}
          pro={pro}
          systemId={systemId}
        />
      </div>

      {/* What If */}
      <Link
        href="/what-if"
        className="group animate-fade-up relative mb-4 flex items-center gap-4 overflow-hidden rounded-3xl border border-border p-6 transition-colors hover:border-brand/40"
        style={{ background: "var(--card-grad)", animationDelay: "0.05s" }}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand/10">
          <TrendingUp className="size-5 text-brand" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-base font-extrabold">What If — Schnitt simulieren</div>
          <div className="mt-0.5 font-sans text-sm text-text-dim">
            Trag fiktive Noten ein und sieh sofort wie sich dein Schnitt verändert.
          </div>
        </div>
        <span className="ml-auto shrink-0 font-mono text-xs text-text-mute transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </Link>

      {/* KI Coach Chat */}
      <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        {pro ? (
          <CoachChat />
        ) : (
          <>
            <UpgradePrompt feature="KI-Coach" />
            {/* Popt beim Öffnen automatisch auf, X → zeigt den gesperrten Zustand darunter */}
            <PaywallOverlay feature="KI-Coach" />
          </>
        )}
      </div>
    </main>
  );
}
