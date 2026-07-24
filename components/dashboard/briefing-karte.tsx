import { holeBriefingCached } from "@/lib/briefing/get";

function heuteDatum(): string {
  return new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  });
}

export async function BriefingKarte() {
  const text = await holeBriefingCached();

  if (text === null) return null;

  return (
    <section
      className="animate-fade-up relative overflow-hidden rounded-3xl border border-border p-6 sm:p-8"
      style={{
        background: "var(--hero-grad)",
        animationDelay: "0.02s",
      }}
    >
      <div className="relative z-[2]">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: "var(--brand)" }}
          />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
            Dein Briefing
          </span>
          <span className="ml-auto font-mono text-[10px] text-text-mute">{heuteDatum()}</span>
        </div>

        <p className="font-display text-base font-medium leading-relaxed text-foreground sm:text-lg">
          {text}
        </p>
      </div>
    </section>
  );
}
