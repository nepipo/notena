"use client";

import { useTransition } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { setTheme, type Theme } from "@/lib/actions/theme";

const OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: "dark",   label: "Dunkel",  icon: Moon },
  { value: "system", label: "System",  icon: Monitor },
  { value: "light",  label: "Hell",    icon: Sun },
];

export function ThemeToggle({ current }: { current: Theme }) {
  const [isPending, startTransition] = useTransition();

  function toggle(theme: Theme) {
    if (theme === current || isPending) return;
    // Sofort DOM updaten (kein Flash)
    if (theme === "dark") document.documentElement.classList.add("dark");
    else if (theme === "light") document.documentElement.classList.remove("dark");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
    startTransition(() => setTheme(theme));
  }

  return (
    <div className="flex gap-1 rounded-2xl border border-border bg-surface-3 p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => toggle(value)}
          disabled={isPending}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 font-mono text-xs font-semibold transition-all disabled:opacity-50 ${
            current === value
              ? "bg-surface-1 text-foreground shadow-sm"
              : "text-text-mute hover:text-text-dim"
          }`}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
