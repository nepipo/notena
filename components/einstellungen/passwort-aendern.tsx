"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { changePassword, type AuthState } from "@/app/auth/actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PasswortAendern() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    changePassword,
    null,
  );
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pw-new">Neues Passwort</Label>
        <div className="relative">
          <Input
            id="pw-new"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Mind. 8 Zeichen"
            minLength={8}
            className="bg-surface-2 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-mute hover:text-foreground"
          >
            {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pw-confirm">Wiederholen</Label>
        <Input
          id="pw-confirm"
          name="confirm"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Nochmal eingeben"
          minLength={8}
          className="bg-surface-2"
          required
        />
      </div>

      {state?.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="font-display font-bold">
        {isPending ? "Wird gespeichert…" : "Passwort ändern"}
      </Button>
    </form>
  );
}
