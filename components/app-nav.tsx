"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calculator,
  CalendarDays,
  ClipboardList,
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
  { href: "/stundenplan", label: "Stundenplan", icon: CalendarDays },
  { href: "/aufgaben", label: "Aufgaben", icon: ClipboardList },
];

function istAktiv(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppNav({ initiale }: { initiale: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Top-Header: lebendig durch Gradient-Glow + Live-Dot am Logo */}
      <header
        className="sticky top-0 z-40 border-b border-border bg-surface-1/70 backdrop-blur-xl"
        style={{
          backgroundImage:
            "radial-gradient(circle 600px at 20% -50%, color-mix(in srgb, var(--brand) 18%, transparent), transparent), radial-gradient(circle 500px at 80% -30%, color-mix(in srgb, var(--brand-2) 15%, transparent), transparent)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 sm:px-8">
          {/* Logo mit Live-Dot */}
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <span className="relative flex size-2 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <span
              className="font-display text-lg font-extrabold tracking-[-0.02em]"
              style={{
                background: "linear-gradient(135deg, var(--foreground) 0%, var(--brand) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Project X
            </span>
          </Link>

          {/* Desktop-Tabs */}
          <nav className="hidden items-center gap-1 lg:flex">
            {TABS.map((t) => {
              const aktiv = istAktiv(pathname, t.href);
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`group relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-sans text-sm font-medium transition-[transform,background-color,color,box-shadow] duration-200 ${
                    aktiv
                      ? "text-black"
                      : "text-text-dim hover:scale-[1.04] hover:text-foreground"
                  }`}
                  style={
                    aktiv
                      ? {
                          background:
                            "linear-gradient(135deg, var(--brand), var(--brand-2))",
                          boxShadow:
                            "0 6px 20px color-mix(in srgb, var(--brand) 45%, transparent), 0 0 0 1px color-mix(in srgb, var(--brand) 60%, transparent) inset",
                        }
                      : undefined
                  }
                >
                  <Icon className="size-4 transition-transform group-hover:scale-110" />
                  {t.label}
                </Link>
              );
            })}
          </nav>

          {/* Einstellungen-Avatar */}
          <Link
            href="/einstellungen"
            title="Einstellungen & Profil"
            className={`relative flex size-9 items-center justify-center rounded-full font-display text-sm font-extrabold text-white transition-transform hover:scale-110 ${
              istAktiv(pathname, "/einstellungen")
                ? "ring-2 ring-brand ring-offset-2 ring-offset-background"
                : ""
            }`}
            style={{
              background:
                "linear-gradient(135deg, var(--brand) 0%, var(--indigo) 100%)",
              boxShadow:
                "0 4px 14px color-mix(in srgb, var(--brand) 40%, transparent)",
            }}
          >
            {initiale}
          </Link>
        </div>
      </header>

      {/* Bottom-Tab-Bar (Handy/iPad) */}
      {(() => {
        const activeIndex = TABS.findIndex((t) => istAktiv(pathname, t.href));
        const tabPct = 100 / TABS.length;
        const indicatorCenter = activeIndex >= 0
          ? (activeIndex + 0.5) * tabPct
          : -100;

        return (
          <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-surface-1/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
            {/* Gleitender Indikator — ein einziges Element das sich zwischen Tabs bewegt */}
            <span
              className="pointer-events-none absolute -top-px h-0.5 w-8 rounded-full bg-brand transition-transform duration-300"
              style={{
                left: 0,
                transform: `translateX(calc(${indicatorCenter}vw - 16px))`,
                transitionTimingFunction: "var(--ease-spring)",
                boxShadow: "0 0 12px var(--brand), 0 0 4px var(--brand)",
              }}
            />
            {TABS.map((t) => {
              const aktiv = istAktiv(pathname, t.href);
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 font-mono text-[9px] transition-colors duration-200 ${
                    aktiv ? "text-brand" : "text-text-mute hover:text-text-dim"
                  }`}
                >
                  <Icon
                    className={`size-5 transition-transform duration-300 ${aktiv ? "scale-110" : ""}`}
                    style={{ transitionTimingFunction: "var(--ease-spring)" }}
                  />
                  <span className="leading-none">{t.label.split("-")[0]}</span>
                </Link>
              );
            })}
          </nav>
        );
      })()}
    </>
  );
}
