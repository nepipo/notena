"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Zeigt die Pflicht-Checkbox (§-Absicherung) und aktiviert erst dann den
 * zahlungspflichtigen Button, der zur LemonSqueezy-Checkout-URL führt.
 * Ohne href ist der Link nicht navigierbar — zusätzlich visuell deaktiviert.
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
      <Button
        render={<a href={ok ? url : undefined} aria-disabled={!ok} />}
        className={cn("w-full", !ok && "pointer-events-none opacity-50")}
      >
        {label}
      </Button>
    </div>
  );
}
