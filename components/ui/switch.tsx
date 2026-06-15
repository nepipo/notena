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
        "group relative h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full outline-none",
        "transition-colors duration-200 ease-out",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-40",
        "active:scale-[0.92]",
        checked ? "bg-brand" : "bg-white/15",
        className,
      )}
    >
      {/* Thumb — positioned with left, never translate (translate has no stable base without left:0) */}
      <span
        className={cn(
          "pointer-events-none absolute top-[3px] h-5 rounded-full bg-white",
          "transition-all",
          checked
            ? "left-[23px] w-5 group-active:left-[19px] group-active:w-6"
            : "left-[3px] w-5 group-active:w-6",
        )}
        style={{
          transitionDuration: "220ms",
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 1px 5px rgba(0,0,0,0.32), 0 0 0 0.5px rgba(0,0,0,0.08)",
        }}
      />
    </button>
  )
}
