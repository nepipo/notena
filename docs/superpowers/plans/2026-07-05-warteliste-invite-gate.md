# Warteliste + Invite-Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signup nur mit Invite-Code (Codes mit Nutzungslimit), alle anderen landen auf einer Warteliste mit Double-Opt-in via Resend.

**Architecture:** Zwei neue Tabellen (`warteliste`, `invite_code`) mit RLS ohne Policies — Zugriff ausschließlich serverseitig über den bestehenden Service-Role-Client (`lib/supabase/admin.ts`). Atomare Code-Einlösung über zwei SECURITY-DEFINER-SQL-Funktionen, deren EXECUTE-Recht nur `service_role` hat (Pattern aus Migration `0002`). UI: Warteliste-Formular als wiederverwendbare Client-Komponente auf Landing + Signup, Bestätigungsseite unter `/warteliste/bestaetigen`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase (Postgres + Service-Role), Resend, zod v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-04-warteliste-invite-gate-design.md`

---

## ⚠️ Parallele Session

Im Repo liegen uncommittete Änderungen einer anderen Session, u.a. an `lib/supabase/proxy.ts` und `lib/validation.ts`. Deshalb:

- **Immer nur die eigenen Dateien explizit stagen** (`git add <pfad>`), nie `git add -A` / `git add .`.
- Vor dem Commit von `lib/supabase/proxy.ts` (Task 8): `git diff lib/supabase/proxy.ts` prüfen. Enthält der Diff fremde Änderungen (nicht nur unsere eine Zeile), **stoppen und Nepomuk fragen**.
- Neue zod-Schemas kommen NICHT in `lib/validation.ts` (Konfliktgefahr), sondern in `lib/warteliste/logic.ts`.

---

## Dateiübersicht

| Datei | Aktion | Verantwortung |
|---|---|---|
| `supabase/migrations/0027_warteliste_invite.sql` | Neu | Tabellen, RLS, Redeem-Funktionen |
| `lib/warteliste/logic.ts` | Neu | Pure Logik: Normalisierung, Schema, Mail-Throttle |
| `lib/warteliste/logic.test.ts` | Neu | Unit-Tests für die pure Logik |
| `lib/email/warteliste.ts` | Neu | Bestätigungsmail via Resend (Fehler werden zurückgegeben) |
| `lib/actions/warteliste.ts` | Neu | Server Actions: eintragen + bestätigen |
| `app/auth/actions.ts` | Ändern | Signup: Invite-Code einlösen / bei Fehler zurückgeben |
| `components/warteliste-form.tsx` | Neu | E-Mail-Formular (Landing + Signup + Bestätigungsseite) |
| `components/auth/signup-form.tsx` | Ändern | Invite-Code-Feld |
| `app/signup/page.tsx` | Ändern | „Noch keinen Code?"-Block mit Warteliste-Form |
| `app/page.tsx` | Ändern | Beta-CTA-Karte → Warteliste-Sektion (`#warteliste`) |
| `app/warteliste/bestaetigen/page.tsx` | Neu | Token einlösen, Erfolg/Fehler anzeigen |
| `lib/supabase/proxy.ts` | Ändern | `/warteliste` als öffentliche Route |
| `app/datenschutz/page.tsx` | Ändern | Abschnitt „Warteliste" |

---

### Task 1: Migration `0027_warteliste_invite`

**Files:**
- Create: `supabase/migrations/0027_warteliste_invite.sql`

- [ ] **Step 1: Migrationsdatei schreiben**

