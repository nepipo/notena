"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { PRO_FEATURES } from "@/lib/pro/features";
import { cn } from "@/lib/utils";

/**
 * Paywall-Popup, das beim Öffnen eines gesperrten Pro-Bereichs automatisch aufploppt.
 * Schließbar per X, Escape oder Backdrop-Klick → dahinter bleibt der gesperrte Bereich sichtbar.
 * Der eigentliche Checkout liegt auf /pro (Button „Pro freischalten").
 *
 * Wird per Portal an document.body gehängt: Elternelemente mit `transform`
 * (z.B. .animate-fade-up) würden sonst den Bezugsrahmen für `position: fixed`
 * kapern und das Overlay in eine winzige Box klemmen.
 */
export function PaywallOverlay({ feature }: { feature: string }) {
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Hintergrund-Scroll sperren, solange das Popup offen ist
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${feature} – Notena Pro`}
      className="dark fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop — Klick schließt */}
      <button
        type="button"
        aria-label="Schließen"
        onClick={() => setOpen(false)}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="pro-glass animate-fade-up relative z-10 w-full max-w-md p-7 text-white">
        {/* Farb-Glow oben */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-80 -translate-x-1/2 rounded-full opacity-60 blur-[90px]"
          style={{
            background:
              "radial-gradient(ellipse, color-mix(in srgb, var(--brand) 45%, transparent) 0%, transparent 70%)",
          }}
        />

        {/* Schließen */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Schließen"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-white/80 backdrop-blur-md">
            Notena Pro
          </span>
          <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
            {feature} ist Pro.
          </h2>
          <p className="mt-1.5 text-sm text-white/55">
            7 Tage gratis testen, jederzeit kündbar.
          </p>

          <ul className="mt-5 space-y-2.5 text-sm">
            {PRO_FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                    f.bald ? "bg-white/10 text-white/40" : "bg-white/15 text-white/90",
                  )}
                >
                  ✓
                </span>
                <span className={cn(f.bald ? "text-white/45" : "text-white/75")}>
                  {f.label}
                  {f.bald && (
                    <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
                      bald
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <Link
            href="/pro"
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Pro freischalten →
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 w-full py-2 text-center text-xs text-white/45 transition-colors hover:text-white/70"
          >
            Später
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
