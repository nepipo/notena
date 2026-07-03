"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="animate-fade-up mx-5 w-full max-w-md rounded-3xl border border-border p-10 text-center"
        style={{ background: "var(--card-grad)" }}
      >
        <div className="font-mono text-sm font-semibold uppercase tracking-[0.25em] text-destructive">
          Fehler
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold">
          Etwas ist schiefgelaufen.
        </h1>
        <p className="mt-3 font-mono text-sm text-text-dim">
          Ein unerwarteter Fehler ist aufgetreten. Wir wurden benachrichtigt.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-left font-mono text-xs break-words text-destructive">
            {error.message}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={reset} className="w-full font-display font-bold">
            Nochmal versuchen
          </Button>
          <Button
            variant="outline"
            render={<Link href="/dashboard" />}
            className="w-full font-display font-bold"
          >
            Zum Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
