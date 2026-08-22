import * as React from "react"
import { LucideIcon, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionVariant?: "primary" | "secondary" | "verse"
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = "primary",
  secondaryActionLabel,
  onSecondaryAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white/50",
        className
      )}
      {...props}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-500 mb-4">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button variant={actionVariant} size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
