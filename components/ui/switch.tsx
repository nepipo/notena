"use client"

import { cn } from "@/lib/utils"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({ checked, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 outline-none",
        "transition-[background-color,border-color,transform] duration-200",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.93] disabled:pointer-events-none disabled:opacity-50",
        checked ? "border-brand bg-brand" : "border-border bg-surface-3",
        className,
      )}
      style={{ transitionTimingFunction: "var(--ease-out)" }}
    >
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white",
          "transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
        style={{
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
          transitionTimingFunction: "var(--ease-spring)",
        }}
      />
    </button>
  )
}
