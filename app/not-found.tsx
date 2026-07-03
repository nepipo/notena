import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="animate-fade-up mx-5 w-full max-w-md rounded-3xl border border-border p-10 text-center"
        style={{ background: "var(--card-grad)" }}
      >
        <div className="font-mono text-6xl font-bold tracking-widest text-brand/25">
          404
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold">
          Seite nicht gefunden.
        </h1>
        <p className="mt-3 font-mono text-sm text-text-dim">
          Dieser Link existiert nicht oder wurde verschoben.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            render={<Link href="/dashboard" />}
            className="w-full font-display font-bold"
          >
            Zurück zum Dashboard
          </Button>
          <Link
            href="/"
            className="font-mono text-xs text-text-dim transition-colors hover:text-brand"
          >
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