```sql
-- 0027_warteliste_invite.sql
-- Warteliste (Double-Opt-in) + Invite-Codes mit Nutzungslimit.
-- Beide Tabellen: RLS aktiv, KEINE Policies — Zugriff nur über Service-Role
-- (Server Actions). Redeem-Funktionen: EXECUTE nur für service_role.

create table public.warteliste (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  token uuid not null default gen_random_uuid(),
  bestaetigt_am timestamptz,
  letzte_mail_am timestamptz,
  created_at timestamptz not null default now()
);

create unique index warteliste_token_idx on public.warteliste (token);

create table public.invite_code (
  code text primary key,
  max_nutzungen int not null default 1 check (max_nutzungen > 0),
  genutzt int not null default 0 check (genutzt >= 0),
  aktiv boolean not null default true,
  kommentar text,
  created_at timestamptz not null default now()
);

alter table public.warteliste enable row level security;
alter table public.invite_code enable row level security;

-- Atomare Einlösung: genau dann true, wenn der Code aktiv ist und noch
-- Nutzungen frei hat. Kein Race bei gleichzeitigen Signups (row lock im UPDATE).
create or replace function public.redeem_invite_code(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  update invite_code
     set genutzt = genutzt + 1
   where code = p_code
     and aktiv
     and genutzt < max_nutzungen
  returning true;
$$;

-- Rollback, wenn signUp nach der Einlösung fehlschlägt (E-Mail existiert etc.).
create or replace function public.unredeem_invite_code(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update invite_code
     set genutzt = greatest(genutzt - 1, 0)
   where code = p_code;
$$;

-- Nur service_role darf die Funktionen aufrufen (Pattern aus 0002).
revoke execute on function public.redeem_invite_code(text) from public, anon, authenticated;
revoke execute on function public.unredeem_invite_code(text) from public, anon, authenticated;
grant execute on function public.redeem_invite_code(text) to service_role;
grant execute on function public.unredeem_invite_code(text) to service_role;
```

- [ ] **Step 2: Migration auf Supabase anwenden**

Über das Supabase-MCP-Tool `apply_migration` (Projekt `rxmcexzlwocgfocyligd`, Name `0027_warteliste_invite`, Inhalt = Datei aus Step 1). Alternativ: SQL-Editor im Supabase-Dashboard.

- [ ] **Step 3: Verifizieren**

Via MCP `execute_sql` (oder SQL-Editor):

```sql
select count(*) from public.warteliste;
select count(*) from public.invite_code;
select public.redeem_invite_code('GIBTSNICHT');
```

