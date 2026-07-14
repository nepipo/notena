# Klausur-Erinnerung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** User kann in Einstellungen per Multi-Select-Chips konfigurieren, X Tage vor einer Klausur eine Push-Notification zu erhalten. Ein täglicher Vercel-Cron sendet die Erinnerungen um 06:00 Uhr.

**Architecture:** Neue Spalte `klausur_erinnerung_tage integer[]` in `nutzer_profil` speichert die Präferenz. Ein Service-Role-Supabase-Client in `lib/supabase/admin.ts` liest alle fälligen Klausuren-Erinnerungen ohne RLS-Beschränkung. Die Cron-Route `/api/cron/klausur-erinnerung` läuft täglich, matcht Klausur-Datum gegen User-Präferenzen und ruft den bestehenden `sendPushZuUser`-Helper auf.

**Tech Stack:** Next.js App Router · Supabase Postgres + RLS · web-push · Vercel Crons · `@supabase/supabase-js` (bereits installiert)

---

## File Map

| Status | Datei | Änderung |
|--------|-------|----------|
| Neu | `supabase/migrations/0011_klausur_erinnerung.sql` | Spalte + DB-Funktion |
| Neu | `lib/supabase/admin.ts` | Service-Role-Client für Cron |
| Ändern | `lib/actions/schule.ts` | `setKlausurErinnerungTage` hinzufügen |
| Neu | `lib/actions/push-admin.ts` | `sendPushZuUserAdmin` (nutzt admin client) |
| Neu | `components/einstellungen/klausur-erinnerung-config.tsx` | Multi-Select-Chips |
| Ändern | `app/(app)/einstellungen/page.tsx` | Fetch + Render der Chips |
| Neu | `app/api/cron/klausur-erinnerung/route.ts` | Tägliche Cron-Route |
| Neu | `vercel.json` | Cron-Schedule |

---

## Task 1: DB-Migration

**Files:**
- Create: `supabase/migrations/0011_klausur_erinnerung.sql`

- [ ] **Step 1: Migration-Datei anlegen**

```sql
-- supabase/migrations/0011_klausur_erinnerung.sql

-- Erinnerungs-Präferenz: Array von Tagen (z.B. [1, 3] = 1 Tag und 3 Tage vorher)
ALTER TABLE public.nutzer_profil
  ADD COLUMN IF NOT EXISTS klausur_erinnerung_tage integer[]
    NOT NULL DEFAULT '{1,3}';

-- Hilfsfunktion für den Cron: liefert alle heutigen Erinnerungen
-- SECURITY DEFINER damit der anon-Key die anderen User-Daten nicht sieht,
-- aber der service_role-Key diese Funktion trotzdem nutzen kann.
CREATE OR REPLACE FUNCTION public.klausur_erinnerungen_heute()
RETURNS TABLE(
  user_id          uuid,
  klausur_titel    text,
  fach_name        text,
  vorbereitung_prozent smallint,
  tage_bis         integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    np.id,
    sk.titel,
    COALESCE(sf.name, '')::text,
    sk.vorbereitung_prozent,
    (sk.datum::date - CURRENT_DATE)::integer
  FROM public.nutzer_profil np
  JOIN public.schule_klausur sk ON sk.user_id = np.id
  LEFT JOIN public.schule_fach sf ON sf.id = sk.fach_id
  WHERE
    np.klausur_erinnerung_tage IS NOT NULL
    AND cardinality(np.klausur_erinnerung_tage) > 0
    AND (sk.datum::date - CURRENT_DATE) = ANY(np.klausur_erinnerung_tage)
    AND sk.datum::date >= CURRENT_DATE
  ORDER BY np.id, sk.datum;
$$;
```

- [ ] **Step 2: Migration auf Supabase anwenden**

Nutze das Supabase MCP Tool `apply_migration` mit:
- `project_id`: `rxmcexzlwocgfocyligd`
- `name`: `klausur_erinnerung`
- `query`: Inhalt der SQL-Datei

