"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface InvoiceHeaderProps {
  onCreateInvoice?: () => void
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

export function InvoiceHeader({
  onCreateInvoice,
  onRefresh,
  isRefreshing,
  className,
}: InvoiceHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Invoices
          </h1>
          <Badge variant="outline" className="text-[10px] font-mono py-0 px-2 text-slate-500">
            Billing
          </Badge>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            MongoDB Live Sync
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Create, manage, and track payment requests for your customers in real time.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-1.5 text-xs font-medium h-9 px-3 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            title="Refresh latest invoice statuses from MongoDB"
          >
            <span className={`inline-block ${isRefreshing ? "animate-spin" : ""}`}>↻</span>
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </Button>
        )}
        <Link href="/dashboard/invoices/new">
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateInvoice}
            className="gap-1.5 text-xs font-semibold h-9 px-3.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
