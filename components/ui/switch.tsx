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
        "relative h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full outline-none",
        "transition-[background-color,box-shadow] duration-[250ms]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.93] disabled:pointer-events-none disabled:opacity-40",
        checked
          ? "bg-brand"
          : "bg-white/10",
        className,
      )}
      style={{
        transitionTimingFunction: "var(--ease-out)",
        boxShadow: checked
          ? "0 0 0 0px color-mix(in srgb, var(--color-brand) 40%, transparent), inset 0 1px 2px rgba(0,0,0,0.15)"
          : "inset 0 1px 2px rgba(0,0,0,0.2)",
      }}
    >
      <span
        className={cn(
          "absolute top-[3px] size-5 rounded-full",
          "transition-transform duration-[250ms]",
          checked ? "translate-x-[23px]" : "translate-x-[3px]",
        )}
        style={{
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3), 0 1px 8px rgba(0,0,0,0.15)",
          transitionTimingFunction: "var(--ease-spring)",
        }}
      />
    </button>
  )
}
