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
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onCheckedChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full outline-none",
        "transition-colors duration-200 ease-out",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-40",
        checked ? "bg-brand" : "bg-white/15",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-[3px] size-5 rounded-full bg-white",
          "transition-transform duration-200",
          checked ? "translate-x-[23px]" : "translate-x-[3px]",
        )}
        style={{
          boxShadow: "0 1px 4px rgba(0,0,0,0.35), 0 0 0 0.5px rgba(0,0,0,0.08)",
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
    </button>
  )
}