Expected: `0`, `0`, `NULL` (Code existiert nicht → kein `true`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0027_warteliste_invite.sql
git commit -m "feat: Migration Warteliste + Invite-Codes (RLS dicht, Redeem nur service_role)"
```

---

### Task 2: Pure Logik (TDD)

**Files:**
- Create: `lib/warteliste/logic.test.ts`
- Create: `lib/warteliste/logic.ts`

- [ ] **Step 1: Failing Tests schreiben**

```ts
// lib/warteliste/logic.test.ts
import { describe, it, expect } from "vitest";
import {
  normalisiereEmail,
  normalisiereCode,
  WartelisteEmailSchema,
  darfMailSenden,
  MAIL_THROTTLE_MS,
} from "./logic";

describe("normalisiereEmail", () => {
  it("trimmt und lowercased", () => {
    expect(normalisiereEmail("  Max@Beispiel.DE ")).toBe("max@beispiel.de");
  });
});

describe("normalisiereCode", () => {
  it("trimmt und uppercased", () => {
    expect(normalisiereCode("  hochrad26 ")).toBe("HOCHRAD26");
  });
});

describe("WartelisteEmailSchema", () => {
  it("akzeptiert gültige E-Mail", () => {
    expect(WartelisteEmailSchema.safeParse("max@beispiel.de").success).toBe(true);
  });
  it("lehnt Müll ab", () => {
    expect(WartelisteEmailSchema.safeParse("keine-email").success).toBe(false);
    expect(WartelisteEmailSchema.safeParse("").success).toBe(false);
  });
  it("lehnt überlange E-Mail ab", () => {
    expect(WartelisteEmailSchema.safeParse("a".repeat(250) + "@x.de").success).toBe(false);
  });
});

describe("darfMailSenden", () => {
  const jetzt = new Date("2026-07-05T12:00:00Z");

  it("true, wenn noch nie eine Mail rausging", () => {
    expect(darfMailSenden(null, jetzt)).toBe(true);
  });
  it("false, wenn letzte Mail vor 5 Minuten", () => {
    expect(darfMailSenden("2026-07-05T11:55:00Z", jetzt)).toBe(false);
  });
  it("true, wenn letzte Mail vor 15 Minuten", () => {
    expect(darfMailSenden("2026-07-05T11:45:00Z", jetzt)).toBe(true);
  });
  it("true, exakt an der Throttle-Grenze", () => {
    const grenze = new Date(jetzt.getTime() - MAIL_THROTTLE_MS).toISOString();
    expect(darfMailSenden(grenze, jetzt)).toBe(true);
  });
});
```

- [ ] **Step 2: Tests laufen lassen — müssen fehlschlagen**

Run: `npx vitest run lib/warteliste/logic.test.ts`
Expected: FAIL — `Cannot find module './logic'` (o.ä.)

- [ ] **Step 3: Implementierung**

```ts
// lib/warteliste/logic.ts
import { z } from "zod";

export function normalisiereEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function normalisiereCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export const WartelisteEmailSchema = z
  .email("Bitte gib eine gültige E-Mail-Adresse ein.")
  .max(254, "E-Mail ist zu lang.");

/** Max. 1 Bestätigungsmail pro 10 Minuten und E-Mail-Adresse. */
export const MAIL_THROTTLE_MS = 10 * 60 * 1000;

export function darfMailSenden(
  letzteMailAm: string | null,
  jetzt: Date = new Date(),
): boolean {
  if (!letzteMailAm) return true;
  return jetzt.getTime() - new Date(letzteMailAm).getTime() >= MAIL_THROTTLE_MS;
}
```

- [ ] **Step 4: Tests laufen lassen — müssen grün sein**

Run: `npx vitest run lib/warteliste/logic.test.ts`
Expected: PASS (7 Tests)

- [ ] **Step 5: Commit**

```bash
git add lib/warteliste/logic.ts lib/warteliste/logic.test.ts
git commit -m "feat: Warteliste-Logik (Normalisierung, E-Mail-Schema, Mail-Throttle)"
```

---

### Task 3: Bestätigungsmail (`lib/email/warteliste.ts`)

**Files:**
- Create: `lib/email/warteliste.ts`

Anders als `lib/email/welcome.ts` darf der Fehler hier NICHT verschluckt werden — ohne Mail kein Double-Opt-in. Deshalb `{ ok: boolean }` als Rückgabe.

- [ ] **Step 1: Implementierung**

```ts
// lib/email/warteliste.ts
import { Resend } from "resend";

// Benötigte Env-Variablen (.env.local + Vercel):
//   RESEND_API_KEY=re_...
//   RESEND_FROM_EMAIL=hallo@deinedomain.de

const APP_URL = "https://project-x-seven-tawny.vercel.app";

const BETREFF = "Ein Klick fehlt noch — dann bist du auf der Liste.";

/**
 * Schickt die Double-Opt-in-Mail für die Warteliste.
 * Rückgabe { ok: false } statt Exception — der Aufrufer entscheidet,
 * wie er den Fehler dem User zeigt. NICHT verschlucken wie bei welcome.ts:
 * ohne diese Mail gibt es kein Opt-in.
 */
export async function sendWartelisteBestaetigungsMail(
  email: string,
  token: string,
): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error(
      "sendWartelisteBestaetigungsMail: RESEND_API_KEY oder RESEND_FROM_EMAIL fehlt.",
    );
    return { ok: false };
  }

  const link = `${APP_URL}/warteliste/bestaetigen?token=${token}`;

  const text = `Hey — ein Klick fehlt noch.

Bestätige deine E-Mail und du bist auf der Warteliste für die geschlossene Beta:

→ ${link}

Wir melden uns, sobald dein Invite-Code bereit ist. Kein Spam, versprochen.

Falls du dich nicht eingetragen hast, kannst du diese Mail einfach ignorieren.`;

  const html = `<p>Hey — ein Klick fehlt noch.</p>
<p>Bestätige deine E-Mail und du bist auf der Warteliste für die geschlossene Beta:</p>
<p>→ <a href="${link}">E-Mail bestätigen</a></p>
<p>Wir melden uns, sobald dein Invite-Code bereit ist. Kein Spam, versprochen.</p>
<p>Falls du dich nicht eingetragen hast, kannst du diese Mail einfach ignorieren.</p>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: BETREFF,
      text,
      html,
    });
    if (error) {
      console.error("sendWartelisteBestaetigungsMail: Resend-Fehler:", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("sendWartelisteBestaetigungsMail: Unerwarteter Fehler:", err);
    return { ok: false };
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: keine Fehler

- [ ] **Step 3: Commit**

```bash
git add lib/email/warteliste.ts
git commit -m "feat: Double-Opt-in-Mail für die Warteliste via Resend"
```

---

### Task 4: Server Actions (`lib/actions/warteliste.ts`)

**Files:**
- Create: `lib/actions/warteliste.ts`

- [ ] **Step 1: Implementierung**

```ts
// lib/actions/warteliste.ts
"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWartelisteBestaetigungsMail } from "@/lib/email/warteliste";
import {
  normalisiereEmail,
  WartelisteEmailSchema,
  darfMailSenden,
} from "@/lib/warteliste/logic";

