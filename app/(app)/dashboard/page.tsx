export default function DashboardPage() {
  return (
    <main className="relative z-[5] mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
      <header className="animate-fade-up mb-8">
        <div className="mb-1.5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          Übersicht
        </div>
        <h1 className="text-4xl font-extrabold leading-none sm:text-5xl">Dein Cockpit.</h1>
      </header>
      <p className="font-mono text-sm text-text-mute">Widgets kommen in Task 4.</p>
    </main>
  );
}
