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
import { HalbjahrPicker } from "@/components/halbjahr-picker";

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

export function AppNav({
  initiale,
  halbjahre,
  aktuellesHj,
}: {
  initiale: string;
  halbjahre: string[];
  aktuellesHj: string;
}) {
  const pathname = usePathname();
  const zeigeHjPicker = halbjahre.length >= 2;

  return (
    <>
      {/* Top-Header: ruhig, Material statt Glow */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface-1/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-3 sm:px-8">
          {/* Logo mit dezentem Live-Dot (statisch, kein Dauer-Puls) */}
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <span className="inline-flex size-2 rounded-full bg-success" />
            <span className="font-display text-lg font-extrabold tracking-[-0.02em] text-foreground">
              Notena
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
                  className={`group relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-sans text-sm font-medium transition-[background-color,color] duration-200 ${
                    aktiv
                      ? "bg-secondary text-foreground shadow-sm"
                      : "text-text-dim hover:bg-secondary/50 hover:text-foreground"
                  }`}
                >
                  <Icon className={`size-4 transition-transform group-hover:scale-110 ${aktiv ? "text-brand" : ""}`} />
                  {t.label}
                </Link>
              );
            })}
          </nav>

          {/* Halbjahr-Picker (Desktop, inline) + Einstellungen-Avatar */}
          <div className="flex items-center gap-3">
            <HalbjahrPicker
              halbjahre={halbjahre}
              aktuell={aktuellesHj}
              className="hidden lg:inline-flex"
            />
            <Link
              href="/einstellungen"
              title="Einstellungen & Profil"
              className={`relative flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold text-white transition-transform hover:scale-110 ${
                istAktiv(pathname, "/einstellungen")
                  ? "ring-2 ring-brand ring-offset-2 ring-offset-background"
                  : ""
              }`}
              style={{
                background:
                  "linear-gradient(135deg, var(--brand) 0%, var(--indigo) 100%)",
              }}
            >
              {initiale}
            </Link>
          </div>
        </div>

        {/* Halbjahr-Picker (Handy/iPad, eigene Zeile — im Header ist neben dem Logo kein Platz) */}
        {zeigeHjPicker && (
          <div className="px-5 pb-2.5 lg:hidden">
            <HalbjahrPicker
              halbjahre={halbjahre}
              aktuell={aktuellesHj}
              className="max-w-full"
            />
          </div>
        )}
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
