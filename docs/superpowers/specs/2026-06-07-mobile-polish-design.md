# Mobile-First Polish — Design Spec

**Stand:** 07.06.2026
**Status:** Approved

## Ziel

Die App fühlt sich auf dem Handy nativ an: keine iOS-Zoom-Bugs, lesbare Stundenplan-Schrift, ein dezenter Install-Banner und eine saubere Offline-Seite wenn kein Internet vorhanden.

---

## Teil 1: Bug-Fixes

### iOS Input Zoom
iOS Safari zoomt automatisch wenn ein fokussierter Input font-size < 16px hat. Betroffen:
- `components/einstellungen/faecher-verwaltung.tsx` Zeile 251: `text-xs` → `text-[16px]`

Fix: alle `<input>` und `<textarea>` Elemente auf mindestens `text-[16px]` setzen.

### Stundenplan Lesbarkeit
- `components/stundenplan/stundenplan-board.tsx` Zeilen 414+424: `text-[8px]` → `text-[10px]`

### Touch-Targets
- Kleine `py-1`-Buttons in `components/einstellungen/faecher-verwaltung.tsx` auf `py-1.5` erhöhen.

---

## Teil 2: PWA-Install-Banner

### Datei
`components/pwa-install-banner.tsx` — Client-Komponente, eingebunden in `app/(app)/layout.tsx`

### Logik
1. Prüfe ob bereits als PWA installiert: `window.matchMedia('(display-mode: standalone)').matches` oder `window.navigator.standalone === true` (iOS) → Banner nie zeigen
2. Prüfe ob User schon weggeklickt hat: `localStorage.getItem('pwa-banner-dismissed')` → Banner nie zeigen
3. Zähle Navigationen mit einem `sessionStorage`-Counter. Erst ab Navigation #3 anzeigen.
4. Browser-Typ bestimmen:
   - Hat `beforeinstallprompt` Event → Chrome/Android-Modus
   - iOS Safari (`/iPad|iPhone|iPod/.test(navigator.userAgent)`) → iOS-Modus
   - Sonst: kein Banner

### UI
- Positioniert: `fixed bottom-[calc(env(safe-area-inset-bottom)+4rem)] inset-x-4 z-50` (über Bottom-Nav)
- Karte: dark glassmorphism, Azurblau-Akzent, ✕-Button oben rechts
- Chrome/Android: Button "Installieren" → triggert `deferredPrompt.prompt()`
- iOS: Icon + Text "Tippe → 'Zum Home-Bildschirm'"
- Nach Dismiss: `localStorage.setItem('pwa-banner-dismissed', '1')`, Banner verschwindet mit Fade

### Kein Banner bei
- Bereits installiert
- Schon dismissed
- Desktop (kein Touch-Device / `lg:`-Breakpoint)
- Unsupported Browser (kein beforeinstallprompt + kein iOS)

---

## Teil 3: Offline-Fallback

### Neue Route: `app/offline/page.tsx`
Statische Seite (kein Auth-Check, kein Layout mit Nav), Pre-rendered.
Inhalt: Icon + "Kein Internet" + kurze Erklärung + "Erneut versuchen"-Button (ruft `window.location.reload()` auf).

### Service Worker Update: `public/sw.js`

**Cache-Name:** `project-x-v1`

**Bei Install (sw `install` Event):**
- Cache `/offline` vorab (precache)

**Bei Fetch (sw `fetch` Event):**
- Navigation-Requests (HTML): Network-first → bei Fehler `/offline` aus Cache
- `/_next/static/` Assets: Cache-first → bei Cache-Miss Network → dann Cache befüllen
- Alles andere: normales Network (API-Calls etc. immer live)

**Cache-Invalidierung:** Bei SW-Aktivierung (`activate` Event) alte Cache-Versionen löschen.

---

## Nicht in Scope

- Vollständiges App-Shell-Caching (zu komplex mit Next.js App Router Hashes)
- Background Sync
- Periodic Background Sync
- next-pwa (neues Package)

---

## Dateien

| Status | Datei | Änderung |
|--------|-------|----------|
| Ändern | `components/einstellungen/faecher-verwaltung.tsx` | iOS-Zoom-Fix, Touch-Targets |
| Ändern | `components/stundenplan/stundenplan-board.tsx` | text-[8px] → text-[10px] |
| Neu | `components/pwa-install-banner.tsx` | Install-Banner |
| Ändern | `app/(app)/layout.tsx` | PwaInstallBanner einbinden |
| Neu | `app/offline/page.tsx` | Offline-Fallback-Seite |
| Ändern | `public/sw.js` | Cache-Strategie + Offline-Fallback |
