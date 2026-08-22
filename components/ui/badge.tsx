import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border select-none",
  {
    variants: {
      variant: {
        default:
          "border-slate-200 bg-slate-100 text-slate-800",
        secondary:
          "border-slate-200 bg-white text-slate-700 shadow-2xs",
        outline:
          "border-slate-300 text-slate-700 bg-transparent",
        verse:
          "border-indigo-200 bg-indigo-50 text-indigo-700",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
