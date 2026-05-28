import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

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
      <LoginForm />
    </AuthShell>
  );
}
