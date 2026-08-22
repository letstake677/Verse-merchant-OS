import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  helperText?: string
  startIcon?: React.ReactNode
  endIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, startIcon, endIcon, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        <div className="relative flex items-center w-full">
          {startIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
              {startIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-9 w-full rounded-lg border bg-white px-3 py-1 text-sm text-slate-900 shadow-2xs transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
              startIcon && "pl-9",
              endIcon && "pr-9",
              error
                ? "border-rose-500 focus-visible:ring-rose-500"
                : "border-slate-200 focus-visible:border-slate-900",
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {endIcon}
            </div>
          )}
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
Input.displayName = "Input"

export { Input }
