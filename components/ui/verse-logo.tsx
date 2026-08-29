import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export interface VerseLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  variant?: "icon" | "full" | "badge"
  showText?: boolean
  className?: string
  priority?: boolean
  subtitle?: string
}

const sizeMap = {
  xs: { width: 24, height: 24, class: "w-6 h-6" },
  sm: { width: 32, height: 32, class: "w-8 h-8" },
  md: { width: 40, height: 40, class: "w-10 h-10" },
  lg: { width: 48, height: 48, class: "w-12 h-12" },
  xl: { width: 64, height: 64, class: "w-16 h-16" },
  "2xl": { width: 96, height: 96, class: "w-24 h-24" },
}

export function VerseLogo({
  size = "sm",
  variant = "full",
  showText = true,
  className,
  priority = false,
  subtitle,
}: VerseLogoProps) {
  const currentSize = sizeMap[size] || sizeMap.sm

  if (variant === "icon") {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-900/10",
          currentSize.class,
          className
        )}
      >
        <Image
          src="/verse-logo.png"
          alt="Verse Merchant OS Logo"
          width={currentSize.width}
          height={currentSize.height}
          priority={priority}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }

  if (variant === "badge") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-3 p-1.5 pr-4 rounded-full bg-slate-900 text-white shadow-md border border-slate-800",
          className
        )}
      >
        <div className={cn("relative rounded-full overflow-hidden shrink-0", currentSize.class)}>
          <Image
            src="/verse-logo.png"
            alt="Verse Merchant OS"
            width={currentSize.width}
            height={currentSize.height}
            priority={priority}
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold tracking-tight text-white leading-none">
            VERSE
          </span>
          <span className="text-[10px] font-medium text-purple-300 uppercase tracking-wider leading-tight">
            {subtitle || "Merchant OS"}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <div
        className={cn(
          "relative rounded-full overflow-hidden shrink-0 shadow-xs ring-1 ring-slate-900/15 bg-slate-950",
          currentSize.class
        )}
      >
        <Image
          src="/verse-logo.png"
          alt="Verse Merchant OS Logo"
          width={currentSize.width}
          height={currentSize.height}
          priority={priority}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base leading-none">
              VERSE
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide">
              OS
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 tracking-tight leading-tight mt-0.5">
            {subtitle || "Merchant Portal"}
          </span>
        </div>
      )}
    </div>
  )
}
