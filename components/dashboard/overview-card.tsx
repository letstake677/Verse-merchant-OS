"use client"

import * as React from "react"
import { motion } from "motion/react"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface OverviewCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: {
    value: string
    isPositive?: boolean
    isNeutral?: boolean
    label?: string
  }
  badge?: string
  className?: string
}

export function OverviewCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = "text-indigo-600",
  iconBg = "bg-indigo-50 border-indigo-100",
  trend,
  badge,
  className,
}: OverviewCardProps) {
  return (
    <Card className={cn("border-slate-200/90 bg-white shadow-2xs hover:border-slate-300 transition-all", className)}>
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Header with Title and Icon */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">{title}</span>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", iconBg)}>
            <Icon className={cn("w-4 h-4", iconColor)} />
          </div>
        </div>

        {/* Value and Tabular Numbers */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-tabular">
              {value}
            </span>
            {badge && (
              <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 text-slate-500">
                {badge}
              </Badge>
            )}
          </div>

          {/* Subtext or Trend */}
          {trend ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "font-medium flex items-center gap-0.5",
                  trend.isPositive && "text-emerald-600",
                  trend.isNeutral && "text-slate-500",
                  !trend.isPositive && !trend.isNeutral && "text-rose-600"
                )}
              >
                {trend.isPositive && <TrendingUp className="w-3 h-3" />}
                {!trend.isPositive && !trend.isNeutral && <TrendingDown className="w-3 h-3" />}
                {trend.value}
              </span>
              {trend.label && <span className="text-slate-400 text-[11px]">{trend.label}</span>}
            </div>
          ) : subtext ? (
            <p className="text-[11px] text-slate-400">{subtext}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
