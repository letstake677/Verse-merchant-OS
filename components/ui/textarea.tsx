import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  helperText?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-2xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 transition-colors",
            error
              ? "border-rose-500 focus-visible:ring-rose-500"
              : "border-slate-200 focus-visible:border-slate-900",
            className
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
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
Textarea.displayName = "Textarea"

export { Textarea }
