import * as React from "react"
import { CheckCircle2, Clock, AlertCircle, XCircle, RefreshCw, FileText, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type PaymentOrInvoiceStatus =
  | "paid"
  | "confirmed"
  | "submitted"
  | "confirming"
  | "pending"
  | "verifying"
  | "open"
  | "overdue"
  | "failed"
  | "underpaid"
  | "overpaid"
  | "cancelled"
  | "draft"

interface StatusConfig {
  label: string
  icon: LucideIcon
  iconSpin?: boolean
  className: string
  dotClassName?: string
}

const statusConfigs: Record<PaymentOrInvoiceStatus, StatusConfig> = {
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dotClassName: "bg-emerald-500",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dotClassName: "bg-emerald-500",
  },
  submitted: {
    label: "Submitted",
    icon: RefreshCw,
    iconSpin: true,
    className: "bg-blue-50 text-blue-700 border-blue-200/80",
    dotClassName: "bg-blue-500",
  },
  confirming: {
    label: "Confirming",
    icon: RefreshCw,
    iconSpin: true,
    className: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    dotClassName: "bg-indigo-500",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200/80",
    dotClassName: "bg-amber-500",
  },
  open: {
    label: "Open",
    icon: Clock,
    className: "bg-blue-50 text-blue-700 border-blue-200/80",
    dotClassName: "bg-blue-500",
  },
  verifying: {
    label: "Verifying",
    icon: RefreshCw,
    iconSpin: true,
    className: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    dotClassName: "bg-indigo-500",
  },
  overdue: {
    label: "Overdue",
    icon: AlertCircle,
    className: "bg-orange-50 text-orange-700 border-orange-200/80",
    dotClassName: "bg-orange-500",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-rose-50 text-rose-700 border-rose-200/80",
    dotClassName: "bg-rose-500",
  },
  underpaid: {
    label: "Underpaid",
    icon: AlertCircle,
    className: "bg-amber-50 text-amber-800 border-amber-300",
    dotClassName: "bg-amber-600",
  },
  overpaid: {
    label: "Overpaid",
    icon: CheckCircle2,
    className: "bg-blue-50 text-blue-800 border-blue-300",
    dotClassName: "bg-blue-600",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dotClassName: "bg-slate-400",
  },
  draft: {
    label: "Draft",
    icon: FileText,
    className: "bg-slate-100 text-slate-700 border-slate-200",
    dotClassName: "bg-slate-500",
  },
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: PaymentOrInvoiceStatus
  showIcon?: boolean
  showDot?: boolean
  size?: "sm" | "default"
}

export function StatusBadge({
  status,
  showIcon = true,
  showDot = false,
  size = "default",
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfigs[status] || statusConfigs.pending
  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors select-none",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.className,
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            config.dotClassName,
            config.iconSpin && "animate-pulse"
          )}
        />
      )}
      {showIcon && (
        <Icon
          className={cn(
            size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5",
            "shrink-0",
            config.iconSpin && "animate-spin"
          )}
        />
      )}
      <span>{config.label}</span>
    </span>
  )
}
