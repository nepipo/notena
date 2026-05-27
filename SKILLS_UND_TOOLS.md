# Skills & MCPs & Tools für Project X

**Stand:** 28.05.2026. Aktualisiert nach Verfügbarkeits-Check.

Diese Datei ist das Nachschlagewerk während wir bauen. Strukturiert nach **Phase + Use Case**.

---

## PHASE 0–3 — Was wir SOFORT brauchen

### Claude-Code Skills (Auto-trigger oder manuell)

| Skill | Wann | Was es macht |
|---|---|---|
| **brainstorming** | VOR jedem neuen Feature | Klärt Anforderungen, Edge-Cases, Design VOR Code |
| **writing-plans** | Wenn Feature > 1 Datei | Schreibt Implementierungs-Plan in Markdown |
| **executing-plans** | Plan abarbeiten | Mit Review-Checkpoints, Schritt für Schritt |
| **test-driven-development** | VOR Feature-Code | Tests zuerst, dann Implementation |
| **systematic-debugging** | Bei JEDEM Bug | Erst Ursache, dann Fix. Verhindert Pflaster-Lösungen |
| **verification-before-completion** | VOR Commit | Build grün, Tests grün, manuell verifiziert |
| **frontend-design** | UI bauen | Production-Grade Components, keine AI-Slop-Optik |
| **ui-styling** | Bei Tailwind/shadcn-Arbeit | Accessibility built-in, sauberes shadcn-Pattern |
| **ui-ux-pro-max** | Neuer Bereich/Page | 50+ Styles, 161 Palettes, 57 Font-Pairings |
| **design-system** | Token/Component-Specs | Design-Tokens, konsistentes UI |
| **using-git-worktrees** | Feature-Branches | Isolation für parallele Arbeit |
| **verify** | Nach Code-Änderung | App starten + visuell überprüfen |
| **code-review** | Vor Merge | Aktuelle Diff auf Bugs reviewen |
| **claude-api** | KI-Features bauen | Prompt-Caching, Modell-Wahl, Best Practices |
| **fewer-permission-prompts** | Wenn nervt | Whitelist häufige Commands automatisch |

### MCP-Server (sofort aktiv)

| MCP | Wofür | Wann |
|---|---|---|
| **Supabase MCP** | DB-Migrations, Tabellen erstellen, TS-Types generieren, Logs lesen | Phase 0 → permanent |
| **Vercel MCP** | Deployments, Build-Logs, Env-Vars managen, Domain-Setup | Phase 0 → permanent |
| **Chrome MCP** | Browser-Automatisierung, E2E-Tests, Screenshots, Demo-Vorbereitung | Permanent |
| **context7** | Aktuelle Library-Docs (Next.js, Supabase, Tailwind, shadcn, Framer Motion) — **STATT WebSearch nutzen** für Library-Fragen | Permanent |
| **Canva MCP** | Logo-Drafts, Banner-Mockups, Social-Media-Assets, Brand-Templates | Wenn Marketing-Material gebraucht (Phase 11) |
| **Domains MCP** | Domain-Verfügbarkeit, Vorschläge | Wenn finaler Name kommt |
| **Computer Use** | macOS-Apps automatisieren (Mockups öffnen, Demos) | Selten |
| **Claude Preview MCP** | Preview-Deployments inspizieren, Console-Logs lesen | Permanent |
| **scheduled-tasks** | Cron-Jobs simulieren, recurring agents | Wenn Briefing kommt |
| **mcp-registry** | Neue MCPs discovern | Wenn was fehlt |

### NPM-Stack (Tag 1)

```bash
# Core
npx create-next-app@latest project-x --typescript --tailwind --app --no-src-dir

# Auth + DB
npm install @supabase/ssr @supabase/supabase-js

# UI
npx shadcn@latest init                    # → wähl Slate/Black + Coral/Indigo
npm install lucide-react clsx tailwind-merge

# Forms + Validation
npm install zod react-hook-form @hookform/resolvers

# Toasts / Drawer
npm install sonner vaul

# Animation
npm install motion                         # Neue Framer Motion API

# Charts
npm install recharts

# Datum
npm install date-fns

# Claude API
npm install @anthropic-ai/sdk
```

### Tools über CLI (nicht NPM)

| Tool | Wofür | Install |
|---|---|---|
| `gh` (GitHub CLI) | Repo erstellen, PRs, Issues | Schon installiert |
| `supabase` (CLI) | Lokale DB starten, Migrations, Type-Gen | `brew install supabase/tap/supabase` |
| `vercel` (CLI) | Deploy + Env-Vars + Logs | `npm i -g vercel` |
| `whois` | Domain-Check | Schon da |

---

## PHASE 4–6 — Schule Core MVP

### Zusätzliche Skills

| Skill | Wann |
|---|---|
| **design:design-critique** | Wenn Karten/Komponenten reviewt werden |
| **design:ux-copy** | Microcopy (Empty States, Error Messages) |

### Zusätzliche NPM-Packages

```bash
# State (falls Context nicht reicht)
npm install zustand

# Data-Fetching (falls API-Caching kompliziert wird)
npm install @tanstack/react-query
```

---

## PHASE 7–8 — Mobile-First + PWA

### Zusätzliche NPM

```bash
# PWA
npm install next-pwa
npm install web-push                       # Server-side Push

# Optional: für besseres Tab-Bar-Routing
npm install @radix-ui/react-tabs
```

