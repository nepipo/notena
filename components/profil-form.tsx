"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfil } from "@/lib/actions/schule";

export function ProfilForm({
  initialName,
  initialKlasse,
  initialSchule,
}: {
  initialName: string;
  initialKlasse: number | null;
  initialSchule: string;
}) {
  const [name, setName] = useState(initialName);
  const [klasse, setKlasse] = useState(initialKlasse ? String(initialKlasse) : "");
  const [schule, setSchule] = useState(initialSchule);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function speichern() {
    const klasseNum = klasse === "" ? null : Number(klasse);
    startTransition(async () => {
      const res = await updateProfil(name, klasseNum, schule);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Profil gespeichert.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Name"
          className="bg-surface-2"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="klasse">Klasse (5–13)</Label>
        <Input
          id="klasse"
          type="number"
          min={5}
          max={13}
          value={klasse}
          onChange={(e) => setKlasse(e.target.value)}
          placeholder="z. B. 11"
          className="bg-surface-2"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="schule">Schule</Label>
        <Input
          id="schule"
          value={schule}
          onChange={(e) => setSchule(e.target.value)}
          placeholder="Name deiner Schule"
          className="bg-surface-2"
        />
      </div>
      <Button onClick={speichern} disabled={pending} className="font-display font-bold">
        Speichern
      </Button>
    </div>
  );
}
