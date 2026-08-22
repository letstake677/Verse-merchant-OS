"use client"

import * as React from "react"
import { FileText, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import { OverviewCard } from "@/components/dashboard/overview-card"

interface InvoiceSummaryProps {
  totalInvoices?: number
  draftCount?: number
  outstandingAmount?: string
  paidAmount?: string
  className?: string
}

export function InvoiceSummary({
  totalInvoices = 0,
  draftCount = 0,
  outstandingAmount = "$0.00",
  paidAmount = "$0.00",
  className,
}: InvoiceSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <OverviewCard
        title="Total Invoices"
        value={totalInvoices.toString()}
        subtext={totalInvoices === 0 ? "No invoices created" : `${totalInvoices} total issued`}
        icon={FileText}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50 border-indigo-100"
        trend={{
          value: `${totalInvoices} invoices`,
          isNeutral: true,
          label: totalInvoices === 0 ? "awaiting creation" : "recorded",
        }}
      />

      <OverviewCard
        title="Draft"
        value={draftCount.toString()}
        subtext={draftCount === 0 ? "No draft invoices" : "Unsent drafts"}
        icon={FileText}
        iconColor="text-slate-600"
        iconBg="bg-slate-50 border-slate-200"
        trend={{
          value: `${draftCount} drafts`,
          isNeutral: true,
          label: "in progress",
        }}
      />

      <OverviewCard
        title="Outstanding"
        value={outstandingAmount}
        subtext={outstandingAmount === "$0.00" ? "No open balances" : "Awaiting customer payment"}
        icon={Clock}
        iconColor="text-amber-600"
        iconBg="bg-amber-50 border-amber-100"
        trend={{
          value: "$0.00 pending",
          isNeutral: true,
        }}
      />

      <OverviewCard
        title="Paid"
        value={paidAmount}
        subtext={paidAmount === "$0.00" ? "No settled invoices" : "Settled via Verse"}
        icon={CheckCircle2}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50 border-emerald-100"
        trend={{
          value: "$0.00 settled",
          isNeutral: true,
          label: "on-chain",
        }}
      />
    </div>
  )
}
