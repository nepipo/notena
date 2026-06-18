# Pro-Monetarisierung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pro-Abo (Soft-Freemium) scharf zum Beta-Launch — DB, Gating der bestehenden KI-Features, LemonSqueezy-Webhook, Pricing-Page und Checkout.

**Architecture:** Pro-Status liegt in `nutzer_profil` (Felder `plan_tier`, `plan_status`, `plan_bis` etc.), geschrieben ausschließlich per Webhook über den Service-Role-Client. Ein pure-function-Helper `istPro(profil)` entscheidet überall server-seitig über Zugriff. Bezahlung läuft über LemonSqueezy Hosted-Checkout (kein SDK — Checkout-URLs + HMAC-Webhook mit `node:crypto`).

**Tech Stack:** Next.js 16 (App Router), Supabase (`@supabase/ssr`), Vitest, zod 4, LemonSqueezy (Merchant of Record).

**Spec:** `docs/superpowers/specs/2026-06-18-pro-monetarisierung-design.md`

---

## Scope

**In diesem Plan:**
- DB-Migration + Types
- `istPro`-Helper (pure, TDD)
- Server-Gating von Coach (`/api/coach`) + Briefing (`lib/actions/briefing.ts`)
- LemonSqueezy-Webhook (Event-Mapping pure + Route)
- Pricing-Page `/pro` + Pro-Gate-UI
- Einstellungen → Abo-Status + Kündigen-Link
- §312j-konforme Checkout-Hinweise + Berechtigt-Checkbox

**NICHT in diesem Plan** (eigene Features, später; `istPro` macht Gating dann trivial):
- Trend-Analyse/Prognose, PDF-Report, Klassen-Vergleich (noch nicht gebaut)
- Akzentfarben-Gating (existiert als Free-Feature; Entscheidung Free/Pro im Execution-Review klären)
- Reminder-Mail Tag 6 (optional)
- **Harte Durchsetzung „ein Trial pro Account"**: Der Webhook setzt `trial_genutzt=true`, aber der Checkout prüft es noch nicht. Für die Beta reicht LemonSqueezys eigenes Trial-Tracking pro Customer-E-Mail. Das Flag liegt bereits vor, sodass das spätere Durchsetzen (Checkout → Nicht-Trial-Variante, wenn `trial_genutzt`) trivial wird.
- AGB/Widerruf-Texte (separater rechtlicher Strang)
- LemonSqueezy-Account-/Produkt-Setup (manuell durch Nepomuk/Vater)

---

## File Structure

| Datei | Verantwortung | Aktion |
|---|---|---|
| `supabase/migrations/0019_pro_subscription.sql` | Schema-Erweiterung + Update-Policy | Create |
| `lib/supabase/database.types.ts` | TS-Types der neuen Spalten | Modify |
| `lib/pro/plan.ts` | `istPro()` + Plan-Typen + Preis-Konstanten | Create |
| `lib/pro/plan.test.ts` | Tests für `istPro` | Create |
| `lib/pro/webhook.ts` | `berechneProfilUpdate()` (pure) + Event-Typen | Create |
| `lib/pro/webhook.test.ts` | Tests für Event-Mapping | Create |
| `lib/pro/checkout.ts` | Checkout-URL-Builder + Customer-Portal-URL | Create |
| `app/api/webhooks/lemonsqueezy/route.ts` | HMAC-Verify + DB-Update via Admin-Client | Create |
| `app/api/coach/route.ts` | Pro-Gate vor Anthropic-Call | Modify |
| `lib/actions/briefing.ts` | Pro-Gate vor Briefing-Generierung | Modify |
| `app/(app)/dashboard/page.tsx` | Coach/Briefing nur für Pro, sonst Upgrade-Prompt | Modify |
| `components/pro/pro-gate.tsx` | Wiederverwendbares Gate (zeigt Inhalt oder Upgrade-CTA) | Create |
| `components/pro/upgrade-prompt.tsx` | „Pro freischalten"-CTA | Create |
| `app/(app)/pro/page.tsx` | Pricing-Page (3 Intervalle, Feature-Vergleich, §312j) | Create |
| `components/pro/checkout-button.tsx` | Checkout-Button + Berechtigt-Checkbox (Client) | Create |
| `components/einstellungen/abo-status.tsx` | Abo-Status + Kündigen-Link | Create |
| `app/(app)/einstellungen/page.tsx` | Abo-Sektion einbinden | Modify |

---

## Vorbereitung: Umgebungsvariablen

Diese müssen in `.env.local` (und Vercel) gesetzt sein. **Nicht committen.** Werte stammen aus dem LemonSqueezy-Dashboard (manuelles Setup, außerhalb dieses Plans):

