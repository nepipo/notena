import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

const ERROR_MESSAGES: Record<string, string> = {
  oauth: "Google-Login fehlgeschlagen. Bitte versuch es nochmal.",
  confirm: "Bestätigungslink ungültig oder abgelaufen.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <AuthShell
      title="Willkommen zurück."
      subtitle="Meld dich an, um zu deinem Cockpit zu kommen."
      footer={
        <>
          Noch kein Konto?{" "}
          <Link href="/signup" className="font-semibold text-brand hover:underline">
            Jetzt registrieren
          </Link>
        </>
      }
    >
      {errorMessage && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <div className="flex flex-col gap-4">
        <GoogleButton />
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-mute">oder</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <LoginForm />
      </div>
    </AuthShell>
  );
}
