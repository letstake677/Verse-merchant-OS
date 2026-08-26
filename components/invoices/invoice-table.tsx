"use client"

import * as React from "react"
import Link from "next/link"
import { Invoice } from "@/lib/invoices/types"
import { ExternalLink, CreditCard, QrCode, CheckCircle2, Clock, Loader2, AlertCircle, RefreshCw, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface InvoiceTableProps {
  invoices: Invoice[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  pagination?: PaginationInfo
  onPageChange?: (page: number) => void
  onSelectInvoice?: (invoice: Invoice) => void
  onPayInvoice?: (invoice: Invoice) => void
  onQrInvoice?: (invoice: Invoice) => void
  onLearnMore?: () => void
  onViewInvoice?: (invoice: Invoice) => void
}

export function InvoiceTable({
  invoices,
  isLoading = false,
  error = null,
  onRetry,
  pagination,
  onPageChange,
  onSelectInvoice,
  onPayInvoice,
  onQrInvoice,
  onViewInvoice,
}: InvoiceTableProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const handleCopyLink = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation()
    const payUrl = `${window.location.origin}/pay/${invoice.id}`
    navigator.clipboard.writeText(payUrl)
    setCopiedId(invoice.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600">Loading invoices...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-sm font-medium text-slate-800">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
          </Button>
        )}
      </div>
    )
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4">
        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">No invoices found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create your first invoice to request crypto payments from your customers on Polygon.
          </p>
        </div>
        <Link href="/dashboard/invoices/new" className="inline-block">
          <Button variant="primary" size="sm" className="gap-1.5">
            Create Invoice
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5">Invoice</th>
              <th className="py-3.5 px-5">Customer</th>
              <th className="py-3.5 px-5">Due Date</th>
              <th className="py-3.5 px-5">Total</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {invoices.map((invoice) => {
              const isPaid = invoice.status === "paid"
              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => {
                    if (onSelectInvoice) onSelectInvoice(invoice)
                    else if (onViewInvoice) onViewInvoice(invoice)
                  }}
                >
                  <td className="py-4 px-5 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="font-mono">{invoice.invoiceNumber}</span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-medium text-slate-900">{invoice.customerName}</div>
                    <div className="text-xs text-slate-400">{invoice.customerEmail}</div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 font-mono text-xs">{invoice.dueDate}</td>
                  <td className="py-4 px-5">
                    <div className="font-bold text-slate-900 font-mono">
                      ${invoice.total} <span className="text-xs font-normal text-slate-400">{invoice.currency}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isPaid
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-amber-50 text-amber-700 border border-amber-200/60"
                      }`}
                    >
                      {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {isPaid ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => handleCopyLink(invoice, e)}
                        title="Copy Checkout Link"
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {copiedId === invoice.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      {onQrInvoice && (
                        <button
                          onClick={() => onQrInvoice(invoice)}
                          title="Show QR Code"
                          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/pay/${invoice.id}`}
                        target="_blank"
                        title="Open Customer Checkout Page"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      {onPayInvoice && !isPaid && (
                        <button
                          onClick={() => onPayInvoice(invoice)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-all flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing Page <span className="font-semibold text-slate-900">{pagination.page}</span> of{" "}
            <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.total} total)
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              className="h-8 px-2.5 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              className="h-8 px-2.5 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
