"use client"

import * as React from "react"
import { User, Mail } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface InvoiceDetailCustomerProps {
  customerName?: string
  customerEmail?: string
}

export function InvoiceDetailCustomer({
  customerName,
  customerEmail,
}: InvoiceDetailCustomerProps) {
  const displayName = customerName && customerName.trim() ? customerName.trim() : "Not provided"
  const displayEmail = customerEmail && customerEmail.trim() ? customerEmail.trim() : "Not provided"

  return (
    <Card id="invoice-detail-customer-card" className="print:shadow-none print:border-slate-300 print:bg-white print:break-inside-avoid">
      <CardHeader className="pb-3 border-b border-slate-100 print:border-slate-300">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 print:hidden" />
          <span>Customer Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3 text-xs">
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Name</span>
          <p className="font-semibold text-slate-900 text-sm">
            {displayName}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-50 print:border-slate-200">
          <span className="text-[11px] font-medium text-slate-400 block mb-0.5">Email</span>
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0 print:hidden" />
            <span className={customerEmail ? "font-mono text-slate-700 font-medium" : "text-slate-400 italic"}>
              {displayEmail}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
