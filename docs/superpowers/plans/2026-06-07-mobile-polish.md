# Mobile-First Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die App auf dem Handy nativ anfühlen lassen: iOS-Zoom-Bug fixen, Stundenplan-Lesbarkeit verbessern, PWA-Install-Banner einbauen und eine saubere Offline-Fallback-Seite liefern.

**Architecture:** Vier unabhängige Bausteine: (1) CSS/Component Bug-Fixes, (2) Client-Komponente `PwaInstallBanner` im App-Layout, (3) statische `/offline`-Seite (kein Auth-Check), (4) Service Worker erweitert um Cache-Strategie + Offline-Fallback. Kein neues npm-Paket nötig.

**Tech Stack:** Next.js App Router · Tailwind CSS v4 · Lucide React · Web Service Worker API (vanilla JS in public/sw.js)

---

## File Map

| Status | Datei | Änderung |
|--------|-------|----------|
| Ändern | `app/globals.css` | iOS-Zoom-Prevention global |
| Ändern | `components/stundenplan/stundenplan-board.tsx` | `text-[8px]` → `text-[10px]` (2 Stellen) |
| Ändern | `components/einstellungen/faecher-verwaltung.tsx` | `py-1` → `py-2` auf GK/LK-Button |
| Neu | `components/pwa-install-banner.tsx` | Install-Banner (Chrome + iOS) |
| Ändern | `app/(app)/layout.tsx` | `PwaInstallBanner` einbinden |
| Neu | `app/offline/page.tsx` | Offline-Fallback-Seite |
| Ändern | `lib/supabase/proxy.ts` | `/offline` als öffentliche Route |
| Ändern | `public/sw.js` | install/activate/fetch + bestehender Push-Code |

---

## Task 1: iOS-Zoom-Fix + Touch-Targets + Stundenplan

**Files:**
- Modify: `app/globals.css` (nach dem `button, a { touch-action: manipulation; }` Block, Zeile ~215)
- Modify: `components/stundenplan/stundenplan-board.tsx` (Zeilen 414, 424)
- Modify: `components/einstellungen/faecher-verwaltung.tsx` (Zeile 190)

**Hintergrund:** iOS Safari zoomt automatisch wenn ein fokussierter Input `font-size < 16px` hat. Fix in globals.css verhindert das global ohne visuelle Änderungen. Stundenplan hat `text-[8px]` (unleserlich auf kleinen Screens). GK/LK-Button hat `py-1` (ca. 28px Gesamthöhe — unter 44px Apple-Guideline).

- [ ] **Step 1: iOS-Zoom-Prevention in globals.css einfügen**

In `app/globals.css`, direkt nach der Zeile `touch-action: manipulation;` im `button, a`-Block, einfügen:

```css
  /* Verhindert iOS Safari Auto-Zoom bei Input-Focus (font-size muss ≥ 16px sein) */
  input, select, textarea {
    font-size: max(1rem, 16px);
  }
```

Der vollständige Block sieht danach so aus:

```css
  button, a {
    touch-action: manipulation;
  }
  /* Verhindert iOS Safari Auto-Zoom bei Input-Focus (font-size muss ≥ 16px sein) */
  input, select, textarea {
    font-size: max(1rem, 16px);
  }
```

- [ ] **Step 2: Stundenplan-Schrift erhöhen**

In `components/stundenplan/stundenplan-board.tsx`, beide Stellen mit `text-[8px]` auf `text-[10px]` ändern.

Stelle 1 (Klausur-Badge, ca. Zeile 414):
```tsx
className="truncate rounded px-1 py-0.5 font-mono text-[10px] font-bold max-w-[60px]"
style={{ background: "rgba(255,48,80,.18)", color: "#ff3050" }}
```

Stelle 2 (Hausaufgaben-Badge, ca. Zeile 424):
```tsx
className="truncate rounded px-1 py-0.5 font-mono text-[10px] font-bold max-w-[60px]"
style={{ background: "rgba(251,191,36,.18)", color: "#f59e0b" }}
```

