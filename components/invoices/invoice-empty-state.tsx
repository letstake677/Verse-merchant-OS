"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Plus, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

interface InvoiceEmptyStateProps {
  onCreateInvoice?: () => void
  onLearnMore?: () => void
  className?: string
}

export function InvoiceEmptyState({
  onCreateInvoice,
  onLearnMore,
  className,
}: InvoiceEmptyStateProps) {
  const { toast } = useToast()

  const handleLearn = () => {
    if (onLearnMore) {
      onLearnMore()
    } else {
      toast({
        title: "How Verse Invoices Work",
        description:
          "Invoices allow you to itemize deliverables, specify due dates, and generate a shareable checkout link for your customer.",
        type: "info",
      })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 mb-4">
        <FileText className="w-6 h-6 text-indigo-600" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
        No invoices yet
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        Create your first invoice to request a payment from a customer.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link href="/dashboard/invoices/new" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={onCreateInvoice}
            className="gap-1.5 text-xs font-semibold h-9 px-4 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLearn}
          className="gap-1.5 text-xs font-medium h-9 px-4 w-full sm:w-auto text-slate-600 hover:text-slate-900"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Learn how invoices work</span>
        </Button>
      </div>
    </div>
  )
}
