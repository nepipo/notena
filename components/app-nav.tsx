"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  Sparkles,
  CalendarDays,
  Settings,
  type LucideIcon,
} from "lucide-react";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  { href: "/dashboard", label: "Übersicht", icon: LayoutDashboard },
  { href: "/noten", label: "Noten", icon: Calculator },
  { href: "/was-waere-wenn", label: "Was-wäre-wenn", icon: Sparkles },
  { href: "/stundenplan", label: "Stundenplan", icon: CalendarDays },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings },
];

function istAktiv(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppNav({ initiale }: { initiale: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Top-Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface-1/80 px-5 py-3 backdrop-blur sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-lg font-extrabold tracking-[-0.02em]">
            Project X
          </span>
        </Link>

        {/* Desktop-Tabs (mittig/rechts) */}
        <nav className="hidden items-center gap-1 lg:flex">
          {TABS.map((t) => {
            const aktiv = istAktiv(pathname, t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-sm font-medium transition-colors ${
                  aktiv
                    ? "bg-brand text-black"
                    : "text-text-dim hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>

        {/* Profil-Avatar */}
        <Link
          href="/profil"
          title="Profil"
          className={`flex size-9 items-center justify-center rounded-full font-display text-sm font-extrabold text-white transition-transform hover:scale-105 ${
            istAktiv(pathname, "/profil") ? "ring-2 ring-brand ring-offset-2 ring-offset-background" : ""
          }`}
          style={{
            background: "linear-gradient(to bottom right, var(--brand), var(--brand-2))",
          }}
        >
          {initiale}
        </Link>
      </header>

      {/* Bottom-Tab-Bar (nur Handy/iPad) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-surface-1/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {TABS.map((t) => {
          const aktiv = istAktiv(pathname, t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 font-mono text-[9px] transition-colors ${
                aktiv ? "text-brand" : "text-text-mute hover:text-text-dim"
              }`}
            >
              <Icon className="size-5" />
              <span className="leading-none">{t.label.split("-")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
