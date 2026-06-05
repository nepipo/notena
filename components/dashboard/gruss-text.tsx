"use client";

function getGreeting(name: string | null): string {
  const h = new Date().getHours();
  const first = name?.trim().split(" ")[0] ?? "du";
  if (h >= 5 && h < 12) return `Guten Morgen, ${first}.`;
  if (h >= 18) return `Guten Abend, ${first}.`;
  return `Hallo, ${first}.`;
}

export function GrussText({ name }: { name: string | null }) {
  return <>{getGreeting(name)}</>;
}
