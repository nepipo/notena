import Link from "next/link";
import { Button } from "@/components/ui/button";
import { INTERVALL_LABEL, type PlanIntervall } from "@/lib/pro/plan";

function datum(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
      <>
        <p className="text-sm text-text-dim">
          Du nutzt aktuell die Gratis-Version.
        </p>
        <Button render={<Link href="/pro" />} className="mt-3">
          Pro freischalten
        </Button>
      </>
    );
  }

  const intervallLabel = intervall
    ? INTERVALL_LABEL[intervall as PlanIntervall]
    : "";
  const portal = process.env.LEMONSQUEEZY_CUSTOMER_PORTAL_URL;

  return (
    <>
      <p className="text-sm">
        <span className="font-semibold text-foreground">Pro</span>
        {intervallLabel ? ` · ${intervallLabel}` : ""}
        {status === "trial"
          ? " · Trial"
          : status === "cancelled"
            ? " · gekündigt"
            : ""}
      </p>
      <p className="mt-1 text-xs text-text-dim">
        {status === "cancelled"
          ? `Läuft noch bis ${datum(bis)}.`
          : status === "trial"
            ? `Trial endet am ${datum(bis)}, danach kostenpflichtig.`
            : `Verlängert sich am ${datum(bis)}.`}
      </p>
      {portal && (
        <Button
          render={
            <a href={portal} target="_blank" rel="noopener noreferrer" />
          }
          variant="outline"
          className="mt-3"
        >
          Abo verwalten / kündigen
        </Button>
      )}
    </>
  );
}
