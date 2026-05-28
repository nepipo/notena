import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  // Doppelte Absicherung (zusätzlich zum Proxy)
  if (!claims) {
    redirect("/login");
  }

  const email = typeof claims.email === "string" ? claims.email : "Account";

  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8 flex items-start justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            <span className="inline-block size-1.5 rounded-full bg-success" />
            Dashboard
          </div>
          <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">
            Eingeloggt. 🎉
          </h1>
          <p className="mt-2 text-sm text-text-dim">
            Angemeldet als{" "}
            <span className="font-mono text-foreground">{email}</span>
          </p>
        </div>
        <form action={signOut}>
          <Button variant="outline" className="border-border bg-surface-2 hover:bg-surface-3">
            Abmelden
          </Button>
        </form>
      </header>

      <section
        className="lift animate-fade-up rounded-3xl border border-border p-8"
        style={{ background: "var(--card-grad)", animationDelay: "0.1s" }}
      >
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-text-dim">
          Bald hier
        </div>
        <h2 className="mt-3 font-display text-2xl font-extrabold tracking-[-0.02em]">
          Dein Notenrechner
        </h2>
        <p className="mt-2 max-w-md text-sm text-text-dim">
          Der Multi-User-Auth-Flow steht. Als Nächstes kommt das Schul-Cockpit:
          Fächer, Klausuren und der Notenrechner mit 0–15-Punkte-System.
        </p>
      </section>
    </main>
  );
}