- [ ] **Step 3: GK/LK-Button Touch-Target vergrößern**

In `components/einstellungen/faecher-verwaltung.tsx`, Zeile 190: `py-1` → `py-2`:

```tsx
className={`rounded-lg px-2.5 py-2 font-mono text-[11px] font-bold transition-colors disabled:opacity-50 ${
  f.niveau === "erhoeht"
    ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
    : "bg-surface-3 text-text-mute hover:bg-surface-3 hover:text-foreground"
}`}
```

- [ ] **Step 4: Build-Check**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Erwartetes Ergebnis: Keine Fehler.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/stundenplan/stundenplan-board.tsx components/einstellungen/faecher-verwaltung.tsx
git commit -m "fix: iOS-Zoom-Prevention, Stundenplan-Lesbarkeit, Touch-Target GK/LK"
```

---

## Task 2: PWA Install Banner

**Files:**
- Create: `components/pwa-install-banner.tsx`
- Modify: `app/(app)/layout.tsx`

**Logik:** Banner erscheint nach 3 Seiten-Navigationen (sessionStorage-Counter). Prüft ob bereits als PWA installiert (`display-mode: standalone` / `navigator.standalone`). Prüft ob schon dismissed (localStorage). Zwei Modi: Chrome/Android (`beforeinstallprompt`) und iOS Safari (manuelle Anleitung). Nur auf Mobile sichtbar (`lg:hidden`).

- [ ] **Step 1: `PwaInstallBanner` anlegen**

Neue Datei `components/pwa-install-banner.tsx`:

```tsx
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
    return () => window.removeEventListener("beforeinstallprompt", handler);
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
              Tippe <span className="font-bold text-brand">Teilen</span> → „Zum Home-Bildschirm"
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
```

- [ ] **Step 2: Banner in App-Layout einbinden**

In `app/(app)/layout.tsx` den Import hinzufügen und die Komponente rendern:

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";
import { FeedbackButton } from "@/components/feedback-button";
import { PwaInstallBanner } from "@/components/pwa-install-banner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  const { data: profil } = await supabase
    .from("nutzer_profil")
    .select("name, onboarding_abgeschlossen")
    .eq("id", claims.sub)
    .single();

  if (profil && profil.onboarding_abgeschlossen === false) {
    redirect("/onboarding");
  }

  const email = typeof claims.email === "string" ? claims.email : "";
  const initiale = (profil?.name?.trim()?.[0] ?? email[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-screen">
      <AppNav initiale={initiale} />
      <div className="pb-24 lg:pb-0">{children}</div>
      <FeedbackButton />
      <PwaInstallBanner />
    </div>
  );
}
```

- [ ] **Step 3: Build-Check**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Erwartetes Ergebnis: Keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add components/pwa-install-banner.tsx app/\(app\)/layout.tsx
git commit -m "feat: PWA Install Banner (Chrome + iOS)"
```

---

## Task 3: Offline-Seite + Middleware

**Files:**
- Create: `app/offline/page.tsx`
- Modify: `lib/supabase/proxy.ts`

**Wichtig:** `/offline` muss eine öffentliche Route sein (kein Auth-Check), damit der Service Worker sie bei der Installation cachen kann (der SW macht einen echten Fetch, der die Middleware trifft).

- [ ] **Step 1: `/offline` als öffentliche Route in proxy.ts eintragen**

In `lib/supabase/proxy.ts`, die `isPublic`-Konstante erweitern. Direkt nach der Cron-Zeile einfügen:

```ts
  const isPublic =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/auth") ||
    path.startsWith("/demo") ||
    path === "/manifest.webmanifest" ||
    path === "/icon" ||
    path === "/icon512" ||
    path === "/apple-icon" ||
    path.startsWith("/api/cron") ||
    path === "/offline";
