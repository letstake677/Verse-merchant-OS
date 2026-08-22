import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950 border border-slate-900",
        secondary:
          "bg-white text-slate-900 border border-slate-200 shadow-xs hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100",
        verse:
          "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 border border-indigo-600",
        outline:
          "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
        destructive:
          "bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800 border border-rose-600",
        link:
          "text-indigo-600 underline-offset-4 hover:underline p-0 h-auto font-normal",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md gap-1.5",
        default: "h-9 px-4 py-2 text-sm",
        lg: "h-11 px-5 text-base rounded-lg gap-2.5",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-current" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
