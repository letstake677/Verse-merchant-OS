"use client"

import * as React from "react"
import { Plus, Coins, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"

interface PaymentsHeaderProps {
  onCreatePayment?: () => void
  className?: string
}

export function PaymentsHeader({
  onCreatePayment,
  className,
}: PaymentsHeaderProps) {
  const { toast } = useToast()

  const handleCreate = () => {
    if (onCreatePayment) {
      onCreatePayment()
    } else {
      toast({
        title: "Create Payment Request",
        description: "Payment creation workflow will be connected in subsequent phases.",
        type: "info",
      })
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Payments
          </h1>
          <Badge variant="outline" className="text-[10px] font-mono py-0 px-2 text-slate-500">
            Polygon
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-normal">
          Track and manage payment requests and completed payments.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreate}
          className="gap-1.5 text-xs font-semibold h-9 px-3.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Payment</span>
        </Button>
      </div>
    </div>
  )
}
