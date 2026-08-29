"use client"

import * as React from "react"
import { Eye, FileText, Calendar, Mail, User, ShieldCheck } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { VerseLogo } from "@/components/ui/verse-logo"
import { InvoiceFormState } from "@/types/invoice"
import { calculateInvoiceTotals, calculateLineItemAmount, parseQuantity, parseToCents, formatCents } from "@/lib/financial"

interface InvoicePreviewProps {
  formData: InvoiceFormState
  invoiceNumber?: string
  className?: string
}

export function InvoicePreview({ formData, invoiceNumber, className }: InvoicePreviewProps) {
  const { customerName, customerEmail, currency, dueDate, items, notes } = formData

  // Deterministic calculation of totals
  const totals = calculateInvoiceTotals(items)
  const hasItems = items.length > 0

  return (
    <Card className={`border-slate-200/90 shadow-sm bg-white overflow-hidden ${className || ""}`}>
      {/* Preview Header / Top Banner */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Customer Invoice Preview</span>
        </div>
        <Badge variant="outline" className="text-[10px] bg-white text-slate-500 border-slate-200">
          Live Preview
        </Badge>
      </div>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Invoice Top Meta */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                V
              </div>
              <span className="font-bold text-sm tracking-tight text-slate-900">
                VERSE MERCHANT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Payment Request</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-medium">
              {invoiceNumber ? invoiceNumber : "Invoice (Draft)"}
            </div>
            <p className="text-[11px] text-slate-400">
              Due: {dueDate ? dueDate : "Upon receipt"}
            </p>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="space-y-1.5 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Billed To
          </span>
          <div className="space-y-0.5">
            <p
              className={`text-xs font-semibold ${
                customerName ? "text-slate-900" : "text-slate-400 italic"
              }`}
            >
              {customerName || "Customer name"}
            </p>
            <p
              className={`text-[11px] font-mono ${
                customerEmail ? "text-slate-600" : "text-slate-400 italic"
              }`}
            >
              {customerEmail || "customer@example.com"}
            </p>
          </div>
        </div>

        {/* Items Table Preview */}
        <div className="space-y-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Line Items
          </span>

          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-2 text-center w-12">Qty</th>
                  <th className="py-2 px-2 text-right w-20">Price</th>
                  <th className="py-2 px-3 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasItems ? (
                  items.map((item, idx) => {
                    const itemQty = parseQuantity(item.quantity)
                    const itemPriceCents = parseToCents(item.unitPrice)
                    const lineTotalFormatted = calculateLineItemAmount(
                      item.quantity,
                      item.unitPrice
                    )

                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.description || (
                            <span className="text-slate-400 italic">Item description</span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600 font-tabular">
                          {itemQty > 0 ? itemQty : 1}
                        </td>
                        <td className="py-2.5 px-2 text-right text-slate-600 font-tabular">
                          {formatCents(itemPriceCents)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 font-tabular">
                          {lineTotalFormatted} {currency}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                      No line items added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium font-tabular text-slate-800">
              {totals.subtotalFormatted} {currency}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
            <span>Total Amount</span>
            <span className="font-mono text-base text-indigo-700">
              {totals.totalFormatted} {currency}
            </span>
          </div>
        </div>

        {/* Customer Notes Preview */}
        {notes && (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Notes
            </span>
            <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
              {notes}
            </p>
          </div>
        )}

        {/* Payment Network Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Payable on Polygon Network</span>
          </div>
          <VerseLogo size="xs" variant="icon" />
        </div>
      </CardContent>
    </Card>
  )
}
