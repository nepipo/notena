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
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--brand) 8%, var(--surface-1)) 0%, var(--surface-1) 100%)",
        borderColor: "color-mix(in srgb, var(--brand) 20%, var(--border))",
        animationDelay: "0.02s",
      }}
    >
      {/* Hintergrund-Glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }}
      />

      <div className="relative z-[2]">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: "var(--brand)", boxShadow: "0 0 6px var(--brand)" }}
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
