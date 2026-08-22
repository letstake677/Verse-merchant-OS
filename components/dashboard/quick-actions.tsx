"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, FileText, Link2, QrCode, ArrowRight, Sparkles, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

interface QuickActionsProps {
  onCreatePayment?: () => void
  onCreateInvoice?: () => void
  onCreateLink?: () => void
  className?: string
}

export function QuickActions({
  onCreatePayment,
  onCreateInvoice,
  onCreateLink,
  className,
}: QuickActionsProps) {
  const { toast } = useToast()

  const handlePayment = () => {
    if (onCreatePayment) {
      onCreatePayment()
    } else {
      toast({
        title: "Create Payment Request",
        description: "Payment creation workflow is structured for Phase 4B.",
        type: "info",
      })
    }
  }

  const handleLink = () => {
    if (onCreateLink) {
      onCreateLink()
    } else {
      toast({
        title: "Create Payment Link",
        description: "Shareable payment link generator will be enabled in Phase 11.",
        type: "info",
      })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Primary CTA */}
      <Button
        variant="primary"
        size="sm"
        onClick={handlePayment}
        className="h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Create Payment</span>
      </Button>

      {/* Secondary Quick Action 1: Create Invoice */}
      {onCreateInvoice ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={onCreateInvoice}
          className="h-9 px-3 text-xs font-medium gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span>Create Invoice</span>
        </Button>
      ) : (
        <Link href="/dashboard/invoices/new">
          <Button
            variant="secondary"
            size="sm"
            className="h-9 px-3 text-xs font-medium gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Create Invoice</span>
          </Button>
        </Link>
      )}

      {/* Secondary Quick Action 2: Create Payment Link */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleLink}
        className="h-9 px-3 text-xs font-medium gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
      >
        <Link2 className="w-3.5 h-3.5 text-slate-400" />
        <span>Create Payment Link</span>
      </Button>
    </div>
  )
}
