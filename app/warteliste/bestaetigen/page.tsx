// app/warteliste/bestaetigen/page.tsx
import Link from "next/link";
import { wartelisteBestaetigen } from "@/lib/actions/warteliste";
import { WartelisteForm } from "@/components/warteliste-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Warteliste bestätigen" };

export default async function WartelisteBestaetigenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await wartelisteBestaetigen(token) : false;

  return (
    <main className="relative z-[5] mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-5 py-16 text-center">
      {ok ? (
        <>
          <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
            Geschlossene Beta
          </div>
          <h1 className="font-display text-3xl font-extrabold leading-tight">
            Du bist auf der Liste ✓
          </h1>
          <p className="mt-3 max-w-xs text-sm text-text-dim">
            Wir schicken dir deinen Invite-Code, sobald ein Platz frei ist.
            Bis dahin kannst du den Notenrechner in der Demo ausprobieren.
          </p>
          <Button
            render={<Link href="/demo/notenrechner" />}
            className="mt-6 font-display font-extrabold"
          >
            Demo ansehen →
          </Button>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl font-extrabold leading-tight">
            Dieser Link ist ungültig.
          </h1>
          <p className="mt-3 max-w-xs text-sm text-text-dim">
            Vielleicht wurde er unvollständig kopiert. Trag dich einfach
            nochmal ein:
          </p>
          <div className="mt-6 w-full text-left">
            <WartelisteForm />
          </div>
        </>
      )}
    </main>
  );
}
