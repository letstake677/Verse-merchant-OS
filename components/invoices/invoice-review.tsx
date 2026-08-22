"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  DollarSign,
  Info,
  CheckCircle2,
  Edit3,
  FileText,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InvoiceFormState } from "@/types/invoice"
import {
  calculateInvoiceTotals,
  calculateLineItemAmount,
  formatCents,
  parseQuantity,
  parseToCents,
  formatCurrencyDisplay,
} from "@/lib/financial"

interface InvoiceReviewProps {
  formData: InvoiceFormState
  onBackToEdit: () => void
  onEditSection?: (section: "customer" | "details" | "items" | "notes") => void
  onCreateInvoice: () => void
  isSubmitting?: boolean
  title?: string
  subtitle?: string
  badgeText?: string
  confirmButtonText?: string
  submittingButtonText?: string
  invoiceNumber?: string
  className?: string
}

export function InvoiceReview({
  formData,
  onBackToEdit,
  onEditSection,
  onCreateInvoice,
  isSubmitting = false,
  title = "Review Invoice",
  subtitle = "Check the details below before creating this invoice.",
  badgeText = "Ready to Create",
  confirmButtonText = "Create Invoice",
  submittingButtonText = "Creating Invoice...",
  invoiceNumber,
  className,
}: InvoiceReviewProps) {
  const { customerName, customerEmail, currency, dueDate, items, notes } = formData

  // Deterministic financial calculation
  const totals = calculateInvoiceTotals(items)
  const hasNotes = Boolean(notes && notes.trim())

  const handleEdit = (section: "customer" | "details" | "items" | "notes") => {
    if (onEditSection) {
      onEditSection(section)
    } else {
      onBackToEdit()
    }
  }

  return (
    <div className={`space-y-6 max-w-5xl mx-auto ${className || ""}`}>
      {/* 1. Header with Back Navigation */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
        <div>
          <button
            type="button"
            onClick={onBackToEdit}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Edit</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
                {invoiceNumber && (
                  <span className="font-mono text-sm sm:text-base font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {invoiceNumber}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-mono"
                >
                  {badgeText}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                {subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onBackToEdit}
                className="h-8.5 text-xs font-medium gap-1.5 border-slate-200 text-slate-700"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Review Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Detailed Sections (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-5">
          {/* A. Customer & Invoice Details Combined Card */}
          <Card className="border-slate-200/90 shadow-2xs bg-white overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Customer & Billing Info
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleEdit("customer")}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                aria-label="Edit customer and billing info"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block text-[11px]">
                    Customer Name
                  </span>
                  <p className="font-semibold text-slate-900 text-sm">
                    {customerName}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium block text-[11px]">
                    Customer Email
                  </span>
                  <p className="font-mono text-slate-700">
                    {customerEmail || (
                      <span className="text-slate-400 italic">Not provided</span>
                    )}
                  </p>
                </div>

                <div className="space-y-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">
                    Currency
                  </span>
                  <p className="font-semibold text-slate-900">{currency}</p>
                </div>

                <div className="space-y-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span className="text-slate-400 font-medium block text-[11px]">
                    Due Date
                  </span>
                  <p className="font-medium text-slate-800">
                    {dueDate || "Upon receipt"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* B. Line Items Review Card */}
          <Card className="border-slate-200/90 shadow-2xs bg-white overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Line Items ({items.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleEdit("items")}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                aria-label="Edit line items"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Description</th>
                      <th className="py-2.5 px-3 text-center w-16 font-semibold">
                        Qty
                      </th>
                      <th className="py-2.5 px-3 text-right w-24 font-semibold">
                        Unit Price
                      </th>
                      <th className="py-2.5 px-4 text-right w-28 font-semibold">
                        Line Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => {
                      const itemQty = parseQuantity(item.quantity)
                      const itemPriceCents = parseToCents(item.unitPrice)
                      const lineTotalFormatted = calculateLineItemAmount(
                        item.quantity,
                        item.unitPrice
                      )

                      return (
                        <tr key={item.id || index} className="hover:bg-slate-50/40">
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {item.description}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 font-tabular">
                            {itemQty > 0 ? itemQty : 1}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600 font-tabular">
                            {formatCents(itemPriceCents)} {currency}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                            {lineTotalFormatted} {currency}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* C. Customer Notes Section (Only shown if merchant entered notes) */}
          {hasNotes && (
            <Card className="border-slate-200/90 shadow-2xs bg-white overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Customer Notes & Payment Terms
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleEdit("notes")}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                  aria-label="Edit customer notes"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <CardContent className="p-5">
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/60 p-3.5 rounded-lg border border-slate-100 font-normal">
                  {notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Totals Summary & Final Actions (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-6">
          {/* Summary Box */}
          <Card className="border-slate-200/90 shadow-2xs bg-white overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Summary
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] text-slate-300 border-slate-700">
                {currency}
              </Badge>
            </div>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-slate-800">
                    {formatCurrencyDisplay(totals.subtotalFormatted, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tax</span>
                  <span>$0.00</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Total Payable
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {items.length} line item{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className="text-lg font-bold font-mono text-indigo-700">
                  {formatCurrencyDisplay(totals.totalFormatted, currency)}
                </span>
              </div>

              {/* Security / Network Notice */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Payable on Polygon Network via Verse checkout</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <Button
              type="button"
              variant="primary"
              onClick={onCreateInvoice}
              disabled={isSubmitting}
              className="w-full h-10 text-xs font-semibold gap-1.5 shadow-sm"
              id="confirm-create-invoice-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{submittingButtonText}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{confirmButtonText}</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={onBackToEdit}
              disabled={isSubmitting}
              className="w-full h-9 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              id="back-to-edit-invoice-button"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Edit</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
