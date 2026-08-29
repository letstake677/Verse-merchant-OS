"use client"

import * as React from "react"
import { Invoice } from "@/lib/invoices/types"
import { generatePayUrl } from "@/lib/invoices/invoice-link"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Send,
  Printer,
  Sparkles,
  Loader2,
  RefreshCw,
  Share2,
  XCircle,
} from "lucide-react"

import { InvoiceDetailHeader } from "./invoice-detail-header"
import { InvoiceDetailCustomer } from "./invoice-detail-customer"
import { InvoiceDetailSummary } from "./invoice-detail-summary"
import { InvoiceDetailItems } from "./invoice-detail-items"
import { InvoiceDetailNotes } from "./invoice-detail-notes"
import { InvoicePaymentModal } from "./invoice-payment-modal"
import { PaymentQrModal } from "../payments/payment-qr-modal"
import { useToast } from "@/components/ui/toast"

interface InvoiceDetailProps {
  invoice: Invoice
  isOpen?: boolean
  onClose?: () => void
  onPay?: () => void
  onQr?: () => void
  onInvoiceUpdated?: (updated: Invoice) => void
}

export function InvoiceDetail({
  invoice,
  isOpen,
  onClose,
  onPay,
  onQr,
  onInvoiceUpdated,
}: InvoiceDetailProps) {
  const [copied, setCopied] = React.useState(false)
  const { calculateAmount, refreshPrices, secondsRemaining, isLoading: pricesLoading } = useCryptoPrices()
  const isPaid = invoice.status === "paid"

  // States for modals in full page mode
  const [isPayOpen, setIsPayOpen] = React.useState(false)
  const [isQrOpen, setIsQrOpen] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const { toast } = useToast()

  const numericTotal = parseFloat(invoice.total || "0")
  const polCalc = calculateAmount(numericTotal, invoice.currency || "USD", "POL")
  const verseCalc = calculateAmount(numericTotal, invoice.currency || "USD", "VERSE")
  const usdcCalc = calculateAmount(numericTotal, invoice.currency || "USD", "USDC")

  const handleCopyLink = async () => {
    const url = generatePayUrl(invoice)
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(url)
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = url
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Link Copied!",
        description: "Public invoice payment link copied to clipboard.",
        type: "success",
      })
    } catch {
      toast({
        title: "Unable to auto-copy",
        description: `Please copy this link: ${url}`,
        type: "info",
      })
    }
  }

  const handleShare = () => {
    const url = generatePayUrl(invoice)
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: `View and pay invoice ${invoice.invoiceNumber}`,
        url: url,
      }).catch((err) => {
        if (err.name !== "AbortError") {
          handleCopyLink()
        }
      })
    } else {
      handleCopyLink()
    }
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  const [isMarkingReceived, setIsMarkingReceived] = React.useState(false)

  const handleMarkReceived = async () => {
    setIsMarkingReceived(true)
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoice.id)}/mark-received`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast({
          title: "Payment Confirmed!",
          description: "Invoice marked as paid successfully.",
          type: "success",
        })
        if (onInvoiceUpdated && data.invoice) {
          onInvoiceUpdated(data.invoice)
        } else {
          window.location.reload()
        }
      } else {
        toast({
          title: "Action Failed",
          description: data.error || "Could not mark payment as received.",
          type: "error",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error while marking payment as received.",
        type: "error",
      })
    } finally {
      setIsMarkingReceived(false)
    }
  }

  // Full page cancel handler
  const handleCancelInvoice = async () => {
    if (isCancelling) return
    setIsCancelling(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/cancel`, {
        method: "POST",
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast({
          title: "Invoice Cancelled",
          description: "The invoice status has been successfully set to cancelled.",
          type: "success",
        })
        if (onInvoiceUpdated && data.invoice) {
          onInvoiceUpdated(data.invoice)
        }
      } else {
        toast({
          title: "Cancellation Failed",
          description: data.message || "Could not cancel the invoice.",
          type: "error",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while cancelling.",
        type: "error",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const isModal = isOpen !== undefined

  // --- FULL PAGE MODE ---
  if (!isModal) {
    return (
      <div className="space-y-6" id="invoice-detail-page-wrapper">
        {/* Header containing all actions: Pay, QR, Edit, Cancel, Print, Copy Link, Share */}
        <InvoiceDetailHeader
          invoiceNumber={invoice.invoiceNumber}
          status={invoice.status as any}
          onCancelInvoice={
            invoice.status === "draft" || invoice.status === "open" || invoice.status === "overdue"
              ? handleCancelInvoice
              : undefined
          }
          onPayInvoice={invoice.status === "open" || invoice.status === "overdue" ? () => setIsPayOpen(true) : undefined}
          onShowQR={() => setIsQrOpen(true)}
        />

        {invoice.status === "payment_submitted" && (
          <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-amber-950">Customer Marked Payment as Submitted (&ldquo;I Have Paid&rdquo;)</h4>
                <p className="text-xs text-amber-800">
                  Customer has transferred funds. Please verify your Polygon wallet and click below to confirm.
                </p>
              </div>
            </div>
            <button
              onClick={handleMarkReceived}
              disabled={isMarkingReceived}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              {isMarkingReceived ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Confirm & Mark as Paid</span>
            </button>
          </div>
        )}

        {/* 2-Column Desktop Grid, 1-Column Mobile Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main left content */}
          <div className="lg:col-span-2 space-y-6">
            <InvoiceDetailItems
              items={invoice.items as any}
              subtotal={invoice.subtotal}
              taxAmount={invoice.tax}
              total={invoice.total}
              currency={invoice.currency}
            />
            {invoice.notes && <InvoiceDetailNotes notes={invoice.notes} />}
          </div>

          {/* Sidebar right content */}
          <div className="space-y-6">
            <InvoiceDetailSummary
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              status={invoice.status as any}
              currency={invoice.currency}
              createdAt={invoice.createdAt}
              dueDate={invoice.dueDate}
              paymentId={invoice.paymentId}
            />
            <InvoiceDetailCustomer
              customerName={invoice.customerName}
              customerEmail={invoice.customerEmail}
            />
          </div>
        </div>

        {/* Dynamic Modals in Full Page Mode */}
        <InvoicePaymentModal
          invoice={invoice}
          isOpen={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          onSuccess={(updatedInvoice) => {
            setIsPayOpen(false)
            if (onInvoiceUpdated && updatedInvoice) {
              onInvoiceUpdated(updatedInvoice)
            } else if (onInvoiceUpdated) {
              // Refresh invoice from API
              fetch(`/api/invoices/${invoice.id}`)
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                  if (data && data.ok && data.invoice) {
                    onInvoiceUpdated(data.invoice)
                  }
                })
            }
          }}
        />
        <PaymentQrModal
          invoice={invoice}
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
        />
      </div>
    )
  }

  // --- MODAL MODE ---
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">{invoice.invoiceNumber}</h3>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isPaid
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  : "bg-amber-50 text-amber-700 border border-amber-200/60"
              }`}
            >
              {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {isPaid ? "Settled On-Chain" : "Pending"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Top metadata grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/70 text-sm">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Billed To</div>
              <div className="font-semibold text-slate-900 mt-0.5">{invoice.customerName}</div>
              <div className="text-slate-500 text-xs">{invoice.customerEmail}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Timeline</div>
              <div className="text-slate-700 text-xs mt-0.5">Created: {invoice.createdAt}</div>
              <div className="text-slate-700 text-xs">Due Date: {invoice.dueDate}</div>
            </div>
          </div>

          {/* Live Crypto Conversion Overview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="uppercase tracking-wider">Live Settlement Rates</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Rate locked ({secondsRemaining}s)
                </span>
                <button
                  type="button"
                  onClick={() => refreshPrices()}
                  className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-medium cursor-pointer"
                  title="Click to refresh market rates"
                >
                  <RefreshCw className={`w-3 h-3 ${pricesLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-left">
                <div className="text-xs font-semibold text-slate-700">POL (Native)</div>
                {polCalc.isCalculating ? (
                  <div className="flex items-center gap-1 text-xs text-purple-600 font-medium py-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Calculating...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-base font-bold font-mono text-purple-950 mt-0.5">
                      {polCalc.tokenAmount}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">1 POL ≈ {polCalc.formattedRate}</div>
                  </>
                )}
              </div>

              <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100 text-left">
                <div className="text-xs font-semibold text-slate-700">VERSE</div>
                {verseCalc.isCalculating ? (
                  <div className="flex items-center gap-1 text-xs text-violet-600 font-medium py-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Calculating...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-base font-bold font-mono text-violet-950 mt-0.5">
                      {verseCalc.tokenAmount}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">1 VERSE ≈ {verseCalc.formattedRate}</div>
                  </>
                )}
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-left">
                <div className="text-xs font-semibold text-slate-700">USDC</div>
                {usdcCalc.isCalculating ? (
                  <div className="flex items-center gap-1 text-xs text-blue-600 font-medium py-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Calculating...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-base font-bold font-mono text-blue-950 mt-0.5">
                      {usdcCalc.tokenAmount}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">1 USDC = $1.00</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 text-slate-900 font-medium">{item.description}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">${item.unitPrice}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ${item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">${invoice.subtotal}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Total Due:</span>
                <span className="font-mono text-purple-600">${invoice.total} {invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Payments History if Paid */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                On-Chain Payment Record
              </div>
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-800">Tx Hash:</span>
                  <a
                    href={`https://polygonscan.com/tx/${invoice.payments[0].txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-emerald-700 underline flex items-center gap-1"
                  >
                    {invoice.payments[0].txHash.slice(0, 10)}...{invoice.payments[0].txHash.slice(-8)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Crypto Settled:</span>
                  <span className="font-bold font-mono">
                    {invoice.payments[0].amount} {invoice.payments[0].token.symbol}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center gap-2 justify-between print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              id="modal-copy-link-button"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              {copied ? "Copied" : "Copy Link"}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              id="modal-share-invoice-button"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              Share
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              id="modal-print-invoice-button"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print Receipt
            </button>

            {/* Cancel Invoice */}
            {!(isPaid || invoice.status === "cancelled") && (
              <button
                onClick={handleCancelInvoice}
                disabled={isCancelling}
                className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                id="modal-cancel-invoice-button"
              >
                {isCancelling ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                )}
                Cancel Invoice
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onQr}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              id="modal-qr-code-button"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-500" />
              QR Code
            </button>
            <button
              onClick={onPay}
              disabled={isPaid}
              className={`px-4 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                isPaid
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
              id="modal-pay-invoice-button"
            >
              <CreditCard className="w-3.5 h-3.5" />
              {isPaid ? "Settled" : "Pay with Web3 Wallet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
