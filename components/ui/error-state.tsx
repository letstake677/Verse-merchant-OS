import * as React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this information. Please check your connection and try again.",
  onRetry,
  retryLabel = "Try Again",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-xl border border-rose-100 bg-rose-50/40",
        className
      )}
      {...props}
    >
      <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-3.5">
        <AlertCircle className="w-5 h-5" />
      </div>

      <h4 className="text-sm font-semibold text-slate-900 tracking-tight mb-1">
        {title}
      </h4>

      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
        {description}
      </p>

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="border-slate-300 text-slate-800 gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{retryLabel}</span>
        </Button>
      )}
    </div>
  )
}
