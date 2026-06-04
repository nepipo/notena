import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { ProfilForm } from "@/components/profil-form";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("name, klasse, schule")
    .single();

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[600px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          Profil
        </div>
        <h1 className="text-4xl font-extrabold leading-none">Dein Profil.</h1>
      </header>

      <ProfilForm
        initialName={profil?.name ?? ""}
        initialKlasse={profil?.klasse ?? null}
        initialSchule={profil?.schule ?? ""}
      />

      <section
        className="animate-fade-up mt-4 rounded-3xl border border-border p-6"
        style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-text-dim">
          Account
        </div>
        <p className="mt-2 text-sm text-text-dim">
          Angemeldet als <span className="font-mono text-foreground">{email}</span>
        </p>
        <form action={signOut} className="mt-4">
          <Button variant="outline" className="border-border bg-surface-2 hover:bg-surface-3">
            Abmelden
          </Button>
        </form>
        <p className="mt-4 font-mono text-[11px] text-text-mute">
          Account löschen? Schreib uns — kommt bald als Self-Service.
        </p>
      </section>
    </main>
  );
}
