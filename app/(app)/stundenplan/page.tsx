import { CalendarDays } from "lucide-react";

export default function StundenplanPage() {
  return (
    <main className="relative z-[5] mx-auto flex min-h-[60vh] w-full max-w-[600px] flex-col items-center justify-center px-5 py-10 text-center sm:px-8">
      <CalendarDays className="size-12 text-brand" />
      <h1 className="mt-4 font-display text-3xl font-extrabold">Stundenplan kommt bald.</h1>
      <p className="mt-2 max-w-sm text-sm text-text-dim">
        Hier wird bald dein Wochen-Stundenplan stehen — mit Fächern, Zeiten und Räumen.
        Wir bauen ihn als Nächstes.
      </p>
    </main>
  );
}
