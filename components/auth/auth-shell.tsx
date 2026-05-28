import Link from "next/link";

/**
 * Zentriertes, gebrandetes Layout für Login/Signup im blauen Theme.
 */
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
      </div>
    </main>
  );
}
