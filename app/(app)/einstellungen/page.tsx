import { createClient } from "@/lib/supabase/server";
import { updatePraeferenzen } from "@/lib/actions/schule";
import { PushToggle } from "@/components/push-toggle";
import { FaecherVerwaltung } from "@/components/einstellungen/faecher-verwaltung";
import type { FachRow } from "@/lib/grades/db";

// Auth-Check macht app/(app)/layout.tsx zentral.
export default async function EinstellungenPage() {
  const supabase = await createClient();

  const [{ data: profil }, { data: fachRows }] = await Promise.all([
    supabase.from("nutzer_profil").select("eingabe_modus, notensystem").single(),
    supabase.from("schule_fach").select("*").order("name"),
  ]);

  const eingabeModus = profil?.eingabe_modus ?? "punkte";
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

      {/* Eingabe-Modus */}
      <section
        className="animate-fade-up rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.05s" }}
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
        <p className="mt-3 font-mono text-[11px] text-text-mute">
          Aktuell:{" "}
          <strong>{eingabeModus === "punkte" ? "Punkte (0–15)" : "Noten"}</strong>
        </p>
      </section>

      {/* Notensystem */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Notensystem
        </div>
        <p className="mt-1 text-sm text-text-dim">
          Deutschland — Oberstufe (0–15 Punkte)
        </p>
        <p className="mt-2 font-mono text-[11px] text-text-mute">
          Weitere Systeme (Schweiz, Österreich, IB) folgen in einer späteren Version.
        </p>
      </section>

      {/* Push-Benachrichtigungen */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.15s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Benachrichtigungen
        </div>
        <p className="mt-1 text-sm text-text-dim">
          Push-Alerts für Klausuren und Hausaufgaben — direkt aufs Handy.
        </p>
        <div className="mt-4">
          <PushToggle />
        </div>
        <p className="mt-3 font-mono text-[11px] text-text-mute">
          Funktioniert als PWA (Homescreen-App) und im Browser. Benötigt einmalige Browser-Erlaubnis.
        </p>
      </section>

      {/* Fächer */}
      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.2s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Fächer
        </div>
        <p className="mt-1 text-sm text-text-dim">
          Fächer umbenennen oder löschen. Beim Löschen werden alle Noten des Fachs mitgelöscht.
        </p>
        <div className="mt-4">
          <FaecherVerwaltung faecher={faecher} />
        </div>
      </section>
    </main>
  );
}