### Externe Services

- **Apple Developer Account** (€99/Jahr) — ab Phase 8 wenn iOS-Push gewollt. Sonst Web Push reicht für Phase 8 Beta.
- **Vercel Pro** (~20€/Monat) — falls Vercel-Limit erreicht (Bandwidth, Function-Time, Crons)

---

## PHASE 9–10 — Briefing + KI-Coach

### Zusätzliche Skills

| Skill | Wann |
|---|---|
| **claude-api** (tief) | Prompt-Caching für Briefing nutzen — spart 70% Kosten |

### Externe Services

- **Anthropic API** — Pay-per-use, ~5-15€/Monat bei 50 active Users
- **Resend** — Transactional Mails (Welcome, Beta-Feedback, Password-Reset). Free Tier 100/Tag. (kein MCP, eigene Integration)
- **OpenAI API** (optional) — falls TTS für Audio-Briefing gewollt. ~0.30€/Monat pro User.

---

## PHASE 11–12 — Beta-Launch + Marketing

### Skills die hier zentral werden

| Skill | Wofür |
|---|---|
| **design:accessibility-review** | WCAG 2.1 AA Audit vor Launch |
| **design:user-research** | Beta-Interviews planen |
| **design:research-synthesis** | Interview-Ergebnisse auswerten |
| **design** | Logo, Brand-Identity, Visitenkarten, CIP |
| **brand** | Brand-Voice, Style-Guide |
| **banner-design** | Insta/TikTok-Banner |
| **marketing:campaign-plan** | Launch-Strategy für Beta |
| **marketing:content-creation** | Blog-Posts, TikTok-Skripte |
| **marketing:email-sequence** | Welcome-Mail-Drip für Beta-User |
| **marketing:competitive-brief** | Wettbewerber-Analyse (Notion, Studyverse, Brainscape) |
| **anthropic-skills:canvas-design** | Poster, Print-Material |
| **anthropic-skills:pptx** | Investor-Pitch (wenn relevant) |

### Externe Services / Manuelle Integrationen

| Service | Wofür | Wann |
|---|---|---|
| **Plausible** ODER **Vercel Analytics** | Datenschutz-konformes Analytics | Phase 11 |
| **PostHog** | Product-Analytics + Session-Replay (kostenlos bis 1M Events/Monat) | Phase 11 |
| **Sentry** | Error-Tracking + Performance | Phase 11 (kostenlos bis 5k Errors/Monat) |
| **Stripe** | Pricing/Subscriptions | Phase v1.5 nach Beta |
| **Apple App Store** | iOS-Launch | Wenn Phase 3 in Capacitor-Stage geht |

---

## Useful GitHub Templates / Starter-Code (Inspiration)

| Repo | Wofür anschauen |
|---|---|
| **vercel/ai-chatbot** | Next.js + AI SDK Streaming Chat-Patterns |
| **vercel/nextjs-subscription-payments** | Stripe + Supabase + Next.js komplett |
| **shadcn-ui/ui** | Component-Vorlagen 1:1 kopierbar |
| **magicui-design/magicui** | Animierte Components (Marquee, Globe, etc.) |
| **aceternity-ui** | Motion-heavy Components |
| **steven-tey/precedent** | Next.js + Auth + Stripe Starter |
| **t3-oss/create-t3-app** | Saubere Code-Struktur als Inspiration |
| **lobehub/lobe-chat** | KI-Chat-UI-Inspiration für Coach |
| **supabase/supabase-nextjs-template** | Supabase-spezifische Patterns |
| **vercel/next-pwa-example** | PWA-Setup-Referenz |

---

## Was wir NICHT brauchen + warum

| ❌ | Warum nicht |
|---|---|
| Docker | Vercel macht das transparent |
| Kubernetes | Overkill x1000 |
| Redis | Supabase Edge Functions oder Vercel KV ist genug, wenn nötig |
| GraphQL | Supabase REST + REST-Routes reichen, weniger Komplexität |
| Redux | React Context + Zustand reichen |
| Firebase | Supabase ist die bessere Wahl (SQL, Open Source, Self-Host-Option) |
| Eigene Auth | Supabase Auth ist sicher + ausgereift |
| React Native (jetzt) | PWA first, dann Capacitor. Native-from-Start ist 2-3x Aufwand |
| Notion / Linear für Project-Mgmt | GitHub Issues + dieses Repo reichen, weniger Tool-Switching |
| Lovable / Bolt für Code | Wir bauen sauber selbst — diese Tools generieren schmutzig |

---

## Wann/wie ich (Claude) automatisch skill-triggern soll

In `~/project-x/CLAUDE.md` ist der Trigger-Mechanismus dokumentiert. Aber als Faustregel:

- **Neue Feature-Anfrage von Nepomuk** → `brainstorming` Skill triggern
- **Komplexe Implementation (>1 File)** → `writing-plans` Skill triggern
- **Bug-Report** → `systematic-debugging` Skill triggern
- **Vor Commit** → `verification-before-completion` Skill triggern
- **UI bauen** → `frontend-design` + `ui-styling` Skills triggern
- **Library-Frage** → `context7` MCP nutzen (statt WebSearch)
- **DB-Schema-Änderung** → `Supabase MCP` direkt
- **Deployment-Frage** → `Vercel MCP` direkt
