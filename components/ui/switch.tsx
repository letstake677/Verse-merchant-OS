import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  description?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, checked, disabled, onChange, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className="flex items-center justify-between gap-3 select-none">
        {(label || description) && (
          <div className="space-y-0.5">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  "text-sm font-medium text-slate-900 cursor-pointer block",
                  disabled && "cursor-not-allowed opacity-60"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-slate-500 font-normal leading-normal">{description}</p>
            )}
          </div>
        )}
        <div className="relative inline-flex items-center shrink-0">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "h-5 w-9 cursor-pointer rounded-full border-2 border-transparent bg-slate-200 transition-colors duration-200 ease-in-out peer-focus-visible:ring-2 peer-focus-visible:ring-slate-900 peer-focus-visible:ring-offset-2 peer-checked:bg-slate-900 relative block",
              disabled && "cursor-not-allowed opacity-50",
              className
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                checked ? "translate-x-4" : "translate-x-0"
              )}
            />
          </label>
        </div>
      </div>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
