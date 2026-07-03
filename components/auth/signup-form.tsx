"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { signup, resendConfirmationEmail, type AuthState } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const RESEND_COOLDOWN = 20;

function EmailSentScreen({ email }: { email: string }) {
  const [resendState, resendAction, isResending] = useActionState<AuthState, FormData>(
    resendConfirmationEmail,
    null,
  );
  // Countdown als Deadline-Timestamp statt Tick-State — der Reset passiert
  // im Form-Action-Handler, nicht im Render oder Effect (React-Compiler-Regeln).
  const [deadline, setDeadline] = useState(() => Date.now() + RESEND_COOLDOWN * 1000);
  const [now, setNow] = useState(() => Date.now());

  const countdown = Math.max(0, Math.ceil((deadline - now) / 1000));
  const abgelaufen = countdown === 0;

  useEffect(() => {
    if (abgelaufen) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [abgelaufen, deadline]);

  const canResend = countdown === 0 && !isResending;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-success/30 bg-success/10 p-5 text-center">
        <p className="font-display text-lg font-bold text-success">Check deine Mails!</p>
        <p className="mt-2 text-sm text-text-dim">
          Wir haben einen Link an <span className="font-medium text-foreground">{email}</span> geschickt.
          Bestätige ihn, um loszulegen.
        </p>
        <p className="mt-1 text-xs text-text-mute">Schau auch im Spam-Ordner nach.</p>
      </div>

      <form
        action={(formData: FormData) => {
          // Cooldown startet direkt beim Absenden — verhindert Spam auch bei Fehlern
          setDeadline(Date.now() + RESEND_COOLDOWN * 1000);
          resendAction(formData);
        }}
      >
        <input type="hidden" name="email" value={email} />
        <Button
          type="submit"
          variant="outline"
          disabled={!canResend}
          className="w-full gap-2"
        >
          <RefreshCw className="size-4" />
          {isResending
            ? "Wird gesendet…"
            : countdown > 0
            ? `Erneut senden (${countdown}s)`
            : "Erneut senden"}
        </Button>
      </form>

      {resendState?.success && (
        <p className="text-center text-sm text-success">{resendState.success}</p>
      )}
      {resendState?.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
          {resendState.error}
        </p>
      )}
    </div>
  );
}

export function SignupForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    async (prevState: AuthState, formData: FormData) => {
      const result = await signup(prevState, formData);
      if (result?.success) {
        setSubmittedEmail(String(formData.get("email") ?? "").trim());
      }
      return result;
    },
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  if (state?.success && submittedEmail) {
    return <EmailSentScreen email={submittedEmail} />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-Mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="du@beispiel.de"
          autoFocus
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Passwort</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Mind. 8 Zeichen"
            minLength={8}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-mute transition-colors hover:text-foreground"
            tabIndex={-1}
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-start gap-2.5">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-border accent-brand"
        />
        <Label htmlFor="consent" className="cursor-pointer text-xs leading-relaxed text-text-dim">
          Ich habe die{" "}
          <Link href="/agb" target="_blank" className="text-brand hover:underline">
            AGB
          </Link>{" "}
          und{" "}
          <Link href="/datenschutz" target="_blank" className="text-brand hover:underline">
            Datenschutzerklärung
          </Link>{" "}
          gelesen und stimme ihnen zu. Ich bestätige, dass ich mindestens 16 Jahre alt
          bin oder die Einwilligung meiner Erziehungsberechtigten vorliegt.
        </Label>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full font-display font-bold"
      >
        {isPending ? "Konto wird erstellt…" : "Konto erstellen"}
      </Button>
    </form>
  );
}