export type WartelisteState = { error?: string; success?: string } | null;

// Immer dieselbe Erfolgsmeldung — niemand kann abfragen, welche
// E-Mails auf der Liste stehen (keine Enumeration).
const ERFOLG =
  "Check dein Postfach — bestätige deine E-Mail und du bist auf der Liste.";
const GENERISCHER_FEHLER =
  "Etwas ist schiefgelaufen. Versuch es gleich nochmal.";

export async function wartelisteEintragen(
  _prevState: WartelisteState,
  formData: FormData,
): Promise<WartelisteState> {
  const email = normalisiereEmail(String(formData.get("email") ?? ""));
  const parsed = WartelisteEmailSchema.safeParse(email);
  if (!parsed.success) {
    return { error: "Bitte gib eine gültige E-Mail-Adresse ein." };
  }

  const supabase = createAdminClient();

  const { data: vorhanden, error: selectError } = await supabase
    .from("warteliste")
    .select("token, bestaetigt_am, letzte_mail_am")
    .eq("email", email)
    .maybeSingle();

  if (selectError) return { error: GENERISCHER_FEHLER };

  if (vorhanden?.bestaetigt_am) return { success: ERFOLG };
  if (vorhanden && !darfMailSenden(vorhanden.letzte_mail_am)) {
    return { success: ERFOLG };
  }

  let token: string | undefined = vorhanden?.token;
  if (!token) {
    const { data: neu, error: insertError } = await supabase
      .from("warteliste")
      .insert({ email })
      .select("token")
      .single();
    if (insertError || !neu) return { error: GENERISCHER_FEHLER };
    token = neu.token;
  }

  const { ok } = await sendWartelisteBestaetigungsMail(email, token!);
  if (!ok) {
    return {
      error:
        "Die Mail konnte gerade nicht gesendet werden. Versuch es in ein paar Minuten nochmal.",
    };
  }

  await supabase
    .from("warteliste")
    .update({ letzte_mail_am: new Date().toISOString() })
    .eq("email", email);

  return { success: ERFOLG };
}

/**
 * Löst den Bestätigungs-Token ein. true auch, wenn schon vorher
 * bestätigt (idempotent — Doppelklick auf den Mail-Link ist ok).
 */
