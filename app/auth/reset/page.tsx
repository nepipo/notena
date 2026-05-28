import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Neues Passwort"
      subtitle="Wähl ein neues Passwort für dein Konto."
      footer={null}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
