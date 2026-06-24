import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";

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
      <div className="flex flex-col gap-4">
        <GoogleButton />
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-mute">oder</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <SignupForm />
      </div>
    </AuthShell>
  );
}