export async function wartelisteBestaetigen(token: string): Promise<boolean> {
  if (!z.uuid().safeParse(token).success) return false;

  const supabase = createAdminClient();

  const { data } = await supabase
    .from("warteliste")
    .update({ bestaetigt_am: new Date().toISOString() })
    .eq("token", token)
    .is("bestaetigt_am", null)
    .select("id");

  if (data?.length) return true;

  const { data: schonBestaetigt } = await supabase
    .from("warteliste")
    .select("id")
    .eq("token", token)
    .not("bestaetigt_am", "is", null)
    .maybeSingle();

  return Boolean(schonBestaetigt);
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: keine Fehler. (Der Admin-Client ist untypisiert — `token` kommt als `any`; falls TS meckert, `String(neu.token)` verwenden.)

- [ ] **Step 3: Commit**

```bash
git add lib/actions/warteliste.ts
git commit -m "feat: Server Actions Warteliste (Eintrag mit Throttle, Token-Bestätigung)"
```

---

### Task 5: Signup-Gate (`app/auth/actions.ts`)

**Files:**
- Modify: `app/auth/actions.ts` (Funktion `signup`, Zeilen 40–86)

- [ ] **Step 1: Imports ergänzen**

Am Dateianfang zu den bestehenden Imports:

```ts
import { createAdminClient } from "@/lib/supabase/admin";
import { normalisiereCode } from "@/lib/warteliste/logic";
```

- [ ] **Step 2: `signup` erweitern**

Die Funktion `signup` so umbauen (kompletter neuer Stand):

```ts
export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const consent = formData.get("consent") === "on";
  const inviteCode = normalisiereCode(String(formData.get("invite_code") ?? ""));

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }
  if (password.length < 8) {
    return { error: "Das Passwort muss mindestens 8 Zeichen haben." };
  }
  if (!consent) {
    return {
      error:
        "Bitte bestätige die AGB, die Datenschutzerklärung und deine Altersangabe.",
    };
  }
  if (!inviteCode) {
    return { error: "Bitte gib deinen Invite-Code ein." };
  }

  // Code atomar einlösen, BEVOR der Account entsteht. Bei vollem/inaktivem/
  // unbekanntem Code trifft das UPDATE keine Zeile -> kein `true`.
  const admin = createAdminClient();
  const { data: eingeloest, error: redeemError } = await admin.rpc(
    "redeem_invite_code",
    { p_code: inviteCode },
  );
  if (redeemError || eingeloest !== true) {
    return { error: "Dieser Invite-Code ist ungültig oder schon voll." };
  }

  const supabase = await createClient();
  const origin = getOrigin(await headers());

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/onboarding` },
  });

  if (error) {
    // Einlösung zurückrollen — kein verbrannter Code bei z.B. schon
    // existierender E-Mail.
    await admin.rpc("unredeem_invite_code", { p_code: inviteCode });
    return { error: error.message };
  }

  // Email-Bestätigung deaktiviert -> Session existiert sofort.
  // Nach /onboarding leiten: dort wird das anonym gesammelte Onboarding
  // aus dem localStorage in die DB geflusht (oder Fallback-Durchlauf).
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return {
    success:
      "Fast geschafft! Wir haben dir eine E-Mail geschickt — bestätige den Link, um loszulegen.",
  };
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: keine Fehler

- [ ] **Step 4: Commit**

```bash
git add app/auth/actions.ts
git commit -m "feat: Signup nur noch mit Invite-Code (atomare Einlösung + Rollback)"
```

---

### Task 6: Warteliste-Formular (`components/warteliste-form.tsx`)

**Files:**
- Create: `components/warteliste-form.tsx`

- [ ] **Step 1: Komponente schreiben**

