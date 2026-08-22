"use client"

import * as React from "react"
import { Coins, CheckCircle2, Clock, XCircle } from "lucide-react"
import { OverviewCard } from "@/components/dashboard/overview-card"

interface PaymentSummaryProps {
  totalAmount?: string
  totalCount?: number
  successfulCount?: number
  pendingCount?: number
  failedCount?: number
  underpaidCount?: number
  overpaidCount?: number
  className?: string
}

export function PaymentSummary({
  totalAmount = "$0.00",
  totalCount = 0,
  successfulCount = 0,
  pendingCount = 0,
  failedCount = 0,
  underpaidCount = 0,
  overpaidCount = 0,
  className,
}: PaymentSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <OverviewCard
        title="Total Settled Volume"
        value={totalAmount}
        subtext={totalCount === 0 ? "No payments recorded" : `${totalCount} total payment intents`}
        icon={Coins}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50 border-indigo-100"
      />

      <OverviewCard
        title="Confirmed Settlements"
        value={successfulCount.toString()}
        subtext={overpaidCount > 0 ? `${successfulCount} settled (${overpaidCount} overpaid)` : "Verified on-chain"}
        icon={CheckCircle2}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50 border-emerald-100"
      />

      <OverviewCard
        title="Pending & Submitted"
        value={pendingCount.toString()}
        subtext={pendingCount === 0 ? "No pending payments" : "Awaiting block confirmation"}
        icon={Clock}
        iconColor="text-amber-600"
        iconBg="bg-amber-50 border-amber-100"
      />

      <OverviewCard
        title="Failed & Underpaid"
        value={(failedCount + underpaidCount).toString()}
        subtext={underpaidCount > 0 ? `${failedCount} failed • ${underpaidCount} underpaid` : "Reverted or expired"}
        icon={XCircle}
        iconColor="text-rose-600"
        iconBg="bg-rose-50 border-rose-100"
      />
    </div>
  )
}