```
LEMONSQUEEZY_WEBHOOK_SECRET=...        # Signing-Secret des Webhooks
LEMONSQUEEZY_STORE_SUBDOMAIN=...       # z.B. "projectx" → projectx.lemonsqueezy.com
LEMONSQUEEZY_VARIANT_WOCHE=...         # Variant-ID Wochen-Abo
LEMONSQUEEZY_VARIANT_MONAT=...         # Variant-ID Monats-Abo
LEMONSQUEEZY_VARIANT_JAHR=...          # Variant-ID Jahres-Abo
LEMONSQUEEZY_CUSTOMER_PORTAL_URL=...   # Basis-URL Customer-Portal (Kündigung)
```

`SUPABASE_SERVICE_ROLE_KEY` existiert bereits (von Cron-Jobs genutzt).

---

## Task 1: DB-Migration + Types

**Files:**
- Create: `supabase/migrations/0019_pro_subscription.sql`
- Modify: `lib/supabase/database.types.ts`

- [ ] **Step 1: Migration schreiben**

`supabase/migrations/0019_pro_subscription.sql`:

```sql
-- Pro-Abo-Felder. plan_tier existiert bereits (default 'free').
alter table nutzer_profil
  add column if not exists plan_status     text,
  add column if not exists plan_intervall  text,
  add column if not exists plan_bis        timestamptz,
  add column if not exists trial_genutzt   boolean not null default false,
  add column if not exists ls_customer_id     text,
  add column if not exists ls_subscription_id text;

-- Plan-Felder dürfen NUR per Service-Role (Webhook) geschrieben werden.
-- Der User darf seinen eigenen Plan nicht hochsetzen. Wir erzwingen das,
-- indem die User-Update-Policy die Plan-Spalten unverändert lassen muss.
-- Bestehende Policy "nutzer darf eigenes profil aktualisieren" wird ersetzt.
drop policy if exists "profil_update_own" on nutzer_profil;

create policy "profil_update_own" on nutzer_profil
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Plan-Spalten dürfen sich per User-Update nicht ändern:
    and plan_tier        is not distinct from (select plan_tier        from nutzer_profil p where p.id = nutzer_profil.id)
    and plan_status      is not distinct from (select plan_status      from nutzer_profil p where p.id = nutzer_profil.id)
    and plan_intervall   is not distinct from (select plan_intervall   from nutzer_profil p where p.id = nutzer_profil.id)
    and plan_bis         is not distinct from (select plan_bis         from nutzer_profil p where p.id = nutzer_profil.id)
    and ls_customer_id     is not distinct from (select ls_customer_id     from nutzer_profil p where p.id = nutzer_profil.id)
    and ls_subscription_id is not distinct from (select ls_subscription_id from nutzer_profil p where p.id = nutzer_profil.id)
  );

create index if not exists idx_nutzer_profil_ls_customer on nutzer_profil (ls_customer_id);
```

> **Hinweis für den Executor:** Prüfe den exakten Namen der bestehenden Update-Policy auf `nutzer_profil` in `0001_initial_schema.sql` (`grep -i "policy" supabase/migrations/0001_initial_schema.sql`). Falls die Policy anders heißt als `profil_update_own`, passe `drop policy` UND `create policy` entsprechend an. Falls die `with check`-Subqueries beim Self-Referencing Probleme machen, ist die einfachere Alternative: Plan-Spalten per `column-level`-Privileg sperren (`revoke update (plan_tier, ...) on nutzer_profil from authenticated;`) — diese Variante bevorzugen, wenn sie im Projekt sauberer ist.

- [ ] **Step 2: Migration anwenden**

Über Supabase MCP `apply_migration` (name: `0019_pro_subscription`) oder Supabase-Dashboard SQL-Editor.
Expected: Keine Fehler, 6 neue Spalten auf `nutzer_profil`.

- [ ] **Step 3: Verifizieren, dass die Spalten da sind**

Über Supabase MCP `list_tables` (oder `execute_sql`: `select column_name from information_schema.columns where table_name='nutzer_profil';`).
Expected: `plan_status`, `plan_intervall`, `plan_bis`, `trial_genutzt`, `ls_customer_id`, `ls_subscription_id` vorhanden.

- [ ] **Step 4: Types ergänzen**

In `lib/supabase/database.types.ts`, im `nutzer_profil`-Block, zu `Row`, `Insert` und `Update` die Felder hinzufügen (Row gezeigt; Insert/Update analog mit `?` bzw. optional):

```ts
// in nutzer_profil.Row (alphabetisch einsortieren):
ls_customer_id: string | null
ls_subscription_id: string | null
plan_bis: string | null
plan_intervall: string | null
plan_status: string | null
trial_genutzt: boolean
```

