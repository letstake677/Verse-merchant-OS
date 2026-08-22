import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  description?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, checked, disabled, onChange, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id || generatedId

    return (
      <div className="flex items-start space-x-2.5 select-none">
        <div className="relative flex items-center h-5">
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
              "h-4.5 w-4.5 shrink-0 rounded border border-slate-300 bg-white shadow-2xs transition-all duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-slate-900 peer-focus-visible:ring-offset-1 peer-checked:bg-slate-900 peer-checked:border-slate-900 peer-checked:text-white flex items-center justify-center cursor-pointer",
              disabled && "cursor-not-allowed opacity-50 bg-slate-50",
              className
            )}
          >
            {checked && <Check className="h-3 w-3 stroke-[3]" />}
          </label>
        </div>
        {(label || description) && (
          <div className="text-xs leading-none pt-0.5 space-y-1">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  "font-medium text-slate-900 cursor-pointer block",
                  disabled && "cursor-not-allowed opacity-60"
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-slate-500 font-normal leading-relaxed">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
