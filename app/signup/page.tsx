import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      title="Leg los."
      subtitle="Erstell dein Konto — kostenlos, in 30 Sekunden."
      footer={
        <>
          Schon ein Konto?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Anmelden
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
