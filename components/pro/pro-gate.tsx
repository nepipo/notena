import type { ReactNode } from "react";
import { UpgradePrompt } from "./upgrade-prompt";

/** Zeigt children nur, wenn pro===true; sonst den Upgrade-Prompt. */
export function ProGate({
  pro,
  feature,
  children,
}: {
  pro: boolean;
  feature: string;
  children: ReactNode;
}) {
  if (!pro) return <UpgradePrompt feature={feature} />;
  return <>{children}</>;
}
