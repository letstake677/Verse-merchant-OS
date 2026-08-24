"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { InvoiceStatus } from "@/types/invoice"
import { InvoiceDetailActions } from "@/components/invoices/invoice-detail-actions"

interface InvoiceDetailHeaderProps {
  invoiceNumber: string
  status: InvoiceStatus
  onEdit?: () => void
  onCancelInvoice?: () => void
  onPayInvoice?: () => void
  onShowQR?: () => void
}

export function InvoiceDetailHeader({
  invoiceNumber,
  status,
  onEdit,
  onCancelInvoice,
  onPayInvoice,
  onShowQR,
}: InvoiceDetailHeaderProps) {
  const isEditable = status !== "paid" && status !== "cancelled"

  return (
    <div className="space-y-4" id="invoice-detail-header">
      {/* Back to Invoices navigation (hidden during print) */}
      <div className="print:hidden">
        <Link href="/dashboard/invoices">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 -ml-2.5 px-2.5 text-xs text-slate-600 hover:text-slate-900 gap-1.5 font-medium"
            id="back-to-invoices-link"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Invoices</span>
          </Button>
        </Link>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 print:border-slate-300">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 print:border-slate-300">
              Invoice
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900">
              {invoiceNumber}
            </h1>
            <StatusBadge status={status} size="default" />
          </div>
          <p className="text-xs text-slate-500 print:hidden">
            Invoice record stored in Verse Merchant OS
          </p>
        </div>

        {/* Read-only & Edit UX Actions (Pay, Show QR, Edit, Copy Link, Share, Print) */}
        <InvoiceDetailActions
          invoiceNumber={invoiceNumber}
          status={status}
          onEdit={onEdit}
          isEditable={isEditable}
          onCancelInvoice={onCancelInvoice}
          onPayInvoice={onPayInvoice}
          onShowQR={onShowQR}
        />
      </div>
    </div>
  )
}
