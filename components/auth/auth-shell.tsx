import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative z-[5] flex min-h-screen flex-col items-center justify-center px-5 py-10">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 size-[500px] rounded-full opacity-[0.10] blur-[80px]"
          style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-[-100px] size-[300px] rounded-full opacity-[0.06] blur-[80px]"
          style={{ background: "radial-gradient(circle, var(--indigo) 0%, transparent 70%)" }}
        />
      </div>

      <div className="animate-fade-up w-full max-w-[400px]">
        {/* Logo / Eyebrow */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-brand"
        >
          <span className="inline-block size-1.5 rounded-full bg-brand" />
          Project X
        </Link>

        <div
          className="rounded-3xl border border-border p-7 sm:p-8"
          style={{ background: "var(--card-grad)" }}
        >
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-text-dim">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-text-dim">{footer}</div>
        )}

        <div className="mt-8 flex items-center justify-center gap-5 font-mono text-[11px] text-text-mute">
          <Link href="/impressum" className="hover:text-text-dim transition-colors">
            Impressum
          </Link>
          <span className="text-border">·</span>
          <Link href="/datenschutz" className="hover:text-text-dim transition-colors">
            Datenschutz
          </Link>
        </div>
      </div>
    </main>
  );
}
