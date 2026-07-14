"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div
        className="mb-6 flex size-20 items-center justify-center rounded-3xl"
        style={{ background: "color-mix(in srgb, var(--brand) 12%, transparent)" }}
      >
        <WifiOff className="size-10 text-brand" />
      </div>
      <h1 className="font-display text-3xl font-extrabold leading-tight">
        Kein Internet
      </h1>
      <p className="mt-3 max-w-xs font-mono text-sm text-text-dim">
        Notena braucht kurz eine Verbindung. Deine Noten und Klausuren sind sicher gespeichert.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 rounded-xl px-6 py-3 font-display font-bold text-black transition-opacity hover:opacity-80"
        style={{ background: "var(--brand)" }}
      >
        Erneut versuchen
      </button>
    </main>
  );
}
