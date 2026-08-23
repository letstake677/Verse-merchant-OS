"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus,
  Trash2,
  User,
  Mail,
  Calendar,
  DollarSign,
  Info,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  InvoiceFormState,
  InvoiceLineItemFormState,
  InvoiceFormErrors,
  InvoiceLineItemErrors,
} from "@/types/invoice"
import {
  calculateLineItemAmount,
  calculateInvoiceTotals,
  formatCurrencyDisplay,
} from "@/lib/financial"

interface InvoiceFormProps {
  formData: InvoiceFormState
  onChange: (data: InvoiceFormState) => void
  errors?: InvoiceFormErrors
  onClearError?: (
    field: keyof InvoiceFormErrors,
    itemIndex?: number,
    itemField?: keyof InvoiceLineItemErrors
  ) => void
  onSubmit?: (e: React.FormEvent) => void
  onCancel?: () => void
  submitButtonText?: string
  cancelButtonText?: string
  className?: string
}

export function InvoiceForm({
  formData,
  onChange,
  errors = {},
  onClearError,
  onSubmit,
  onCancel,
  submitButtonText = "Review Invoice",
  cancelButtonText = "Cancel",
  className,
}: InvoiceFormProps) {
  // Update top-level field and clear corresponding error
  const updateField = <K extends keyof InvoiceFormState>(
    field: K,
    value: InvoiceFormState[K]
  ) => {
    onChange({
      ...formData,
      [field]: value,
    })

    if (onClearError) {
      onClearError(field as keyof InvoiceFormErrors)
    }
  }

  // Line items handlers
  const handleAddItem = () => {
    const newItem: InvoiceLineItemFormState = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: "",
      quantity: 1,
      unitPrice: "",
      amount: "0.00",
    }
    onChange({
      ...formData,
      items: [...formData.items, newItem],
    })
  }

  const handleUpdateItem = (
    index: number,
    field: keyof InvoiceLineItemFormState,
    value: string | number
  ) => {
    const updatedItems = [...formData.items]
    let sanitizedValue: string | number = value

    if (field === "unitPrice" && typeof value === "string") {
      // Clean leading currency symbol or accidental formatting commas/dollar signs
      sanitizedValue = value.replace(/[$€£,\s]/g, "")
    }

    const item = { ...updatedItems[index], [field]: sanitizedValue }

    // Safely recalculate line amount using deterministic integer cents math
    item.amount = calculateLineItemAmount(
      field === "quantity" ? sanitizedValue : item.quantity,
      field === "unitPrice" ? sanitizedValue : item.unitPrice
    )

    updatedItems[index] = item
    onChange({
      ...formData,
      items: updatedItems,
    })

    if (onClearError) {
      onClearError("items", index, field as keyof InvoiceLineItemErrors)
    }
  }

  const handleRemoveItem = (index: number) => {
    if (formData.items.length <= 1) return
    const updatedItems = formData.items.filter((_, i) => i !== index)
    onChange({
      ...formData,
      items: updatedItems,
    })
  }

  // Calculate totals deterministically
  const totals = calculateInvoiceTotals(formData.items)

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={`space-y-6 ${className || ""}`}
      id="invoice-builder-form"
    >
      {/* General validation error notification if present */}
      {errors.general && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 shadow-2xs"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errors.general}</span>
        </div>
      )}

      {/* 1. Customer Section */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Customer Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="customer-name-input"
                className="text-xs font-semibold text-slate-700 block"
              >
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <Input
                id="customer-name-input"
                name="customerName"
                placeholder="e.g. Acme Corp / Alex Smith"
                value={formData.customerName}
                onChange={(e) => updateField("customerName", e.target.value)}
                error={!!errors.customerName}
                helperText={
                  errors.customerName ||
                  "The name displayed on the customer invoice."
                }
                startIcon={<User className="w-4 h-4" />}
                className="h-9 text-xs"
                aria-required="true"
                aria-invalid={!!errors.customerName}
              />
            </div>

            {/* Customer Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="customer-email-input"
                className="text-xs font-semibold text-slate-700 block"
              >
                Customer Email
              </label>
              <Input
                id="customer-email-input"
                name="customerEmail"
                type="email"
                placeholder="billing@customer.com"
                value={formData.customerEmail}
                onChange={(e) => updateField("customerEmail", e.target.value)}
                error={!!errors.customerEmail}
                helperText={
                  errors.customerEmail ||
                  "Where the payment request & receipt will be delivered."
                }
                startIcon={<Mail className="w-4 h-4" />}
                className="h-9 text-xs"
                aria-invalid={!!errors.customerEmail}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Invoice Details Section */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Invoice Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Currency Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="invoice-currency-select"
                className="text-xs font-semibold text-slate-700 block"
              >
                Currency <span className="text-rose-500">*</span>
              </label>
              <Select
                id="invoice-currency-select"
                name="currency"
                value={formData.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                error={!!errors.currency}
                helperText={
                  errors.currency ||
                  "Denomination currency for line item pricing."
                }
                className="h-9 text-xs"
                aria-required="true"
                aria-invalid={!!errors.currency}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="invoice-due-date-input"
                className="text-xs font-semibold text-slate-700 block"
              >
                Due Date
              </label>
              <Input
                id="invoice-due-date-input"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateField("dueDate", e.target.value)}
                helperText="Payment deadline (leave blank for upon receipt)."
                className="h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Line Items Section */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Line Items</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {formData.items.length} item{formData.items.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Items Container */}
          <div className="space-y-3">
            {formData.items.map((item, index) => {
              const itemError = errors.items?.[index]

              return (
                <div
                  key={item.id || index}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Item #{index + 1}
                    </span>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 flex items-center gap-1 text-[11px]"
                        title={`Remove item #${index + 1}`}
                        aria-label={`Remove line item #${index + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline font-medium">
                          Remove
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                    {/* Description */}
                    <div className="sm:col-span-6 space-y-1">
                      <label
                        htmlFor={`item-desc-${index}`}
                        className="text-[11px] font-semibold text-slate-700 block"
                      >
                        Description <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id={`item-desc-${index}`}
                        placeholder="Service or product description..."
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateItem(index, "description", e.target.value)
                        }
                        error={!!itemError?.description}
                        helperText={itemError?.description}
                        className="h-8 text-xs bg-white"
                        aria-required="true"
                        aria-invalid={!!itemError?.description}
                      />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2 space-y-1">
                      <label
                        htmlFor={`item-qty-${index}`}
                        className="text-[11px] font-semibold text-slate-700 block"
                      >
                        Qty <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id={`item-qty-${index}`}
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateItem(index, "quantity", e.target.value)
                        }
                        onFocus={(e) => e.target.select()}
                        error={!!itemError?.quantity}
                        helperText={itemError?.quantity}
                        className="h-8 text-xs bg-white text-center font-tabular"
                        aria-required="true"
                        aria-invalid={!!itemError?.quantity}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="sm:col-span-2 space-y-1">
                      <label
                        htmlFor={`item-price-${index}`}
                        className="text-[11px] font-semibold text-slate-700 block"
                      >
                        Price ({formData.currency}) <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id={`item-price-${index}`}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleUpdateItem(index, "unitPrice", e.target.value)
                        }
                        onFocus={(e) => e.target.select()}
                        error={!!itemError?.unitPrice}
                        helperText={itemError?.unitPrice}
                        className="h-8 text-xs bg-white text-right font-tabular"
                        aria-required="true"
                        aria-invalid={!!itemError?.unitPrice}
                      />
                    </div>

                    {/* Line Amount */}
                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-700 block">
                        Amount
                      </span>
                      <div
                        className="h-8 flex items-center justify-end px-2.5 rounded-lg border border-slate-200 bg-slate-100/80 text-xs font-mono font-semibold text-slate-800"
                        title="Calculated line item amount"
                      >
                        {item.amount || "0.00"}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddItem}
              className="w-full text-xs font-semibold gap-1.5 h-8.5 border-dashed border-slate-300 hover:border-slate-400"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add line item</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Totals Breakdown Section */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardContent className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">Subtotal</span>
            <span className="font-mono font-semibold text-slate-900">
              {formatCurrencyDisplay(totals.subtotalFormatted, formData.currency)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">
              Total Payable
            </span>
            <span className="text-base font-bold font-mono text-indigo-700">
              {formatCurrencyDisplay(totals.totalFormatted, formData.currency)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 5. Additional Information (Notes) */}
      <Card className="border-slate-200/90 shadow-2xs bg-white">
        <CardContent className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Info className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Additional Information
            </h2>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="customer-notes-textarea"
              className="text-xs font-semibold text-slate-700 block"
            >
              Customer Notes & Payment Terms
            </label>
            <Textarea
              id="customer-notes-textarea"
              name="notes"
              placeholder="e.g. Thank you for your business! Please settle this invoice within 14 days."
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              className="min-h-[80px] text-xs"
              helperText="Notes are visible to the customer on their invoice checkout page."
            />
          </div>
        </CardContent>
      </Card>

      {/* 6. Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="w-full sm:w-auto text-xs h-9 px-4 font-medium text-slate-600 hover:text-slate-900"
            id="cancel-invoice-form-button"
          >
            {cancelButtonText}
          </Button>
        ) : (
          <Link href="/dashboard/invoices" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto text-xs h-9 px-4 font-medium text-slate-600 hover:text-slate-900"
              id="cancel-invoice-link-button"
            >
              {cancelButtonText}
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            type="submit"
            variant="primary"
            className="w-full sm:w-auto text-xs h-9 px-5 font-semibold gap-1.5 shadow-xs"
            id="review-invoice-submit-button"
          >
            <span>{submitButtonText}</span>
          </Button>
        </div>
      </div>
    </form>
  )
}
