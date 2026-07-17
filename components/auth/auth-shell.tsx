import Link from "next/link";
import { Calculator, CalendarDays, Brain, Zap } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Calculator,
    label: "Notenrechner",
    desc: "0–15 Punkte, alle Fächer, beide Halbjahre — Schnitt live.",
  },
  {
    icon: CalendarDays,
    label: "Klausur-Countdown",
    desc: "Die nächste Klausur immer im Blick, nie wieder überrascht.",
  },
  {
    icon: Zap,
    label: "Was-wäre-wenn",
    desc: "Ziel-Schnitt eingeben — der Rechner zeigt, was dir fehlt.",
  },
  {
    icon: Brain,
    label: "KI-Briefing",
    desc: "Jeden Morgen ein kurzes Briefing: was ansteht, wo du stehst.",
  },
];

function MarketingPanel() {
  return (
    <div className="hidden w-full max-w-[420px] flex-col lg:flex">
      <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
        <span className="inline-block size-1.5 animate-pulse rounded-full bg-success" />
        Notena · Dein Cockpit
      </div>

      <h2 className="font-display text-3xl font-extrabold leading-tight tracking-[-0.03em]">
        Alles was zählt,
        <br />
        an einem Ort.
      </h2>
      <p className="mt-3 max-w-sm text-sm text-text-dim">
        Kein Excel, kein Raten. Trag deine Noten ein und sieh sofort, wo du
        stehst — bis zum Abi.
      </p>

      <ul className="mt-8 flex flex-col gap-5">
        {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
          <li key={label} className="flex items-start gap-3.5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-brand">
              <Icon className="size-4.5" />
            </span>
            <div>
              <p className="font-display text-sm font-bold">{label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-text-dim">
                {desc}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-text-mute">
        Kostenlos in der Beta
      </p>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative z-[5] flex min-h-screen flex-col items-center justify-center px-5 py-10">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 size-[500px] rounded-full opacity-[0.10] blur-[80px]"
          style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-[-100px] size-[300px] rounded-full opacity-[0.06] blur-[80px]"
          style={{ background: "radial-gradient(circle, var(--indigo) 0%, transparent 70%)" }}
        />
      </div>

      <div className="flex w-full max-w-[400px] items-center justify-center gap-16 lg:max-w-[940px] lg:justify-between">
        {/* Formular-Spalte */}
        <div className="animate-fade-up w-full max-w-[400px] shrink-0">
          {/* Logo / Eyebrow */}
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-brand lg:justify-start"
          >
            <span className="inline-block size-1.5 rounded-full bg-brand" />
            Notena
          </Link>

          <div
            className="rounded-3xl border border-border p-7 sm:p-8"
            style={{ background: "var(--card-grad)" }}
          >
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
              {title}
            </h1>
            <p className="mt-2 text-sm text-text-dim">{subtitle}</p>

            <div className="mt-6">{children}</div>
          </div>

          {footer && (
            <div className="mt-6 text-center text-sm text-text-dim lg:text-left">
              {footer}
            </div>
          )}

          <div className="mt-8 flex items-center justify-center gap-5 font-mono text-[11px] text-text-mute lg:justify-start">
            <Link href="/impressum" className="hover:text-text-dim transition-colors">
              Impressum
            </Link>
            <span className="text-border">·</span>
            <Link href="/datenschutz" className="hover:text-text-dim transition-colors">
              Datenschutz
            </Link>
          </div>
        </div>

        {/* Marketing-Spalte (nur Desktop) */}
        <MarketingPanel />
      </div>
    </main>
  );
}
