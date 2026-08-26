"use client"

import * as React from "react"
import { Invoice, InvoiceItem, calculateInvoiceTotals } from "@/lib/invoices/types"
import { Plus, Trash2, X, Save, ArrowRight, Wallet, AlertCircle } from "lucide-react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MERCHANT_RECEIVING_ADDRESS } from "@/lib/payments/config"

interface InvoiceBuilderProps {
  isOpen?: boolean
  onClose?: () => void
  onCreated?: (invoice: Invoice) => void
}

export function InvoiceBuilder({ isOpen = true, onClose, onCreated }: InvoiceBuilderProps) {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const merchantAddr = address || MERCHANT_RECEIVING_ADDRESS

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      router.push("/dashboard/invoices")
    }
  }
  const [customerName, setCustomerName] = React.useState("")
  const [customerEmail, setCustomerEmail] = React.useState("")
  const [dueDate, setDueDate] = React.useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  )
  const [currency, setCurrency] = React.useState("USD")
  const [notes, setNotes] = React.useState("")
  const [items, setItems] = React.useState<InvoiceItem[]>([
    {
      id: "item-1",
      description: "Development & Consulting Services",
      quantity: 1,
      unitPrice: "0.05",
      amount: "0.05",
    },
  ])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const totals = calculateInvoiceTotals(items)

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: "0.00",
        amount: "0.00",
      },
    ])
  }

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, val: string | number) => {
    const updated = [...items]
    const item = { ...updated[index], [field]: val }
    if (field === "quantity" || field === "unitPrice") {
      const qty = Number(field === "quantity" ? val : item.quantity) || 0
      const price = parseFloat(field === "unitPrice" ? (val as string) : item.unitPrice) || 0
      item.amount = (qty * price).toFixed(2)
    }
    updated[index] = item
    setItems(updated)
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      setSubmitError("Customer name is required.")
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          dueDate,
          currency,
          notes,
          items,
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
          paymentAddress: merchantAddr,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (onCreated) {
          onCreated(data.invoice)
        } else {
          router.push(`/pay/${data.invoice.id}`)
        }
        if (onClose) {
          onClose()
        }
      } else {
        const errData = await res.json().catch(() => ({}))
        setSubmitError(errData.error || "Failed to create invoice. Please try again.")
      }
    } catch (err) {
      console.error(err)
      setSubmitError("Network error while creating invoice.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Create New Invoice</h3>
            {merchantAddr && (
              <span className="text-[11px] font-mono bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md">
                {merchantAddr.slice(0, 6)}...{merchantAddr.slice(-4)}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet connection check banner */}
        {!isConnected && (
          <div className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">Wallet Connection Required</p>
              <p className="text-amber-700">
                You must connect your merchant wallet to sign and receive payments on Polygon.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 font-semibold text-amber-900 underline mt-1"
              >
                Go to Wallet Sign-In <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {submitError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Customer / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Acme Web3 DAO"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Customer Email
              </label>
              <input
                type="email"
                placeholder="finance@acme.io"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Denomination Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-slate-900 hover:text-slate-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(idx, "description", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItem(idx, "quantity", e.target.value)}
                    className="w-16 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handleUpdateItem(idx, "unitPrice", e.target.value)}
                    className="w-24 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                  <div className="w-20 text-right font-mono text-sm font-semibold text-slate-700">
                    ${item.amount}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-mono">${totals.subtotal}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Due</span>
              <span className="font-mono text-slate-900 font-bold">${totals.total} {currency}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isConnected}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Creating..." : "Save & Issue Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
