import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  badge?: React.ReactNode
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  badge,
  primaryAction,
  secondaryAction,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200/80 mb-6",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </div>
  )
}
