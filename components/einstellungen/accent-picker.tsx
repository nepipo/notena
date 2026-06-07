"use client";

import { useTransition } from "react";
import { setAccent, type AccentColor } from "@/lib/actions/theme";

const AKZENTE: { value: AccentColor; label: string; brand: string; brand2: string }[] = [
  { value: "blue",   label: "Blau",    brand: "#1da1ff", brand2: "#5b8bff" },
  { value: "violet", label: "Violett", brand: "#8b5cf6", brand2: "#a78bfa" },
  { value: "indigo", label: "Indigo",  brand: "#6366f1", brand2: "#818cf8" },
  { value: "pink",   label: "Pink",    brand: "#ec4899", brand2: "#f472b6" },
  { value: "red",    label: "Rot",     brand: "#ef4444", brand2: "#f87171" },
  { value: "orange", label: "Orange",  brand: "#f97316", brand2: "#fb923c" },
  { value: "green",  label: "Grün",    brand: "#22c55e", brand2: "#4ade80" },
  { value: "teal",   label: "Teal",    brand: "#14b8a6", brand2: "#2dd4bf" },
];

export function AccentPicker({ current }: { current: AccentColor }) {
  const [isPending, startTransition] = useTransition();

  function pick(accent: AccentColor) {
    if (accent === current || isPending) return;
    // Sofort DOM updaten — kein Flash
    document.documentElement.setAttribute("data-accent", accent);
    startTransition(() => setAccent(accent));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {AKZENTE.map(({ value, label, brand, brand2 }) => {
        const aktiv = current === value;
        return (
          <button
            key={value}
            onClick={() => pick(value)}
            disabled={isPending}
            title={label}
            className="group flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-xs font-semibold transition-all disabled:opacity-50"
            style={{
              borderColor: aktiv ? brand : "var(--border)",
              background: aktiv
                ? `linear-gradient(135deg, ${brand}22, ${brand2}11)`
                : "var(--surface-2)",
              color: aktiv ? brand : "var(--text-dim)",
              boxShadow: aktiv ? `0 0 0 1px ${brand}55` : "none",
            }}
          >
            <span
              className="size-3 rounded-full flex-shrink-0 transition-transform group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${brand}, ${brand2})`,
                boxShadow: aktiv ? `0 0 6px ${brand}88` : "none",
              }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
