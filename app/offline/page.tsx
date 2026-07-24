"use client";

export default function OfflinePage() {
  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: "#0a0a0b" }}
    >
      {/* Hintergrund-Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,255,255,0.03), transparent 70%)",
        }}
      />

      {/* Wordmark oben */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 font-display text-xs font-black uppercase"
        style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.35em" }}
      >
        NOTENA
      </div>

      {/* Signal-Animation */}
      <div className="mb-10 flex items-end gap-[5px]" style={{ height: 36 }}>
        {[12, 20, 28, 36].map((h, i) => (
          <div
            key={i}
            className="w-[7px] rounded-sm"
            style={{
              height: h,
              background: i < 2 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.12)",
              animation: i < 2 ? `signal-pulse 1.6s ease-in-out ${i * 0.2}s infinite` : "none",
            }}
          />
        ))}
      </div>

      {/* Headline */}
      <h1
        className="text-center font-display font-black leading-none tracking-tight"
        style={{
          fontSize: "clamp(3rem, 12vw, 6rem)",
          color: "#ffffff",
        }}
      >
        Kein Netz.
      </h1>

      <p
        className="mt-5 text-center font-mono text-sm"
        style={{ color: "rgba(255,255,255,0.3)", maxWidth: 240, lineHeight: 1.7 }}
      >
        Deine Noten sind sicher.
        <br />
        Verbinde dich wieder.
      </p>

      {/* Button */}
      <button
        onClick={() => window.location.reload()}
        className="mt-12 rounded-full font-display text-sm font-bold tracking-wide transition-all hover:bg-white/90 active:scale-95"
        style={{
          background: "rgba(255,255,255,1)",
          color: "#0a0a0b",
          padding: "14px 40px",
        }}
      >
        Erneut versuchen
      </button>

      {/* CSS-Animation für Signal-Bars */}
      <style>{`
        @keyframes signal-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </main>
  );
}
