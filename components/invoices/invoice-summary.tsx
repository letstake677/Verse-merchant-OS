"use client"

import * as React from "react"
import { Invoice } from "@/lib/invoices/types"
import { DollarSign, FileText, CheckCircle2, Clock } from "lucide-react"

interface InvoiceSummaryProps {
  invoices?: Invoice[]
  totalInvoices?: number
  draftCount?: number
  outstandingAmount?: string | number
  paidAmount?: string | number
}

export function InvoiceSummary({
  invoices,
  totalInvoices,
  draftCount,
  outstandingAmount,
  paidAmount,
}: InvoiceSummaryProps) {
  const safeInvoices = Array.isArray(invoices) ? invoices : []

  // If explicit metric props are passed (from dashboard/invoices), use them; otherwise calculate from invoices array
  const totalVolumeNum =
    outstandingAmount !== undefined && paidAmount !== undefined
      ? (typeof paidAmount === "string" ? parseFloat(paidAmount.replace(/[^0-9.-]+/g, "")) || 0 : Number(paidAmount) || 0) +
        (typeof outstandingAmount === "string" ? parseFloat(outstandingAmount.replace(/[^0-9.-]+/g, "")) || 0 : Number(outstandingAmount) || 0)
      : safeInvoices.reduce((acc, inv) => acc + (parseFloat(inv?.total || "0") || 0), 0)

  const paidVolumeDisplay =
    paidAmount !== undefined
      ? typeof paidAmount === "number"
        ? `$${paidAmount.toFixed(2)}`
        : paidAmount
      : `$${safeInvoices
          .filter((inv) => inv?.status === "paid" || inv?.status === "PAID")
          .reduce((acc, inv) => acc + (parseFloat(inv?.total || "0") || 0), 0)
          .toFixed(2)}`

  const pendingVolumeDisplay =
    outstandingAmount !== undefined
      ? typeof outstandingAmount === "number"
        ? `$${outstandingAmount.toFixed(2)}`
        : outstandingAmount
      : `$${safeInvoices
          .filter((inv) => inv?.status !== "paid" && inv?.status !== "PAID")
          .reduce((acc, inv) => acc + (parseFloat(inv?.total || "0") || 0), 0)
          .toFixed(2)}`

  const totalCount =
    totalInvoices !== undefined
      ? totalInvoices
      : safeInvoices.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Volume</div>
          <div className="text-xl font-bold text-slate-900 font-mono">
            ${typeof totalVolumeNum === "number" ? totalVolumeNum.toFixed(2) : totalVolumeNum}
          </div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Settled On-Chain</div>
          <div className="text-xl font-bold text-slate-900 font-mono">{paidVolumeDisplay}</div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pending Settlement</div>
          <div className="text-xl font-bold text-slate-900 font-mono">{pendingVolumeDisplay}</div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Invoices Issued</div>
          <div className="text-xl font-bold text-slate-900 font-mono">{totalCount}</div>
        </div>
      </div>
    </div>
  )
}
