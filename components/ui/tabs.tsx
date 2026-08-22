import * as React from "react"
import { cn } from "@/lib/utils"

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: "pill" | "line"
  className?: string
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "pill",
  className,
}: TabsProps) {
  if (variant === "line") {
    return (
      <div className={cn("border-b border-slate-200 overflow-x-auto", className)}>
        <nav className="flex space-x-6 min-w-max" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => !tab.disabled && onChange(tab.id)}
                disabled={tab.disabled}
                className={cn(
                  "flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                  isActive
                    ? "border-slate-900 text-slate-900 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-xs rounded-full font-medium",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-600 max-w-full overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40",
              isActive
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.2 text-[10px] rounded-full font-medium",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-700"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
