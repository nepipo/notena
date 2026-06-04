"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function DeleteAccountButton({
  deleteAction,
}: {
  deleteAction: () => Promise<{ error?: string }>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteAction();
      if (res?.error) {
        toast.error(res.error);
        setConfirming(false);
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="destructive"
        className="mt-3"
        onClick={() => setConfirming(true)}
      >
        Konto löschen
      </Button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-semibold text-destructive">
        Bist du sicher? Alle deine Daten werden gelöscht.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={handleDelete}
        >
          {pending ? "Wird gelöscht…" : "Ja, Konto löschen"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="border-border bg-surface-2 hover:bg-surface-3"
          onClick={() => setConfirming(false)}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
