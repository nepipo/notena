import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Passwort vergessen?"
      subtitle="Kein Problem. Wir schicken dir einen Link zum Zurücksetzen."
      footer={
        <>
          Wieder eingefallen?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Zurück zum Login
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
