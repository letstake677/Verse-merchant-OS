"use client"

import * as React from "react"
import { Invoice } from "@/lib/invoices/types"
import { DollarSign, FileText, CheckCircle2, Clock, Zap } from "lucide-react"

export function InvoiceSummary({ invoices }: { invoices: Invoice[] }) {
  const totalVolume = invoices.reduce((acc, inv) => acc + parseFloat(inv.total || "0"), 0)
  const paidVolume = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + parseFloat(inv.total || "0"), 0)
  const pendingVolume = invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((acc, inv) => acc + parseFloat(inv.total || "0"), 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Volume</div>
          <div className="text-xl font-bold text-slate-900 font-mono">${totalVolume.toFixed(2)}</div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Settled On-Chain</div>
          <div className="text-xl font-bold text-slate-900 font-mono">${paidVolume.toFixed(2)}</div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pending Settlement</div>
          <div className="text-xl font-bold text-slate-900 font-mono">${pendingVolume.toFixed(2)}</div>
        </div>
      </div>

      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Invoices Issued</div>
          <div className="text-xl font-bold text-slate-900 font-mono">{invoices.length}</div>
        </div>
      </div>
    </div>
  )
}
