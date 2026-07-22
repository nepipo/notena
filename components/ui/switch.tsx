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
        "group relative h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full border outline-none backdrop-blur-[6px]",
        "transition-colors duration-200 ease-out",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-40",
        "active:scale-[0.92]",
        checked ? "border-white/10 bg-brand" : "border-white/12 bg-white/[0.08]",
        className,
      )}
      style={{
        boxShadow: checked
          ? "inset 0 1px 2px rgba(255,255,255,0.2), 0 1px 4px rgba(0,0,0,0.25)"
          : "inset 0 1.5px 3px rgba(0,0,0,0.45), inset 0 0 0 0.5px rgba(255,255,255,0.05)",
      }}
    >
      {/* Thumb — glasige Perle mit Highlight + Tiefe */}
      <span
        className={cn(
          "pointer-events-none absolute top-[3px] h-5 rounded-full",
          "transition-all",
          checked
            ? "left-[23px] w-5 group-active:left-[19px] group-active:w-6"
            : "left-[3px] w-5 group-active:w-6",
        )}
        style={{
          transitionDuration: "220ms",
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          background: "linear-gradient(150deg, #ffffff 0%, #d8d8dd 100%)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1.5px 2px rgba(0,0,0,0.12)",
        }}
      />
    </button>
  )
}
