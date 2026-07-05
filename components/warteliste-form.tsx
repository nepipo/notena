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
