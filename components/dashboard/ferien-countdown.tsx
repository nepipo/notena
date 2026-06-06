import { createClient } from "@/lib/supabase/server";
import { getFerienStatus } from "@/lib/ferien/ferien";
import type { Bundesland } from "@/lib/ferien/ferien-data";
import Link from "next/link";

export async function FerienCountdown() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub ?? "";

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("bundesland")
    .eq("id", userId)
    .single();

  const bl = profil?.bundesland as Bundesland | null | undefined;

  if (!bl) {
    return (
      <Link
        href="/einstellungen"
        className="lift animate-fade-up group relative overflow-hidden rounded-3xl border border-border p-5 transition-colors hover:border-brand/40"
        style={{ background: "var(--card-grad)", animationDelay: "0.3s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-brand">
          Ferien
        </div>
        <div className="mt-2 font-display text-xl font-extrabold leading-tight text-text-dim">
          Bundesland<br />fehlt
        </div>
        <div className="mt-1 font-mono text-xs text-text-mute">
          In Einstellungen ergänzen →
        </div>
      </Link>
    );
  }

  const status = getFerienStatus(bl);

  if (status.laufend) {
    const tage = status.tagesBisEnde ?? 0;
    return (
      <div
        className="lift animate-fade-up relative overflow-hidden rounded-3xl border-2 p-5"
        style={{
          background: "var(--hero-grad)",
          borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
          animationDelay: "0.3s",
        }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-brand">
          {status.laufend.name}
        </div>
        <div
          className="mt-2 font-display text-3xl font-extrabold leading-none"
          style={{ color: "var(--brand)" }}
        >
          {tage === 0 ? "Letzter Tag!" : `${tage} Tage`}
        </div>
        <div className="mt-1 font-mono text-xs text-text-dim">
          {tage === 0 ? "Morgen geht's wieder los" : "noch frei"}
        </div>
      </div>
    );
  }

  if (status.naechste && status.tagesBisNaechste !== null) {
    const tage = status.tagesBisNaechste;
    return (
      <div
        className="lift animate-fade-up relative overflow-hidden rounded-3xl border border-border p-5"
        style={{ background: "var(--card-grad)", animationDelay: "0.3s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-brand">
          {status.naechste.name}
        </div>
        <div className="mt-2 font-display text-3xl font-extrabold leading-none">
          {tage} Tage
        </div>
        <div className="mt-1 font-mono text-xs text-text-dim">
          {tage === 1 ? "bis Morgen!" : `noch bis zu den ${status.naechste.name}`}
        </div>
      </div>
    );
  }

  return null;
}
