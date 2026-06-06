"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 text-center">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-destructive">
        Fehler
      </div>
      <h2 className="font-display text-2xl font-extrabold">
        Da ist etwas schiefgelaufen.
      </h2>
      <p className="max-w-sm font-mono text-sm text-text-dim">
        {error.message || "Unbekannter Fehler. Versuch es nochmal."}
      </p>
      <Button onClick={reset} className="font-display font-bold">
        Nochmal versuchen
      </Button>
    </div>
  );
}
