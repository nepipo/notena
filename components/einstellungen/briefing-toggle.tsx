"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setBriefingAktiv } from "@/lib/actions/schule";
import { Switch } from "@/components/ui/switch";

export function BriefingToggle({ initial }: { initial: boolean }) {
  const [aktiv, setAktiv] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !aktiv;
    setAktiv(next);
    startTransition(async () => {
      const res = await setBriefingAktiv(next);
      if (!res.ok) {
        setAktiv(!next);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold">
          {aktiv ? "Briefing aktiv" : "Briefing deaktiviert"}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-text-mute">
          {aktiv
            ? "Täglich ein KI-Text oben im Dashboard."
            : "Die Briefing-Karte wird ausgeblendet."}
        </p>
      </div>
      <Switch checked={aktiv} onCheckedChange={toggle} disabled={isPending} />
    </div>
  );
}
