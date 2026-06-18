import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      title="Fast geschafft."
      subtitle="Sicher dir dein Konto, damit dein Setup gespeichert bleibt — kostenlos."
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