```

- [ ] **Step 2: Offline-Seite anlegen**

Neue Datei `app/offline/page.tsx`:

```tsx
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
        Project X braucht kurz eine Verbindung. Deine Noten und Klausuren sind sicher gespeichert.
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
```

- [ ] **Step 3: Build-Check**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

Erwartetes Ergebnis: Keine Fehler. `/offline` taucht in der Route-Liste auf.

- [ ] **Step 4: Commit**

```bash
git add app/offline/page.tsx lib/supabase/proxy.ts
git commit -m "feat: Offline-Fallback-Seite + /offline als öffentliche Route"
```

---

## Task 4: Service Worker — Cache-Strategie + Offline-Fallback

**Files:**
- Modify: `public/sw.js`

**Strategie:**
- `install`: `/offline` precachen, `skipWaiting()` damit der neue SW sofort aktiv wird
- `activate`: alte Cache-Versionen löschen, `clients.claim()` für sofortigen Zugriff
- `fetch` (Navigation): Network-first — bei Netzwerkfehler `/offline` aus Cache
- `fetch` (`/_next/static/`): Cache-first — JS/CSS wird gecacht, schnell bei schlechter Verbindung
- `fetch` (alles andere): durchlassen, kein Eingriff (API-Calls immer live)

Der bestehende Push- und NotificationClick-Code bleibt unverändert erhalten.

- [ ] **Step 1: `public/sw.js` komplett ersetzen**

```js
const CACHE_NAME = "project-x-v1";
const OFFLINE_URL = "/offline";

// ── Install: /offline precachen ──────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

// ── Activate: alte Caches löschen ────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// ── Fetch: Cache-Strategie ────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nur same-origin requests behandeln
  if (url.origin !== self.location.origin) return;

  // /_next/static/: Cache-first (JS/CSS-Assets mit Hash-Namen)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((res) => {
            const clone = res.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone));
            return res;
          }),
      ),
    );
    return;
  }

  // Navigation (HTML-Seiten): Network-first, Fallback auf /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(OFFLINE_URL)
          .then((r) => r ?? Response.error()),
      ),
    );
    return;
  }
});

// ── Push Notifications (unverändert) ─────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Project X", body: event.data.text() };
  }
  const { title = "Project X", body = "", url = "/dashboard", icon = "/icon" } = payload;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/icon",
      data: { url },
      vibrate: [100, 50, 100],
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      }),
  );
});
```

- [ ] **Step 2: Final Build-Check**

```bash
npm run build 2>&1 | tail -20
```

Erwartetes Ergebnis: Build grün, keine TS-Fehler, `/offline` in der Routen-Liste.

- [ ] **Step 3: Commit**

```bash
git add public/sw.js
git commit -m "feat: Service Worker Cache-Strategie + Offline-Fallback"
```

---

## Self-Review Checklist

- [x] **Spec-Coverage:** iOS-Zoom ✓ · Stundenplan ✓ · Touch-Targets ✓ · Install-Banner (Chrome + iOS) ✓ · Offline-Seite ✓ · SW-Cache-Strategie ✓ · `/offline` öffentlich ✓
- [x] **Placeholder-Scan:** Kein TBD, alle Code-Blöcke vollständig
- [x] **Type-Consistency:** `BeforeInstallPromptEvent` lokal definiert · `InstallMode` lokal definiert · kein Import aus nicht-existierenden Dateien
- [x] **Middleware-Gap geschlossen:** `/offline` in `proxy.ts` isPublic — sonst würde SW-Install cachen und offline einen 302-Redirect bekommen
- [x] **SW-Upgrade:** `skipWaiting()` + `clients.claim()` sorgen dafür dass der neue SW sofort nach Deploy aktiv wird ohne Browser-Reload
- [x] **Push-Code erhalten:** Bestehender push/notificationclick Handler vollständig übernommen
