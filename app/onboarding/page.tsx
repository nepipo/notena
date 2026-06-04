"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeOnboarding } from "@/lib/actions/schule";

type Modus = "punkte" | "note";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [eingabeModus, setEingabeModus] = useState<Modus>("punkte");
  const [, startTransition] = useTransition();
  const router = useRouter();

  function finish() {
    startTransition(async () => {
      const res = await completeOnboarding(eingabeModus);
      if (!res.ok) {
        toast.error(`Fehler: ${res.error}`);
      } else {
        router.push("/dashboard");
      }
    });
  }

  return (
    <main className="relative z-[5] flex min-h-screen flex-col items-center justify-center px-5 py-12">
      {/* Progress dots */}
      <div className="mb-10 flex gap-2">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`size-2 rounded-full transition-colors ${
              step >= s ? "bg-brand" : "bg-surface-3"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="w-full max-w-md animate-fade-up text-center">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Schritt 1 von 2
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Wie möchtest du Noten eingeben?
          </h1>
          <p className="mt-3 text-sm text-text-dim">
            Du kannst das jederzeit in den Einstellungen ändern.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {(["punkte", "note"] as Modus[]).map((m) => (
              <button
                key={m}
                onClick={() => setEingabeModus(m)}
                className={`rounded-2xl border p-5 text-left transition-all ${
                  eingabeModus === m
                    ? "border-brand bg-brand/10"
                    : "border-border bg-surface-2 hover:bg-surface-3"
                }`}
              >
                <div className="font-display font-extrabold">
                  {m === "punkte" ? "Punkte (0–15)" : "Noten (1+ bis 6)"}
                </div>
                <div className="mt-1 font-mono text-sm text-text-dim">
                  {m === "punkte"
                    ? "Das Oberstufen-System — du gibst 0 bis 15 Punkte ein."
                    : "Klassische Schulnoten — du gibst 1+, 2, 3− usw. ein."}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="mt-6 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90"
          >
            Weiter →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-md animate-fade-up text-center">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.25em] text-brand">
            Schritt 2 von 2
          </div>
          <div className="text-6xl">🎯</div>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">
            Dein erster Schnitt wartet.
          </h1>
          <p className="mt-3 text-sm text-text-dim">
            Leg Fächer an, trag Noten ein — der Schnitt rechnet sich live. Kein
            Abo, kein Bullshit.
          </p>

          <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4 text-left">
            <div className="font-mono text-[10px] uppercase tracking-[.15em] text-text-mute">
              Deine Einstellung
            </div>
            <div className="mt-1 font-display font-bold">
              Eingabe: {eingabeModus === "punkte" ? "Punkte (0–15)" : "Noten"}
            </div>
          </div>

          <button
            onClick={finish}
            className="mt-6 w-full rounded-2xl bg-brand px-6 py-4 font-display font-extrabold text-black transition-opacity hover:opacity-90"
          >
            Los geht&apos;s →
          </button>
          <button
            onClick={() => setStep(1)}
            className="mt-3 font-mono text-sm text-text-mute hover:text-text-dim"
          >
            ← Zurück
          </button>
        </div>
      )}
    </main>
  );
}
