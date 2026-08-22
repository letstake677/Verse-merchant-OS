import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  helperText?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, helperText, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <div className="relative">
          <select
            className={cn(
              "flex h-9 w-full appearance-none rounded-lg border bg-white px-3 py-1 pr-8 text-sm text-slate-900 shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
              error
                ? "border-rose-500 focus-visible:ring-rose-500"
                : "border-slate-200 focus-visible:border-slate-900",
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {helperText && (
          <p
            className={cn(
              "text-xs leading-none",
              error ? "text-rose-600" : "text-slate-500"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
