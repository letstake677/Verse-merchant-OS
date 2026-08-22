"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface InvoiceHeaderProps {
  onCreateInvoice?: () => void
  className?: string
}

export function InvoiceHeader({
  onCreateInvoice,
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
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Create, manage, and track payment requests for your customers.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <Link href="/dashboard/invoices/new">
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateInvoice}
            className="gap-1.5 text-xs font-semibold h-9 px-3.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
