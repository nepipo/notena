import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { updatePraeferenzen } from "@/lib/actions/schule";
import { PushToggle } from "@/components/push-toggle";
import { KlausurErinnerungConfig } from "@/components/einstellungen/klausur-erinnerung-config";
import { FaecherVerwaltung } from "@/components/einstellungen/faecher-verwaltung";
import { GewichtungDefaults } from "@/components/einstellungen/gewichtung-defaults";
import { HalbjahrWechsler } from "@/components/einstellungen/halbjahr-wechsler";
import { PasswortAendern } from "@/components/einstellungen/passwort-aendern";
import { ThemeToggle } from "@/components/einstellungen/theme-toggle";
import { BriefingToggle } from "@/components/einstellungen/briefing-toggle";
import { aktuellesHalbjahr, halbjahrLabel } from "@/lib/grades/halbjahr";
import type { FachRow } from "@/lib/grades/db";
import type { GewichtungConfig } from "@/lib/grades/types";
import type { Theme } from "@/lib/actions/theme";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const theme = (cookieStore.get("project-x-theme")?.value ?? "dark") as Theme;

  const [{ data: profil }, { data: fachRows }] = await Promise.all([
    supabase.from("nutzer_profil").select("eingabe_modus, aktuelles_halbjahr, default_gewichtung, briefing_aktiv, klausur_erinnerung_tage").single(),
    supabase.from("schule_fach").select("*").order("name"),
  ]);

  const eingabeModus = profil?.eingabe_modus ?? "punkte";
  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();
  const defaultGewichtung = (profil?.default_gewichtung as GewichtungConfig | null) ?? null;
  const briefingAktiv = profil?.briefing_aktiv !== false;
  const klausurErinnerungTage = (profil?.klausur_erinnerung_tage as number[] | null) ?? [1, 3];
  const faecher = (fachRows ?? []) as FachRow[];

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[600px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          Einstellungen
        </div>
        <h1 className="text-4xl font-extrabold leading-none">Einstellungen.</h1>
      </header>

      {/* ── DARSTELLUNG ───────────────────────────────────── */}
      <section
        className="animate-fade-up rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.02s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Darstellung
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">Theme der App.</p>
        <ThemeToggle current={theme} />
      </section>

      {/* ── SCHULE ────────────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.05s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Schule
        </div>
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold">Aktuelles Halbjahr</p>
            <span className="font-mono text-xs text-brand">{halbjahrLabel(halbjahr)}</span>
          </div>
          <p className="mb-3 text-xs text-text-mute">
            Wechsle das Halbjahr um vergangene Noten einzusehen oder das neue anzufangen.
          </p>
          <HalbjahrWechsler current={halbjahr} />
        </div>
      </section>

      {/* ── EINGABE-MODUS ─────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Eingabe-Modus
        </div>
        <p className="mt-1 text-sm text-text-dim">Wie möchtest du Noten eingeben?</p>
        <div className="mt-4 flex gap-3">
          {(["punkte", "note"] as const).map((modus) => (
            <form key={modus} className="flex-1">
              <button
                formAction={async () => {
                  "use server";
                  await updatePraeferenzen(modus);
                }}
                className={`w-full rounded-xl border px-4 py-3 font-display font-bold transition-colors ${
                  eingabeModus === modus
                    ? "border-brand bg-brand text-black"
                    : "border-border bg-surface-2 text-foreground hover:bg-surface-3"
                }`}
              >
                {modus === "punkte" ? "Punkte (0–15)" : "Noten (1+ bis 6)"}
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* ── KI & BRIEFING ─────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.13s" }}
      >
        <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          KI & Briefing
        </div>
        <BriefingToggle initial={briefingAktiv} />
      </section>

      {/* ── BENACHRICHTIGUNGEN ────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.15s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Benachrichtigungen
        </div>
        <p className="mt-1 text-sm text-text-dim">
          Push-Alerts für Klausuren — direkt aufs Handy.
        </p>
        <div className="mt-4">
          <PushToggle />
        </div>
        <p className="mt-3 font-mono text-[11px] text-text-mute">
          Funktioniert als PWA (Homescreen-App) und im Browser. Einmalige Browser-Erlaubnis nötig.
        </p>
        <KlausurErinnerungConfig initial={klausurErinnerungTage} />
      </section>

      {/* ── STANDARD-GEWICHTUNG ───────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.2s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Standard-Gewichtung
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">
          Vorlage für neue Fächer — oder auf alle bestehenden anwenden.
        </p>
        <GewichtungDefaults initialConfig={defaultGewichtung} aktuellesHalbjahr={halbjahr} />
      </section>

      {/* ── FÄCHER ────────────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.25s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Fächer · {halbjahrLabel(halbjahr)}
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">
          Hinzufügen, umbenennen, GK/LK wechseln oder löschen.
        </p>
        <FaecherVerwaltung faecher={faecher} halbjahr={halbjahr} />
      </section>

      {/* ── PASSWORT ──────────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.3s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Passwort ändern
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">
          Neues Passwort setzen — mindestens 8 Zeichen.
        </p>
        <PasswortAendern />
      </section>

      {/* ── DATEN & PRIVATSPHÄRE ──────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.33s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Daten & Privatsphäre
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">
          Deine Daten gehören dir — exportiere oder lösche sie jederzeit.
        </p>
        <a
          href="/api/export"
          download
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 font-mono text-sm font-semibold text-foreground transition-colors hover:border-brand/40 hover:text-brand"
        >
          Daten exportieren (JSON)
        </a>
        <p className="mt-2 font-mono text-[11px] text-text-mute">
          Enthält Fächer, Noten und Klausuren. DSGVO Art. 20.
        </p>
      </section>

      {/* ── ACCOUNT ───────────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.35s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Account
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">
          Profil-Details (Name, Klasse, Schule) änderst du unter{" "}
          <Link href="/profil" className="text-brand hover:underline">Profil</Link>.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="border-border bg-surface-2 hover:bg-surface-3">
            Abmelden
          </Button>
        </form>
      </section>

      {/* ── RECHTLICHES ───────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-5"
        style={{ background: "var(--card-grad)", animationDelay: "0.4s" }}
      >
        <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Rechtliches
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-sm text-text-dim">
          <Link href="/datenschutz" className="transition-colors hover:text-brand">Datenschutzerklärung</Link>
          <Link href="/impressum" className="transition-colors hover:text-brand">Impressum</Link>
        </div>
      </section>
    </main>
  );
}