Erwartetes Ergebnis: Migration erfolgreich, keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0011_klausur_erinnerung.sql
git commit -m "feat: DB-Migration klausur_erinnerung_tage + Cron-Hilfsfunktion"
```

---

## Task 2: Admin Supabase Client

**Files:**
- Create: `lib/supabase/admin.ts`

- [ ] **Step 1: Admin-Client anlegen**

```ts
// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

/**
 * Service-Role-Client für Server-seitige Operationen die RLS umgehen müssen
 * (z.B. Cron-Jobs). Nur auf dem Server verwenden, NIE im Browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlen.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

- [ ] **Step 2: `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` eintragen**

Den Key aus dem Supabase-Dashboard holen (Project Settings → API → service_role key) und in `.env.local` eintragen:

```
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_aus_supabase_dashboard>
```

**Wichtig:** Dieser Key ist geheim — NIE committen, er ist bereits in `.gitignore` durch `*.local`.

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/admin.ts
git commit -m "feat: Supabase Admin-Client für Cron-Routen"
```

---

## Task 3: Server Action `setKlausurErinnerungTage`

**Files:**
- Modify: `lib/actions/schule.ts`

- [ ] **Step 1: Action ans Ende von `lib/actions/schule.ts` anhängen**

Nach der letzten bestehenden Export-Funktion einfügen:

```ts
export async function setKlausurErinnerungTage(
  tage: number[],
): Promise<ActionResult> {
  try {
    const userId = await requireUserId();
    const supabase = await createClient();
    const { error } = await supabase
      .from("nutzer_profil")
      .update({ klausur_erinnerung_tage: tage })
      .eq("id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler." };
  }
}
```

`ActionResult` und `requireUserId` sind bereits oben in der Datei definiert.

- [ ] **Step 2: Commit**

```bash
git add lib/actions/schule.ts
git commit -m "feat: Server Action setKlausurErinnerungTage"
```

---

## Task 4: Push-Helper für Cron

**Files:**
- Create: `lib/actions/push-admin.ts`

`sendPushZuUser` in `lib/actions/push.ts` nutzt `createClient()` (cookie-basiert) und würde ohne Session-Cookie keine Subscriptions finden. Deshalb brauchen wir eine Admin-Variante.

- [ ] **Step 1: `push-admin.ts` anlegen**

```ts
// lib/actions/push-admin.ts
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushPayload } from "@/lib/actions/push";

function initWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv)
    throw new Error("VAPID-Keys fehlen.");
  webpush.setVapidDetails("mailto:ne.polonius@gmail.com", pub, priv);
}

export async function sendPushZuUserAdmin(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  initWebPush();
  const supabase = createAdminClient();

  const { data: subs } = await supabase
    .from("push_subscription")
    .select("endpoint, p256dh, auth_key")
    .eq("user_id", userId);

  if (!subs?.length) return;

  const abgelaufeneEndpoints: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          abgelaufeneEndpoints.push(sub.endpoint);
        }
      }
    }),
  );

  if (abgelaufeneEndpoints.length) {
    await supabase
      .from("push_subscription")
      .delete()
      .eq("user_id", userId)
      .in("endpoint", abgelaufeneEndpoints);
  }
}
```

`PushPayload` ist bereits in `lib/actions/push.ts` exportiert — re-import vermeidet Duplikation.

- [ ] **Step 2: Commit**

```bash
git add lib/actions/push-admin.ts
git commit -m "feat: sendPushZuUserAdmin für Cron ohne Session-Cookie"
```

---

## Task 5: UI-Komponente `KlausurErinnerungConfig`

**Files:**
- Create: `components/einstellungen/klausur-erinnerung-config.tsx`

- [ ] **Step 1: Komponente anlegen**

```tsx
// components/einstellungen/klausur-erinnerung-config.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { setKlausurErinnerungTage } from "@/lib/actions/schule";

const OPTIONEN = [
  { tage: 1, label: "1 Tag vorher" },
  { tage: 3, label: "3 Tage vorher" },
  { tage: 7, label: "7 Tage vorher" },
] as const;

export function KlausurErinnerungConfig({ initial }: { initial: number[] }) {
  const [ausgewaehlt, setAusgewaehlt] = useState<number[]>(initial);
  const [pushAktiv, setPushAktiv] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushAktiv(false);
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setPushAktiv(!!sub);
    });
  }, []);

  function toggle(tage: number) {
    const prev = ausgewaehlt;
    const naechste = ausgewaehlt.includes(tage)
      ? ausgewaehlt.filter((t) => t !== tage)
      : [...ausgewaehlt, tage].sort((a, b) => a - b);

    setAusgewaehlt(naechste);
    startTransition(async () => {
      const res = await setKlausurErinnerungTage(naechste);
      if (!res.ok) {
        setAusgewaehlt(prev);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="mb-1 text-sm font-semibold">Klausur-Erinnerungen</p>
      <p className="mb-3 font-mono text-[11px] text-text-mute">
        Wann soll Notena dich an bevorstehende Klausuren erinnern?
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONEN.map(({ tage, label }) => {
          const aktiv = ausgewaehlt.includes(tage);
          const disabled = pushAktiv === false || isPending;
          return (
            <button
              key={tage}
              onClick={() => toggle(tage)}
              disabled={disabled}
              aria-pressed={aktiv}
              className={`rounded-xl border px-4 py-2 font-display text-sm font-bold transition-all disabled:opacity-40 ${
                aktiv
                  ? "border-brand/40 bg-brand/12 text-brand"
                  : "border-border bg-surface-2 text-foreground hover:bg-surface-3"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {pushAktiv === false && (
        <p className="mt-2 font-mono text-[11px] text-destructive">
          Push-Benachrichtigungen oben erst aktivieren.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/einstellungen/klausur-erinnerung-config.tsx
git commit -m "feat: KlausurErinnerungConfig Multi-Select-Chips"
```

---

## Task 6: Einstellungen-Seite updaten

**Files:**
- Modify: `app/(app)/einstellungen/page.tsx`

- [ ] **Step 1: Import hinzufügen**

Am Anfang der Datei nach dem bestehenden `PushToggle`-Import:

```ts
import { KlausurErinnerungConfig } from "@/components/einstellungen/klausur-erinnerung-config";
```

- [ ] **Step 2: `klausur_erinnerung_tage` zum Profil-Fetch hinzufügen**

Die bestehende Zeile:
```ts
supabase.from("nutzer_profil").select("eingabe_modus, aktuelles_halbjahr, default_gewichtung, briefing_aktiv").single(),
```

Ersetzen durch:
```ts
supabase.from("nutzer_profil").select("eingabe_modus, aktuelles_halbjahr, default_gewichtung, briefing_aktiv, klausur_erinnerung_tage").single(),
```

- [ ] **Step 3: Variable ableiten**

Nach der bestehenden `briefingAktiv`-Zeile einfügen:
```ts
const klausurErinnerungTage = (profil?.klausur_erinnerung_tage as number[] | null) ?? [1, 3];
```

- [ ] **Step 4: Komponente im Benachrichtigungs-Block rendern**

Im JSX direkt nach `<PushToggle />` und dem `<p className="mt-3 ...">` Hinweis-Text einfügen:

```tsx
<KlausurErinnerungConfig initial={klausurErinnerungTage} />
```

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/einstellungen/page.tsx
git commit -m "feat: KlausurErinnerungConfig in Einstellungen einbinden"
```

---

## Task 7: Cron-Route

**Files:**
- Create: `app/api/cron/klausur-erinnerung/route.ts`

- [ ] **Step 1: Cron-Route anlegen**

```ts
// app/api/cron/klausur-erinnerung/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushZuUserAdmin } from "@/lib/actions/push-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErinnerungRow = {
  user_id: string;
  klausur_titel: string;
  fach_name: string;
  vorbereitung_prozent: number;
  tage_bis: number;
};

function wann(tage: number): string {
  if (tage === 1) return "morgen";
  if (tage === 7) return "in einer Woche";
  return `in ${tage} Tagen`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.rpc("klausur_erinnerungen_heute");
    if (error) {
      console.error("[cron/klausur-erinnerung] RPC-Fehler:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const erinnerungen = (data ?? []) as ErinnerungRow[];

    let gesendet = 0;
    for (const e of erinnerungen) {
      const fachPrefix = e.fach_name ? `${e.fach_name} ` : "";
      await sendPushZuUserAdmin(e.user_id, {
        title: `${fachPrefix}Klausur ${wann(e.tage_bis)}!`,
        body: `${e.klausur_titel} · Vorbereitung: ${e.vorbereitung_prozent}%`,
        url: "/noten",
      });
      gesendet++;
    }

    console.log(`[cron/klausur-erinnerung] ${gesendet} Erinnerungen gesendet.`);
    return NextResponse.json({ ok: true, gesendet });
  } catch (e) {
    console.error("[cron/klausur-erinnerung]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unbekannter Fehler" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: `CRON_SECRET` in `.env.local` setzen**

Einen zufälligen String generieren und in `.env.local` eintragen:

```bash
# Im Terminal ausführen um einen sicheren Wert zu erzeugen:
openssl rand -base64 32
```

Dann in `.env.local`:
```
CRON_SECRET=<generierter_wert>
```

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/klausur-erinnerung/route.ts
git commit -m "feat: Cron-Route klausur-erinnerung"
```

---

## Task 8: Vercel-Cron konfigurieren

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: `vercel.json` anlegen**

```json
{
  "crons": [
    {
      "path": "/api/cron/klausur-erinnerung",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Das läuft täglich um 06:00 UTC (= 07:00 / 08:00 MESZ je nach Jahreszeit). Vercel Hobby-Plan unterstützt bis zu 2 Cron-Jobs.

- [ ] **Step 2: `CRON_SECRET` und `SUPABASE_SERVICE_ROLE_KEY` in Vercel hinterlegen**

Im Vercel-Dashboard (project-x → Settings → Environment Variables) beide Variablen für `Production` und `Preview` anlegen:
- `CRON_SECRET` — gleicher Wert wie in `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` — Service-Role-Key aus Supabase-Dashboard

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: Vercel-Cron für tägliche Klausur-Erinnerungen (06:00 UTC)"
```

---

## Task 9: Manueller Test

- [ ] **Step 1: Dev-Server starten und Einstellungen öffnen**

```bash
npm run dev
```

Zu `/einstellungen` navigieren. Im Benachrichtigungs-Block sollten unter dem PushToggle drei Chips erscheinen: "1 Tag vorher", "3 Tage vorher", "7 Tage vorher" — standardmäßig 1 und 3 aktiv.

- [ ] **Step 2: Push aktivieren und Chips testen**

Push aktivieren (falls noch nicht). Chips umschalten und prüfen ob der DB-Wert gespeichert wird (Supabase Table Editor → nutzer_profil → klausur_erinnerung_tage).

- [ ] **Step 3: Cron-Route lokal testen**

```bash
curl -H "Authorization: Bearer <CRON_SECRET_aus_.env.local>" http://localhost:3000/api/cron/klausur-erinnerung
```

Erwartetes Ergebnis: `{"ok":true,"gesendet":N}` — N ist die Anzahl der heute fälligen Erinnerungen (0 wenn keine Klausur morgen/in 3/7 Tagen).

Wenn eine Testklausur auf morgen gesetzt ist und Push aktiv ist, sollte eine Notification eintreffen.

- [ ] **Step 4: Build-Check**

```bash
npm run build
```

Erwartetes Ergebnis: Kein TypeScript-Fehler, alle Routen kompiliert.

---

## Self-Review Checklist

- [x] **Spec-Coverage:** Migration ✓ · Admin-Client ✓ · Server Action ✓ · UI-Komponente ✓ · Cron-Route ✓ · vercel.json ✓
- [x] **Placeholder-Scan:** Kein TBD, alle Code-Blöcke vollständig
- [x] **Type-Consistency:** `PushPayload` aus `lib/actions/push.ts` re-importiert · `ErinnerungRow` lokal in Route definiert · `ActionResult` aus bestehender Datei
- [x] **RLS-Sicherheit:** Admin-Client nur in Cron-Route + push-admin.ts, nie im Browser
- [x] **Kein neues npm-Paket:** `@supabase/supabase-js` und `web-push` bereits installiert
