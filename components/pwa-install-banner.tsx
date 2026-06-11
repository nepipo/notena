"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallMode = "chrome" | "ios" | null;

const DISMISSED_KEY = "pwa-banner-dismissed";
const NAV_COUNT_KEY = "pwa-nav-count";
const SHOW_AFTER = 3;

export function PwaInstallBanner() {
  const pathname = usePathname();
  const [mode, setMode] = useState<InstallMode>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  // Navigationen zählen
  useEffect(() => {
    const prev = parseInt(sessionStorage.getItem(NAV_COUNT_KEY) ?? "0", 10);
    sessionStorage.setItem(NAV_COUNT_KEY, String(prev + 1));
  }, [pathname]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    Promise.resolve().then(() => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (isStandalone) return;

      if (localStorage.getItem(DISMISSED_KEY)) return;

      const navCount = parseInt(sessionStorage.getItem(NAV_COUNT_KEY) ?? "0", 10);
      if (navCount < SHOW_AFTER) return;

      const isIos =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
      if (isIos) {
        setMode("ios");
        setVisible(true);
        return;
      }

      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setMode("chrome");
        setVisible(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      cleanup = () => window.removeEventListener("beforeinstallprompt", handler);
    });

    return () => cleanup?.();
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible || !mode) return null;

  return (
    <div
      className="fixed inset-x-4 z-50 animate-fade-up rounded-2xl border p-4 shadow-2xl lg:hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 5rem)",
        background: "color-mix(in srgb, var(--surface-1) 92%, transparent)",
        backdropFilter: "blur(20px)",
        borderColor: "color-mix(in srgb, var(--brand) 30%, var(--border))",
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Schließen"
        className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full text-text-mute transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "color-mix(in srgb, var(--brand) 15%, transparent)" }}
        >
          <Smartphone className="size-5 text-brand" />
        </div>
        <div>
          <p className="font-display text-sm font-bold">Als App installieren</p>
          {mode === "ios" ? (
            <p className="mt-0.5 font-mono text-[11px] text-text-dim">
              Tippe <span className="font-bold text-brand">Teilen</span> → „Zum Home-Bildschirm&quot;
            </p>
          ) : (
            <p className="mt-0.5 font-mono text-[11px] text-text-dim">
              Schneller Zugriff direkt vom Homescreen.
            </p>
          )}
          {mode === "chrome" && (
            <button
              onClick={install}
              className="mt-2 rounded-lg px-3 py-1.5 font-display text-xs font-bold text-black transition-opacity hover:opacity-90"
              style={{ background: "var(--brand)" }}
            >
              Installieren
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
