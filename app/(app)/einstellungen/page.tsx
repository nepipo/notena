import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { signOut, deleteAccount } from "@/app/auth/actions";
import { PushToggle } from "@/components/push-toggle";
import { KlausurErinnerungConfig } from "@/components/einstellungen/klausur-erinnerung-config";
import { FaecherVerwaltung } from "@/components/einstellungen/faecher-verwaltung";
import { LkGewichtungToggle } from "@/components/einstellungen/lk-gewichtung-toggle";
import { GewichtungDefaults } from "@/components/einstellungen/gewichtung-defaults";
import { HalbjahrWechsler } from "@/components/einstellungen/halbjahr-wechsler";
import { PasswortAendern } from "@/components/einstellungen/passwort-aendern";
import { ThemeToggle } from "@/components/einstellungen/theme-toggle";
import { AccentPicker } from "@/components/einstellungen/accent-picker";
import { BriefingToggle } from "@/components/einstellungen/briefing-toggle";
import { BundeslandSelector } from "@/components/einstellungen/bundesland-selector";
import { NotensystemWahl } from "@/components/einstellungen/notensystem-wahl";
import { ProfilForm } from "@/components/profil-form";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { AboStatus } from "@/components/einstellungen/abo-status";
import { Button } from "@/components/ui/button";
import { CustomKategorienVerwaltung } from "@/components/einstellungen/custom-kategorien";
import { istPro } from "@/lib/pro/plan";
import { aktuellesHalbjahr, halbjahrLabel } from "@/lib/grades/halbjahr";
import type { FachRow } from "@/lib/grades/db";
import type { CustomKategorie, GewichtungConfig } from "@/lib/grades/types";
import type { Theme, AccentColor } from "@/lib/actions/theme";

export default async function EinstellungenPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const theme = (cookieStore.get("project-x-theme")?.value ?? "dark") as Theme;
  const accent = (cookieStore.get("project-x-accent")?.value ?? "blue") as AccentColor;

  const { data: authData } = await supabase.auth.getClaims();
  const email = typeof authData?.claims?.email === "string" ? authData.claims.email : "";

  const { data: profil, error: profilErr } = await supabase
    .from("nutzer_profil")
    .select("name, klasse, schule, aktuelles_halbjahr, default_gewichtung, briefing_aktiv, klausur_erinnerung_tage, bundesland, notensystem, custom_kategorien, plan_tier, plan_status, plan_intervall, plan_bis, lk_doppelt_gewichten")
    .single();
  if (profilErr) console.error("[einstellungen] profil fetch error:", profilErr);

  const halbjahr = profil?.aktuelles_halbjahr ?? aktuellesHalbjahr();

  const { data: fachRows, error: fachErr } = await supabase
    .from("schule_fach")
    .select("*")
    .order("name");
  if (fachErr) console.error("[einstellungen] schule_fach fetch error:", fachErr);

  const defaultGewichtung = (profil?.default_gewichtung as GewichtungConfig | null) ?? null;
  const lkDoppelt = (profil as Record<string, unknown> | null)?.lk_doppelt_gewichten !== false;
  const briefingAktiv = profil?.briefing_aktiv !== false;
  const klausurErinnerungTage = (profil?.klausur_erinnerung_tage as number[] | null) ?? [1, 3];
  const bundesland = (profil as Record<string, unknown> | null)?.bundesland as string | null ?? null;
  const notensystem = profil?.notensystem ?? "de_0_15";
  const customKategorien = (Array.isArray(profil?.custom_kategorien) ? profil.custom_kategorien : []) as CustomKategorie[];
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

      {/* ── PROFIL ────────────────────────────────────────── */}
      <section
        className="animate-fade-up rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Profil
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">
          Angemeldet als <span className="font-mono text-foreground">{email}</span>
        </p>
        <ProfilForm
          initialName={profil?.name ?? ""}
          initialKlasse={profil?.klasse ?? null}
          initialSchule={profil?.schule ?? ""}
        />
      </section>

      {/* ── ABO ───────────────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.03s" }}
      >
        <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Abo
        </div>
        <AboStatus
          pro={istPro(profil)}
          status={profil?.plan_status ?? null}
          intervall={profil?.plan_intervall ?? null}
          bis={profil?.plan_bis ?? null}
        />
      </section>

      {/* ── DARSTELLUNG ───────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.02s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Darstellung
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">Theme und Akzentfarbe der App.</p>
        <ThemeToggle current={theme} />
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-text-dim">Akzentfarbe</p>
          <AccentPicker current={accent} />
        </div>
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
        <div className="mt-5 border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold">Bundesland</p>
          </div>
          <p className="mb-3 text-xs text-text-mute">
            Wird für den Ferien-Countdown genutzt.
          </p>
          <BundeslandSelector initialValue={bundesland} />
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold">Notensystem</p>
          </div>
          <p className="mb-3 text-xs text-text-mute">
            DE (0–15), DE (1–6), Schweiz (1–6), Österreich (1–5) oder IB (1–7).
          </p>
          <NotensystemWahl initialValue={notensystem} />
        </div>
        <div className="mt-5 border-t border-border pt-5">
          <LkGewichtungToggle initial={lkDoppelt} />
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

      {/* ── BEWERTUNGSARTEN ───────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.22s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Eigene Bewertungsarten
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">
          Neben Klausur, Mündlich & Co. — eigene Typen die überall auftauchen.
        </p>
        <CustomKategorienVerwaltung initial={customKategorien} />
      </section>

      {/* ── FÄCHER ────────────────────────────────────────── */}
      <section
        id="faecher"
        className="animate-fade-up mt-4 scroll-mt-6 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.25s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Fächer · {halbjahrLabel(halbjahr)}
        </div>
        <p className="mt-1 mb-4 text-sm text-text-dim">
          Hinzufügen, umbenennen, GK/LK wechseln oder löschen.
        </p>
        <FaecherVerwaltung faecher={faecher} halbjahr={halbjahr} lkDoppelt={lkDoppelt} />
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

      {/* ── RECHTLICHES ───────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-5"
        style={{ background: "var(--card-grad)", animationDelay: "0.36s" }}
      >
        <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Rechtliches
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-sm text-text-dim">
          <Link href="/datenschutz" className="transition-colors hover:text-brand">Datenschutzerklärung</Link>
          <Link href="/impressum" className="transition-colors hover:text-brand">Impressum</Link>
          <Link href="/agb" className="transition-colors hover:text-brand">AGB</Link>
        </div>
      </section>

      {/* ── ACCOUNT ───────────────────────────────────────── */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.4s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Account
        </div>
        <p className="mt-2 mb-4 text-sm text-text-dim">
          Angemeldet als <span className="font-mono text-foreground">{email}</span>
        </p>
        <form action={signOut}>
          <Button type="submit" variant="outline" className="border-border bg-surface-2 hover:bg-surface-3">
            Abmelden
          </Button>
        </form>

        <div className="mt-6 border-t border-border/40 pt-6">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-destructive/70">
            Gefahrenzone
          </div>
          <p className="mt-2 text-sm text-text-dim">
            Löscht dein Konto und alle deine Daten unwiderruflich.
          </p>
          <DeleteAccountButton deleteAction={deleteAccount} />
        </div>
      </section>
    </main>
  );
}