```tsx
// components/warteliste-form.tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  wartelisteEintragen,
  type WartelisteState,
} from "@/lib/actions/warteliste";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function WartelisteForm() {
  const [state, formAction, isPending] = useActionState<
    WartelisteState,
    FormData
  >(wartelisteEintragen, null);

  if (state?.success) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-5 text-center">
        <p className="font-display text-lg font-bold text-success">
          Fast drauf!
        </p>
        <p className="mt-2 text-sm text-text-dim">{state.success}</p>
        <p className="mt-1 text-xs text-text-mute">
          Schau auch im Spam-Ordner nach.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="email"
          type="email"
          required
          placeholder="du@beispiel.de"
          aria-label="E-Mail für die Warteliste"
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isPending}
          className="font-display font-bold"
        >
          {isPending ? "Wird eingetragen…" : "Auf die Warteliste →"}
        </Button>
      </div>
      {state?.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <p className="text-xs leading-relaxed text-text-mute">
        Wir melden uns, sobald dein Invite-Code bereit ist.{" "}
        <Link href="/datenschutz" className="text-brand hover:underline">
          Datenschutz
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Typecheck + Lint**

Run: `npm run typecheck && npm run lint`
Expected: keine Fehler

- [ ] **Step 3: Commit**

```bash
git add components/warteliste-form.tsx
git commit -m "feat: Warteliste-Formular als wiederverwendbare Client-Komponente"
```

---

### Task 7: Landing + Signup-UI

**Files:**
- Modify: `app/page.tsx` (Beta-CTA-Karte, Zeilen 256–293)
- Modify: `components/auth/signup-form.tsx` (Code-Feld)
- Modify: `app/signup/page.tsx` („Noch keinen Code?"-Block)

**Wichtig:** Die `WartelisteForm` ist ein eigenes `<form>` — sie darf NIE innerhalb des Signup-`<form>` gerendert werden (verschachtelte Forms sind invalides HTML). Deshalb kommt sie in `app/signup/page.tsx` NACH `<SignupForm />`, nicht in die Form-Komponente.

- [ ] **Step 1: Landing — Beta-CTA-Karte zur Warteliste-Sektion umbauen**

In `app/page.tsx` Import ergänzen:

```tsx
import { WartelisteForm } from "@/components/warteliste-form";
```

Den Block `{/* ── BETA CTA ─── */}` (äußeres `div` mit `animationDelay: "620ms"`) ersetzen durch:

```tsx
      {/* ── WARTELISTE ────────────────────────────────────── */}
      <div id="warteliste" className="anim mt-16 w-full" style={{ animationDelay: "620ms" }}>
        <div
          className="relative overflow-hidden rounded-3xl border-2 p-8 text-center"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--brand) 8%, var(--surface-1)), color-mix(in srgb, var(--indigo) 6%, var(--surface-1)))",
            borderColor: "color-mix(in srgb, var(--brand) 30%, transparent)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(circle at 50% -20%, color-mix(in srgb, var(--brand) 15%, transparent), transparent 60%)",
            }}
          />
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
            Geschlossene Beta · Warteliste
          </div>
          <h2 className="font-display text-3xl font-extrabold leading-tight">
            Kein Invite?<br />Komm auf die Liste.
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-sm text-text-dim">
            Project X startet in geschlossener Beta. Trag dich ein — wir
            schicken dir deinen Invite-Code, sobald ein Platz frei ist.
          </p>
          <div className="mx-auto mt-7 max-w-sm text-left">
            <WartelisteForm />
          </div>
        </div>
      </div>
```

- [ ] **Step 2: Signup-Form — Invite-Code-Feld**

In `components/auth/signup-form.tsx`, im JSX von `SignupForm` VOR dem E-Mail-Feld (`<div className="flex flex-col gap-1.5">` mit `htmlFor="email"`) einfügen:

```tsx
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite_code">Invite-Code</Label>
        <Input
          id="invite_code"
          name="invite_code"
          type="text"
          autoComplete="off"
          placeholder="z. B. HOCHRAD26"
          className="font-mono uppercase tracking-widest"
          required
        />
      </div>
