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
      <Button render={<Link href="/pro" />} className="mt-4">
        Pro freischalten
      </Button>
    </div>
  );
}
