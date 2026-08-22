"use client"

import * as React from "react"
import Link from "next/link"
import { Coins, Plus, BookOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"

interface PaymentsEmptyStateProps {
  onCreatePayment?: () => void
  onLearnMore?: () => void
  className?: string
}

export function PaymentsEmptyState({
  onCreatePayment,
  onLearnMore,
  className,
}: PaymentsEmptyStateProps) {
  const { toast } = useToast()

  const handleCreate = () => {
    if (onCreatePayment) {
      onCreatePayment()
    } else {
      toast({
        title: "Create Payment Request",
        description: "Payment creation workflow will be connected in Phase 4B+.",
        type: "info",
      })
    }
  }

  const handleLearn = () => {
    if (onLearnMore) {
      onLearnMore()
    } else {
      toast({
        title: "How Verse Payments Work",
        description:
          "Create a payment request or invoice, share the link or QR code, payer transfers Verse, and the settlement verifies on Polygon.",
        type: "info",
      })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed border-slate-300 rounded-2xl bg-slate-50/50">
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-700 mb-4">
        <Coins className="w-6 h-6 text-indigo-600" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
        No payments yet
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        Payments you receive will appear here once customers complete a payment request.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreate}
          className="gap-1.5 text-xs font-semibold h-9 px-4 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Payment</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLearn}
          className="gap-1.5 text-xs font-medium h-9 px-4 w-full sm:w-auto text-slate-600 hover:text-slate-900"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Learn how payments work</span>
        </Button>
      </div>
    </div>
  )
}