```

(Das `autoFocus` vom E-Mail-Feld auf das Code-Feld verschieben.)

- [ ] **Step 3: Signup-Seite — Auffangnetz für Leute ohne Code**

In `app/signup/page.tsx` Import ergänzen und nach `<SignupForm />` (innerhalb des `<div className="flex flex-col gap-4">`) einfügen:

```tsx
import { WartelisteForm } from "@/components/warteliste-form";
```

```tsx
        <div className="mt-2 border-t border-border pt-4">
          <p className="mb-3 text-xs leading-relaxed text-text-mute">
            Noch keinen Code? Trag dich auf die Warteliste ein — wir schicken
            dir einen, sobald ein Platz frei ist.
          </p>
          <WartelisteForm />
        </div>
```

- [ ] **Step 4: Typecheck + Lint**

Run: `npm run typecheck && npm run lint`
Expected: keine Fehler

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/auth/signup-form.tsx app/signup/page.tsx
git commit -m "feat: Warteliste-Sektion auf Landing + Invite-Code-Feld im Signup"
```

---

### Task 8: Bestätigungsseite + öffentliche Route

**Files:**
- Create: `app/warteliste/bestaetigen/page.tsx`
- Modify: `lib/supabase/proxy.ts` (isPublic-Block, Zeilen 41–64)

- [ ] **Step 1: Bestätigungsseite**

```tsx
// app/warteliste/bestaetigen/page.tsx
import Link from "next/link";
import { wartelisteBestaetigen } from "@/lib/actions/warteliste";
import { WartelisteForm } from "@/components/warteliste-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Warteliste bestätigen" };

export default async function WartelisteBestaetigenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await wartelisteBestaetigen(token) : false;

  return (
    <main className="relative z-[5] mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-5 py-16 text-center">
      {ok ? (
        <>
          <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
            Geschlossene Beta
          </div>
          <h1 className="font-display text-3xl font-extrabold leading-tight">
            Du bist auf der Liste ✓
          </h1>
          <p className="mt-3 max-w-xs text-sm text-text-dim">
            Wir schicken dir deinen Invite-Code, sobald ein Platz frei ist.
            Bis dahin kannst du den Notenrechner in der Demo ausprobieren.
          </p>
          <Button
            render={<Link href="/demo" />}
            className="mt-6 font-display font-extrabold"
          >
            Demo ansehen →
          </Button>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl font-extrabold leading-tight">
            Dieser Link ist ungültig.
          </h1>
          <p className="mt-3 max-w-xs text-sm text-text-dim">
            Vielleicht wurde er unvollständig kopiert. Trag dich einfach
            nochmal ein:
          </p>
          <div className="mt-6 w-full text-left">
            <WartelisteForm />
          </div>
        </>
      )}
    </main>
  );
}
```

- [ ] **Step 2: `/warteliste` als öffentliche Route**

In `lib/supabase/proxy.ts` im `isPublic`-Ausdruck nach dem Onboarding-Eintrag ergänzen:

```ts
    // Warteliste-Bestätigung: Link aus der Double-Opt-in-Mail, User ist nie eingeloggt
    path.startsWith("/warteliste") ||
```

- [ ] **Step 3: Typecheck + Lint**

Run: `npm run typecheck && npm run lint`
Expected: keine Fehler

- [ ] **Step 4: Commit — VORSICHT parallele Session**

Vorher: `git diff lib/supabase/proxy.ts` — enthält der Diff mehr als unsere zwei Zeilen, STOPPEN und Nepomuk fragen. Sonst:

```bash
git add app/warteliste/bestaetigen/page.tsx lib/supabase/proxy.ts
git commit -m "feat: Warteliste-Bestätigungsseite + öffentliche Route"
```

---

### Task 9: Datenschutz-Abschnitt

**Files:**
- Modify: `app/datenschutz/page.tsx`

- [ ] **Step 1: Abschnitt einfügen**