In `Insert` und `Update` dieselben Felder als optional (`ls_customer_id?: string | null`, `trial_genutzt?: boolean`, usw.).

> **Bevorzugt:** Falls Supabase MCP `generate_typescript_types` verfügbar ist, damit die Datei neu generieren statt manuell editieren.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS (keine Fehler durch die neuen Felder).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0019_pro_subscription.sql lib/supabase/database.types.ts
git commit -m "feat: DB-Schema für Pro-Abo (plan-Felder + Update-Policy-Hardening)"
```

---

## Task 2: `istPro`-Helper + Plan-Konstanten (TDD)

**Files:**
- Create: `lib/pro/plan.ts`
- Test: `lib/pro/plan.test.ts`

- [ ] **Step 1: Failing Test schreiben**

`lib/pro/plan.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { istPro, type PlanProfil } from "./plan";

const basis: PlanProfil = {
  plan_tier: "free",
  plan_bis: null,
};

describe("istPro", () => {
  it("free ohne plan_bis ist nicht Pro", () => {
    expect(istPro(basis)).toBe(false);
  });

  it("pro mit plan_bis in der Zukunft ist Pro", () => {
    const morgen = new Date(Date.now() + 86_400_000).toISOString();
    expect(istPro({ plan_tier: "pro", plan_bis: morgen })).toBe(true);
  });

  it("pro mit abgelaufenem plan_bis ist nicht Pro", () => {
    const gestern = new Date(Date.now() - 86_400_000).toISOString();
    expect(istPro({ plan_tier: "pro", plan_bis: gestern })).toBe(false);
  });

  it("pro ohne plan_bis ist nicht Pro (defensiv)", () => {
    expect(istPro({ plan_tier: "pro", plan_bis: null })).toBe(false);
  });

  it("null-Profil ist nicht Pro", () => {
    expect(istPro(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `npm run test -- lib/pro/plan.test.ts`
Expected: FAIL (`Cannot find module './plan'`).

- [ ] **Step 3: Implementierung schreiben**

`lib/pro/plan.ts`:

```ts
/** Minimal-Form eines Profils, die für die Pro-Prüfung reicht. */
export type PlanProfil = {
  plan_tier: string | null;
  plan_bis: string | null;
};

/**
 * Einzige Quelle der Wahrheit für „darf dieser User Pro-Features nutzen".
 * Pro gilt, solange plan_tier === 'pro' UND plan_bis in der Zukunft liegt.
 * plan_bis bleibt nach Kündigung bis zum Periodenende stehen — daher reicht
 * diese eine Prüfung auch für gekündigte-aber-noch-aktive Abos.
 */
export function istPro(profil: PlanProfil | null | undefined): boolean {
  if (!profil) return false;
  if (profil.plan_tier !== "pro") return false;
  if (!profil.plan_bis) return false;
  return new Date(profil.plan_bis).getTime() > Date.now();
}

/** Abo-Intervalle. */
export type PlanIntervall = "woche" | "monat" | "jahr";

/** Preise in Cent (für Anzeige). Quelle: Design-Spec §4. */
export const PREISE: Record<PlanIntervall, number> = {
  woche: 199,
  monat: 499,
  jahr: 3999,
};

export const INTERVALL_LABEL: Record<PlanIntervall, string> = {
  woche: "Woche",
  monat: "Monat",
  jahr: "Jahr",
};
```

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `npm run test -- lib/pro/plan.test.ts`
Expected: PASS (5 Tests grün).

- [ ] **Step 5: Commit**

```bash
git add lib/pro/plan.ts lib/pro/plan.test.ts
git commit -m "feat: istPro-Helper + Plan-Konstanten"
```

---

## Task 3: Server-Gating der bestehenden Pro-Features

Coach und Briefing dürfen nur noch für Pro-User Anthropic-Calls auslösen.

**Files:**
- Modify: `app/api/coach/route.ts`
- Modify: `lib/actions/briefing.ts`
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Coach-Route gaten**

In `app/api/coach/route.ts`, im `POST`-Handler **direkt nach** dem Auth-Check (`if (!auth?.claims?.sub) { ... }`) und **vor** dem Rate-Limit-Check einfügen:

```ts
import { istPro } from "@/lib/pro/plan";
// ... im POST, nach dem Auth-Check:
const { data: planProfil } = await supabase
  .from("nutzer_profil")
  .select("plan_tier, plan_bis")
  .single();
if (!istPro(planProfil)) {
  return Response.json(
    { error: "Der KI-Coach ist ein Pro-Feature.", code: "pro_required" },
    { status: 402 },
  );
}
```

(Import oben zu den bestehenden Imports hinzufügen.)

- [ ] **Step 2: Briefing-Action gaten**

`lib/actions/briefing.ts` öffnen und die Funktion finden, die das Briefing generiert (Anthropic-Call). **Vor** dem Anthropic-Call denselben Check einbauen:

```ts
import { istPro } from "@/lib/pro/plan";
// am Anfang der generierenden Funktion, nach Auth/Client-Setup:
const { data: planProfil } = await supabase
  .from("nutzer_profil")
  .select("plan_tier, plan_bis")
  .single();
if (!istPro(planProfil)) {
  return { ok: false as const, error: "Das tägliche Briefing ist ein Pro-Feature." };
}
```

> **Executor:** Passe Rückgabe-Form an die bestehende Signatur der Briefing-Action an (sieh dir die aktuellen `return`-Statements der Funktion an und spiegele deren Shape). Falls die Action einen gecachten Wert aus `briefing_cache` zurückgibt, gate **vor** der Neugenerierung, aber erlaube weiterhin das Lesen bereits gecachter Briefings (kein Re-Gen für Nicht-Pro).

- [ ] **Step 3: Dashboard-UI gaten**

In `app/(app)/dashboard/page.tsx` das Profil um `plan_tier, plan_bis` erweitern (im bestehenden `nutzer_profil`-Select) und `istPro` berechnen. Coach-Chat + Briefing nur rendern, wenn Pro — sonst `<UpgradePrompt>` (aus Task 6):

```tsx
import { istPro } from "@/lib/pro/plan";
import { UpgradePrompt } from "@/components/pro/upgrade-prompt";
// ... plan_tier, plan_bis ins Profil-Select aufnehmen
const pro = istPro(profil);
// statt <CoachChat ... />:
{pro ? <CoachChat /* bestehende Props */ /> : <UpgradePrompt feature="KI-Coach" />}
// analog fürs Briefing-Element
```

> **Executor:** Übernimm die bestehenden Props von `CoachChat`/Briefing unverändert. Reihenfolge: Erst Task 6 (UpgradePrompt) bauen, dann diesen Step — oder den Import temporär auskommentieren, bis Task 6 fertig ist. Bei subagent-getriebener Ausführung: Task 6 vor Task 3 Step 3 einplanen.

- [ ] **Step 4: Typecheck + Tests**

Run: `npm run typecheck && npm run test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/coach/route.ts lib/actions/briefing.ts "app/(app)/dashboard/page.tsx"
git commit -m "feat: Coach + Briefing serverseitig hinter Pro-Gate"
```

---

## Task 4: Webhook Event-Mapping (TDD, pure)

Die Logik „LemonSqueezy-Event → DB-Update" als reine Funktion — ohne DB, voll testbar.

**Files:**
- Create: `lib/pro/webhook.ts`
- Test: `lib/pro/webhook.test.ts`

- [ ] **Step 1: Failing Test schreiben**

`lib/pro/webhook.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { berechneProfilUpdate, type LsWebhookPayload } from "./webhook";

function payload(
  eventName: string,
  attrs: Partial<LsWebhookPayload["data"]["attributes"]> = {},
): LsWebhookPayload {
  return {
    meta: { event_name: eventName, custom_data: { user_id: "u1" } },
    data: {
      id: "sub_1",
      attributes: {
        status: "active",
        customer_id: 42,
        variant_name: "Monat",
        renews_at: "2026-07-18T00:00:00Z",
        ends_at: null,
        trial_ends_at: null,
        ...attrs,
      },
    },
  };
}

describe("berechneProfilUpdate", () => {
  it("subscription_created (Trial) → pro/trial bis trial_ends_at", () => {
    const u = berechneProfilUpdate(
      payload("subscription_created", {
        status: "on_trial",
        trial_ends_at: "2026-06-25T00:00:00Z",
      }),
    );
    expect(u).toEqual({
      userId: "u1",
      update: {
        plan_tier: "pro",
        plan_status: "trial",
        plan_intervall: "monat",
        plan_bis: "2026-06-25T00:00:00Z",
        trial_genutzt: true,
        ls_customer_id: "42",
        ls_subscription_id: "sub_1",
      },
    });
  });

  it("subscription_payment_success → active bis renews_at", () => {
    const u = berechneProfilUpdate(payload("subscription_payment_success"));
    expect(u?.update.plan_tier).toBe("pro");
    expect(u?.update.plan_status).toBe("active");
    expect(u?.update.plan_bis).toBe("2026-07-18T00:00:00Z");
  });

  it("subscription_cancelled → status cancelled, plan_bis = ends_at (Periodenende)", () => {
    const u = berechneProfilUpdate(
      payload("subscription_cancelled", {
        status: "cancelled",
        ends_at: "2026-07-18T00:00:00Z",
      }),
    );
    expect(u?.update.plan_status).toBe("cancelled");
    expect(u?.update.plan_tier).toBe("pro"); // bleibt Pro bis Periodenende
    expect(u?.update.plan_bis).toBe("2026-07-18T00:00:00Z");
  });

  it("subscription_expired → zurück auf free", () => {
    const u = berechneProfilUpdate(
      payload("subscription_expired", { status: "expired" }),
    );
    expect(u?.update.plan_tier).toBe("free");
    expect(u?.update.plan_status).toBe("expired");
  });

  it("unbekanntes Event → null (ignorieren)", () => {
    expect(berechneProfilUpdate(payload("order_refunded"))).toBeNull();
  });

  it("fehlende user_id → null", () => {
    const p = payload("subscription_created");
    p.meta.custom_data = {} as never;
    expect(berechneProfilUpdate(p)).toBeNull();
  });

  it("Variant-Name 'Jahr' → intervall jahr", () => {
    const u = berechneProfilUpdate(payload("subscription_payment_success", { variant_name: "Jahr" }));
    expect(u?.update.plan_intervall).toBe("jahr");
  });
});
```

- [ ] **Step 2: Test laufen lassen — muss fehlschlagen**

Run: `npm run test -- lib/pro/webhook.test.ts`
Expected: FAIL (`Cannot find module './webhook'`).

- [ ] **Step 3: Implementierung schreiben**

`lib/pro/webhook.ts`:

```ts
import type { PlanIntervall } from "./plan";

/** Nur die Felder, die wir aus dem LemonSqueezy-Payload brauchen. */
export type LsWebhookPayload = {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string };
  };
  data: {
    id: string;
    attributes: {
      status: string;
      customer_id: number;
      variant_name: string;
      renews_at: string | null;
      ends_at: string | null;
      trial_ends_at: string | null;
    };
  };
};

export type ProfilUpdate = {
  plan_tier: "free" | "pro";
  plan_status: "trial" | "active" | "cancelled" | "expired";
  plan_intervall: PlanIntervall;
  plan_bis: string | null;
  trial_genutzt?: boolean;
  ls_customer_id: string;
  ls_subscription_id: string;
};

export type ProfilUpdateResult = { userId: string; update: ProfilUpdate };

function variantZuIntervall(variantName: string): PlanIntervall {
  const v = variantName.toLowerCase();
  if (v.includes("woche")) return "woche";
  if (v.includes("jahr")) return "jahr";
  return "monat";
}

/**
 * Reine Abbildung: LemonSqueezy-Event → gewünschter Profil-Zustand.
 * Gibt null zurück, wenn das Event ignoriert werden soll oder die user_id fehlt.
 */
export function berechneProfilUpdate(
  payload: LsWebhookPayload,
): ProfilUpdateResult | null {
  const userId = payload.meta.custom_data?.user_id;
  if (!userId) return null;

  const a = payload.data.attributes;
  const basis = {
    plan_intervall: variantZuIntervall(a.variant_name),
    ls_customer_id: String(a.customer_id),
    ls_subscription_id: payload.data.id,
  };

  switch (payload.meta.event_name) {
    case "subscription_created":
      return {
        userId,
        update: {
          ...basis,
          plan_tier: "pro",
          plan_status: a.status === "on_trial" ? "trial" : "active",
          plan_bis: a.trial_ends_at ?? a.renews_at,
          trial_genutzt: true,
        },
      };
    case "subscription_payment_success":
    case "subscription_resumed":
    case "subscription_unpaused":
      return {
        userId,
        update: {
          ...basis,
          plan_tier: "pro",
          plan_status: "active",
          plan_bis: a.renews_at,
        },
      };
    case "subscription_cancelled":
      return {
        userId,
        update: {
          ...basis,
          plan_tier: "pro", // bleibt Pro bis Periodenende
          plan_status: "cancelled",
          plan_bis: a.ends_at ?? a.renews_at,
        },
      };
    case "subscription_expired":
      return {
        userId,
        update: {
          ...basis,
          plan_tier: "free",
          plan_status: "expired",
          plan_bis: a.ends_at,
        },
      };
    default:
      return null;
  }
}
```

> **Executor:** Achte beim Einfügen auf saubere Einrückung (kein Tab-Mix). Die `case "subscription_expired":`-Zeile sauber einrücken.

- [ ] **Step 4: Test laufen lassen — muss bestehen**

Run: `npm run test -- lib/pro/webhook.test.ts`
Expected: PASS (7 Tests grün).

- [ ] **Step 5: Commit**

```bash
git add lib/pro/webhook.ts lib/pro/webhook.test.ts
git commit -m "feat: LemonSqueezy Event→Profil-Mapping (pure)"
```

---

## Task 5: Webhook-Route

**Files:**
- Create: `app/api/webhooks/lemonsqueezy/route.ts`

- [ ] **Step 1: Route schreiben**

`app/api/webhooks/lemonsqueezy/route.ts`:

```ts
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { berechneProfilUpdate, type LsWebhookPayload } from "@/lib/pro/webhook";

/** Timing-sichere HMAC-SHA256-Prüfung der LemonSqueezy-Signatur. */
function signaturGueltig(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(digest, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!signaturGueltig(rawBody, signature)) {
    return Response.json({ error: "Ungültige Signatur" }, { status: 401 });
  }

  let payload: LsWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LsWebhookPayload;
  } catch {
    return Response.json({ error: "Ungültiges JSON" }, { status: 400 });
  }

  const result = berechneProfilUpdate(payload);
  if (!result) {
    // Event bewusst ignoriert (unbekannt o. fehlende user_id) — 200, damit
    // LemonSqueezy nicht endlos retried.
    return Response.json({ ignored: true }, { status: 200 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("nutzer_profil")
    .update(result.update)
    .eq("id", result.userId);

  if (error) {
    console.error("[ls-webhook] update error:", error);
    return Response.json({ error: "DB-Update fehlgeschlagen" }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 200 });
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Lokal mit gefälschter Signatur testen (manuell)**

```bash
# Server starten (separates Terminal): npm run dev
# Erwartung: 401 bei falscher Signatur
curl -s -X POST http://localhost:3000/api/webhooks/lemonsqueezy \
  -H "Content-Type: application/json" -H "x-signature: deadbeef" \
  -d '{"meta":{"event_name":"subscription_created"},"data":{}}' -w "\n%{http_code}\n"
```
Expected: HTTP 401, `{"error":"Ungültige Signatur"}`.

- [ ] **Step 4: Commit**

```bash
git add app/api/webhooks/lemonsqueezy/route.ts
git commit -m "feat: LemonSqueezy-Webhook-Route mit HMAC-Verify"
```

---

## Task 6: Pro-Gate-UI + Checkout-Builder + Pricing-Page

**Files:**
- Create: `lib/pro/checkout.ts`
- Create: `components/pro/upgrade-prompt.tsx`
- Create: `components/pro/pro-gate.tsx`
- Create: `components/pro/checkout-button.tsx`
- Create: `app/(app)/pro/page.tsx`

- [ ] **Step 1: Checkout-URL-Builder**

`lib/pro/checkout.ts`:

```ts
import type { PlanIntervall } from "./plan";

const VARIANT_ENV: Record<PlanIntervall, string> = {
  woche: "LEMONSQUEEZY_VARIANT_WOCHE",
  monat: "LEMONSQUEEZY_VARIANT_MONAT",
  jahr: "LEMONSQUEEZY_VARIANT_JAHR",
};

/**
 * Baut eine LemonSqueezy-Hosted-Checkout-URL für ein Intervall.
 * user_id wird als custom_data mitgegeben → kommt im Webhook zurück.
 * Nur server-seitig aufrufen (liest Server-Env).
 */
export function checkoutUrl(intervall: PlanIntervall, userId: string): string {
  const sub = process.env.LEMONSQUEEZY_STORE_SUBDOMAIN;
  const variant = process.env[VARIANT_ENV[intervall]];
  if (!sub || !variant) {
    throw new Error(`Checkout-Konfiguration fehlt für Intervall '${intervall}'.`);
  }
  const u = new URL(`https://${sub}.lemonsqueezy.com/buy/${variant}`);
  u.searchParams.set("checkout[custom][user_id]", userId);
  return u.toString();
}
```

- [ ] **Step 2: UpgradePrompt-Komponente**

`components/pro/upgrade-prompt.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Platzhalter für ein gesperrtes Pro-Feature mit CTA zur Pricing-Page. */
export function UpgradePrompt({ feature }: { feature: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{feature}</span> ist ein
        Pro-Feature.
      </p>
      <Button asChild className="mt-4">
        <Link href="/pro">Pro freischalten</Link>
      </Button>
    </div>
  );
}
```

> **Executor:** Prüfe den korrekten Import-Pfad/Variant von `Button` (sieh `components/einstellungen/*.tsx`). Verwende vorhandene Utility-Klassen/Tokens des Projekts (Theme aus `app/globals.css`); obige Klassen ggf. an bestehende Karten-Styles anpassen.

- [ ] **Step 3: ProGate-Komponente**

`components/pro/pro-gate.tsx`:

```tsx
import type { ReactNode } from "react";
import { UpgradePrompt } from "./upgrade-prompt";

/** Zeigt children nur, wenn pro===true; sonst den Upgrade-Prompt. */
export function ProGate({
  pro,
  feature,
  children,
}: {
  pro: boolean;
  feature: string;
  children: ReactNode;
}) {
  if (!pro) return <UpgradePrompt feature={feature} />;
  return <>{children}</>;
}
```

- [ ] **Step 4: Checkout-Button mit Berechtigt-Checkbox (Client)**

`components/pro/checkout-button.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Zeigt die Pflicht-Checkbox (§-Absicherung) und aktiviert erst dann den
 * zahlungspflichtigen Button, der zur LemonSqueezy-Checkout-URL führt.
 */
export function CheckoutButton({ url, label }: { url: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={ok}
          onChange={(e) => setOk(e.target.checked)}
          className="mt-0.5"
        />
        <span>Ich bin berechtigt, diesen Kauf zu tätigen.</span>
      </label>
      <Button asChild disabled={!ok} className="w-full">
        <a
          href={ok ? url : undefined}
          aria-disabled={!ok}
          onClick={(e) => !ok && e.preventDefault()}
        >
          {label}
        </a>
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Pricing-Page**

`app/(app)/pro/page.tsx` — Server-Component. Liest `user_id` aus der Session, baut die 3 Checkout-URLs, rendert Feature-Vergleich + 3 Intervall-Karten. **§312j-Pflicht:** sichtbarer Hinweis „7 Tage gratis, danach <Preis>, jederzeit kündbar" + zahlungspflichtiger Button-Text.

```tsx
import { createClient } from "@/lib/supabase/server";
import { checkoutUrl } from "@/lib/pro/checkout";
import { PREISE, INTERVALL_LABEL, type PlanIntervall } from "@/lib/pro/plan";
import { CheckoutButton } from "@/components/pro/checkout-button";

function euro(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",") + " €";
}

const INTERVALLE: PlanIntervall[] = ["woche", "monat", "jahr"];

export default async function ProPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub as string | undefined;

  if (!userId) {
    return <p className="p-6">Bitte einloggen, um Pro zu abonnieren.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold">Project X Pro</h1>
      <p className="mt-2 text-muted-foreground">
        KI-Coach, tägliches Briefing und mehr. 7 Tage gratis testen.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {INTERVALLE.map((iv) => {
          const url = checkoutUrl(iv, userId);
          return (
            <div key={iv} className="rounded-xl border border-border p-5">
              <h2 className="font-semibold">{INTERVALL_LABEL[iv]}</h2>
              <p className="mt-1 text-2xl font-bold">{euro(PREISE[iv])}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                7 Tage gratis, danach {euro(PREISE[iv])}/{INTERVALL_LABEL[iv]},
                jederzeit kündbar.
              </p>
              <div className="mt-4">
                <CheckoutButton url={url} label="Zahlungspflichtig abonnieren" />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Die Abrechnung erfolgt über Lemon Squeezy. Es gelten unsere{" "}
        <a href="/datenschutz" className="underline">Datenschutzerklärung</a> und das
        gesetzliche Widerrufsrecht.
      </p>
    </div>
  );
}
```

> **Executor:** Layout/Styling an das bestehende Design-System anpassen (Bricolage/Onest-Fonts, Azurblau-Akzent, Karten-Styles wie auf dem Dashboard). Jahres-Karte als „Spar-Tipp" visuell hervorheben. Inhaltlich nichts an Preisen/§312j-Texten ändern.

- [ ] **Step 6: Typecheck + Build**

Run: `npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/pro/checkout.ts components/pro/ "app/(app)/pro/page.tsx"
git commit -m "feat: Pricing-Page + Pro-Gate-UI + Checkout-Button"
```

---

## Task 7: Einstellungen → Abo-Status

**Files:**
- Create: `components/einstellungen/abo-status.tsx`
- Modify: `app/(app)/einstellungen/page.tsx`

- [ ] **Step 1: Abo-Status-Komponente**

`components/einstellungen/abo-status.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { INTERVALL_LABEL, type PlanIntervall } from "@/lib/pro/plan";

function datum(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function AboStatus({
  pro,
  status,
  intervall,
  bis,
}: {
  pro: boolean;
  status: string | null;
  intervall: string | null;
  bis: string | null;
}) {
  if (!pro) {
    return (
      <div className="rounded-xl border border-border p-5">
        <p className="text-sm text-muted-foreground">Du nutzt aktuell die Gratis-Version.</p>
        <Button asChild className="mt-3">
          <Link href="/pro">Pro freischalten</Link>
        </Button>
      </div>
    );
  }

  const intervallLabel = intervall ? INTERVALL_LABEL[intervall as PlanIntervall] : "";
  const portal = process.env.LEMONSQUEEZY_CUSTOMER_PORTAL_URL;

  return (
    <div className="rounded-xl border border-border p-5">
      <p className="text-sm">
        <span className="font-semibold text-foreground">Pro</span>
        {intervallLabel ? ` · ${intervallLabel}` : ""}
        {status === "trial" ? " · Trial" : status === "cancelled" ? " · gekündigt" : ""}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {status === "cancelled"
          ? `Läuft noch bis ${datum(bis)}.`
          : status === "trial"
            ? `Trial endet am ${datum(bis)}, danach kostenpflichtig.`
            : `Verlängert sich am ${datum(bis)}.`}
      </p>
      {portal && (
        <Button asChild variant="outline" className="mt-3">
          <a href={portal} target="_blank" rel="noopener noreferrer">
            Abo verwalten / kündigen
          </a>
        </Button>
      )}
    </div>
  );
}
```

> **Executor:** `LEMONSQUEEZY_CUSTOMER_PORTAL_URL` ist eine Server-Env und wird in dieser Server-Component direkt gelesen — ok. `Button variant="outline"` nur verwenden, wenn diese Variant existiert; sonst Default nehmen.

- [ ] **Step 2: In Einstellungen einbinden**

In `app/(app)/einstellungen/page.tsx`:
1. Profil-Select um `plan_tier, plan_status, plan_intervall, plan_bis` erweitern.
2. `istPro` importieren und berechnen.
3. `<AboStatus pro={...} status={...} intervall={...} bis={...} />` als eigene Sektion „Abo" einfügen (Platzierung im Bereich „Profil & Konto", nahe der bestehenden Abmelde-/Passwort-Optionen).

```tsx
import { AboStatus } from "@/components/einstellungen/abo-status";
import { istPro } from "@/lib/pro/plan";
// im Profil-Select die 4 Felder ergänzen
// im JSX:
<AboStatus
  pro={istPro(profil)}
  status={profil?.plan_status ?? null}
  intervall={profil?.plan_intervall ?? null}
  bis={profil?.plan_bis ?? null}
/>
```

- [ ] **Step 3: Typecheck + Build**

Run: `npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add components/einstellungen/abo-status.tsx "app/(app)/einstellungen/page.tsx"
git commit -m "feat: Abo-Status + Kündigen-Link in Einstellungen"
```

---

## Task 8: Verifikation (End-to-End, manuell)

**Files:** keine — nur Verifikation.

- [ ] **Step 1: Volle Test-Suite + Build**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: alles PASS.

- [ ] **Step 2: Free-User-Pfad lokal prüfen**

`npm run dev`, als frisch eingeloggter User (plan_tier=free):
- Dashboard zeigt bei Coach + Briefing den `UpgradePrompt`, nicht das Feature.
- `POST /api/coach` liefert 402 `pro_required` (z. B. via DevTools/Netzwerk beim Klick auf den gesperrten Coach — sollte gar nicht erreichbar sein, daher direkt testen):
  ```bash
  curl -s -X POST http://localhost:3000/api/coach -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"hi"}]}' -w "\n%{http_code}\n"
  ```
  Expected: 401 (nicht eingeloggt im curl) bzw. 402 mit gültiger Session.
- `/pro` zeigt 3 Karten mit korrekten Preisen (1,99 / 4,99 / 39,99 €) und §312j-Hinweis; Button erst nach Checkbox klickbar.

- [ ] **Step 3: Pro-User simulieren**

Über Supabase MCP `execute_sql` (Test-User):
```sql
update nutzer_profil
set plan_tier='pro', plan_status='active', plan_intervall='monat',
    plan_bis = now() + interval '30 days'
where id = '<test-user-id>';
```
Dashboard neu laden → Coach + Briefing sind jetzt sichtbar/nutzbar. Einstellungen zeigt „Pro · Monat · Verlängert sich am …".
Danach zurücksetzen: `update nutzer_profil set plan_tier='free', plan_status=null, plan_bis=null where id='<test-user-id>';`

- [ ] **Step 4: Abschluss-Commit (falls offene Änderungen)**

```bash
git add -A && git commit -m "chore: Pro-Monetarisierung end-to-end verifiziert"
```

---

## Nach dem Plan: manuelle Schritte (außerhalb Code)

1. LemonSqueezy-Store + 3 Varianten (Woche/Monat/Jahr) mit je 7-Tage-Trial anlegen (Konto über Vater).
2. Webhook in LemonSqueezy auf `https://<domain>/api/webhooks/lemonsqueezy` zeigen lassen, Signing-Secret in Vercel-Env setzen.
3. Alle `LEMONSQUEEZY_*`-Env-Vars in Vercel hinterlegen.
4. Echten Test-Kauf im LemonSqueezy-Testmodus durchführen → prüfen, dass der Webhook `plan_tier=pro` setzt.
5. AGB + Widerrufsbelehrung ergänzen (separater rechtlicher Strang).
