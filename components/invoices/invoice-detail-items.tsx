"use client"

import * as React from "react"
import { ListOrdered } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { InvoiceItem } from "@/types/invoice"

interface InvoiceDetailItemsProps {
  items: InvoiceItem[]
  subtotal: string
  taxAmount?: string
  total: string
  currency: string
}

export function InvoiceDetailItems({
  items = [],
  subtotal,
  taxAmount,
  total,
  currency,
}: InvoiceDetailItemsProps) {
  const safeTax = taxAmount && taxAmount.trim() ? taxAmount : "0.00"

  return (
    <Card id="invoice-detail-items-card" className="print:shadow-none print:border-slate-300 print:bg-white print:break-inside-avoid">
      <CardHeader className="pb-3 border-b border-slate-100 print:border-slate-300 flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5 print:hidden" />
          <span>Line Items</span>
        </CardTitle>
        <span className="text-xs text-slate-400 font-medium">
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
      </CardHeader>

      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            No line items.
          </div>
        ) : (
          <>
            {/* Desktop & Print Table View */}
            <div className="hidden md:block print:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 print:border-slate-300 bg-slate-50/50 print:bg-slate-100">
                    <TableHead className="w-[45%] text-xs font-semibold text-slate-600">
                      Description
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">
                      Quantity
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">
                      Unit Price
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold text-slate-600">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id || idx} className="hover:bg-slate-50/40 print:border-b print:border-slate-200">
                      <TableCell className="text-xs font-medium text-slate-800">
                        {item.description || "Untitled item"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-tabular text-slate-600">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-right font-tabular text-slate-600">
                        {item.unitPrice} {currency}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold font-tabular text-slate-900">
                        {item.amount} {currency}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Stacked Items View (Hidden on Print) */}
            <div className="md:hidden print:hidden divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs font-semibold text-slate-900">
                      {item.description || "Untitled item"}
                    </p>
                    <span className="text-xs font-bold text-slate-900 font-tabular shrink-0">
                      {item.amount} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-tabular">
                    <span>Qty: {item.quantity}</span>
                    <span>Rate: {item.unitPrice} {currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Totals Section */}
        <div className="p-4 sm:p-6 bg-slate-50/70 print:bg-slate-50 border-t border-slate-100 print:border-slate-300 flex flex-col items-end">
          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold font-tabular text-slate-800">
                {subtotal} {currency}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Tax</span>
              <span className="font-semibold font-tabular text-slate-800">
                {safeTax} {currency}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 print:border-slate-300 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-base sm:text-lg font-bold font-tabular text-slate-900">
                {total} {currency}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