Die Seite besteht aus `<section>`-Blöcken mit `<h2 className="mb-3 font-display text-lg font-bold text-foreground">`. Nach dem Abschnitt, der den E-Mail-Versand/Resend behandelt (per Suche nach „Resend" finden; falls keiner existiert: als vorletzter Abschnitt), diese Section einfügen — **die `<p>`-Klassen an die Nachbar-Absätze der Datei angleichen**:

```tsx
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">
            Warteliste
          </h2>
          <p>
            Wenn du dich auf die Warteliste einträgst, speichern wir deine
            E-Mail-Adresse, den Bestätigungsstatus und den Zeitpunkt der
            Eintragung — sonst nichts. Wir nutzen diese Daten ausschließlich,
            um dich über den Start der geschlossenen Beta zu informieren und
            dir deinen Invite-Code zu schicken. Rechtsgrundlage ist deine
            Einwilligung per Bestätigungslink (Art. 6 Abs. 1 lit. a DSGVO).
            Der Versand läuft über unseren Auftragsverarbeiter Resend. Du
            kannst dich jederzeit per E-Mail an uns wieder austragen lassen —
            dann löschen wir deinen Eintrag vollständig.
          </p>
        </section>
```

- [ ] **Step 2: Typecheck + Lint**

Run: `npm run typecheck && npm run lint`
Expected: keine Fehler

- [ ] **Step 3: Commit**

```bash
git add app/datenschutz/page.tsx
git commit -m "docs: Datenschutz-Abschnitt zur Warteliste (Double-Opt-in, Resend)"
```

---

### Task 10: Verifikation + erster Invite-Code + Push

- [ ] **Step 1: Kompletter Check**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: alles grün. Bei Fehlern: fixen, nicht pushen.

- [ ] **Step 2: Ersten Invite-Code anlegen**

Via Supabase MCP `execute_sql` oder Dashboard:

```sql
insert into invite_code (code, max_nutzungen, kommentar)
values ('NEPOMUK-TEST', 5, 'Lokaler Test + Nepomuk selbst');
```

- [ ] **Step 3: Live-Durchklick (dev server)**

Run: `npm run dev` — dann manuell prüfen:

1. Landing `/` → Warteliste-Sektion sichtbar, E-Mail eintragen → Erfolgs-Card
2. Mail kommt an (echte eigene E-Mail nutzen) → Link klicken → „Du bist auf der Liste ✓"
3. Gleiche E-Mail nochmal eintragen → Erfolgs-Card, aber KEINE zweite Mail (Throttle; in Supabase `letzte_mail_am` prüfen)
4. `/signup` ohne Code absenden → Browser-Validation verhindert; mit Fantasie-Code → „ungültig oder schon voll"
5. Signup mit `NEPOMUK-TEST` (neue Test-E-Mail) → funktioniert; in Supabase: `genutzt` = 1
6. Signup mit `NEPOMUK-TEST` und BEREITS registrierter E-Mail → Fehler; `genutzt` bleibt (Rollback greift)
7. Ungültiger Token: `/warteliste/bestaetigen?token=quatsch` → Fehlerseite mit Formular

- [ ] **Step 4: Env-Check Vercel**

Prüfen, dass in Vercel gesetzt sind: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. (Service-Role wird schon von Cron-Jobs genutzt — sollte da sein.)

- [ ] **Step 5: Push**

```bash
git push origin main
```

CI beobachten (typecheck + lint + test). Danach Vercel-Deploy prüfen und den Flow einmal auf Production durchklicken.

- [ ] **Step 6: Roadmap-Sync**

Kein exakter Task in `docs/roadmap/state.js` für die Warteliste. `m06` („Beta-Tester-Liste: 20 Personen") wird durch die Warteliste unterstützt, ist aber erst erledigt, wenn 20 Leute drauf sind → state.js NICHT ändern, Nepomuk kurz darauf hinweisen.

---

## Bewusst NICHT im Scope

- Referral-System, Admin-UI für Codes, Token-Ablauf, DB-Level-Signup-Hardening (siehe Spec).
- Kein Eintrag in `lib/validation.ts` (parallele Session arbeitet daran).
- Kein Update von `lib/supabase/database.types.ts` — der Admin-Client ist untypisiert; Typen-Regeneration passiert beim nächsten regulären Schema-Sync.
