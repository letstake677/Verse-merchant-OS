import * as React from "react"
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: string
    isPositive?: boolean
    isNeutral?: boolean
    label?: string
  }
  icon?: LucideIcon
  badge?: string
}

export function StatCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  badge,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-200 hover:border-slate-300/80 hover:shadow-xs",
        className
      )}
      {...props}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          {badge && (
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              {badge}
            </span>
          )}
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 font-tabular">
            {value}
          </div>
        </div>

        {(trend || description) && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs">
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center font-medium gap-0.5",
                  trend.isNeutral
                    ? "text-slate-500"
                    : trend.isPositive
                    ? "text-emerald-600"
                    : "text-rose-600"
                )}
              >
                {trend.isNeutral ? (
                  <Minus className="w-3.5 h-3.5" />
                ) : trend.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                {trend.value}
              </span>
            )}
            <span className="text-slate-500 font-normal">
              {trend?.label || description}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
