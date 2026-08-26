"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Invoice } from "@/lib/invoices/types"
import { InvoicePaymentModal } from "@/components/invoices/invoice-payment-modal"
import { PaymentQrModal } from "@/components/payments/payment-qr-modal"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import {
  Zap,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"

export default function PublicPayPage() {
  const params = useParams()
  const id = params?.id as string

  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isPayOpen, setIsPayOpen] = React.useState(false)
  const [isQrOpen, setIsQrOpen] = React.useState(false)

  const { prices, calculateAmount, refreshPrices, isCalculating } = useCryptoPrices()

  const fetchInvoice = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/invoices/${id}`)
      if (res.ok) {
        const data = await res.json()
        setInvoice(data.invoice)
      } else {
        setError("Invoice not found or invalid URL")
      }
    } catch (e) {
      setError("Failed to load invoice details")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          Loading Invoice...
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Invoice Not Found</h2>
          <p className="text-sm text-slate-500">{error || "Please verify the link provided by your merchant."}</p>
        </div>
      </div>
    )
  }

  const isPaid = invoice.status === "paid"
  const numericTotal = parseFloat(invoice.total || "0")
  const polCalc = calculateAmount(numericTotal, invoice.currency || "USD", "POL")
  const verseCalc = calculateAmount(numericTotal, invoice.currency || "USD", "VERSE")
  const usdcCalc = calculateAmount(numericTotal, invoice.currency || "USD", "USDC")

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <span className="font-bold text-slate-900">VersePay Checkout</span>
          </div>
          <ConnectButton showBalance={false} />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                  Payment Request
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isPaid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {isPaid ? "Paid & Settled" : "Pending Payment"}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-mono">{invoice.invoiceNumber}</h1>
              <p className="text-sm text-slate-400">Billed to {invoice.customerName}</p>
            </div>

            <div className="text-left md:text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider">Total Due</div>
              <div className="text-3xl md:text-4xl font-bold font-mono text-purple-400">
                ${invoice.total} <span className="text-lg text-slate-300 font-sans">{invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Live Rates Banner */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              <span>Settlement Breakdown</span>
              <button
                onClick={() => refreshPrices()}
                className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:underline"
              >
                <RefreshCw className={`w-3 h-3 ${isCalculating ? "animate-spin" : ""}`} />
                <span>{isCalculating ? "Calculating Rates..." : "Live Feed"}</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">POL Amount</div>
                {polCalc.isCalculating ? (
                  <div className="flex items-center gap-1 text-xs text-purple-600 font-medium py-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Calculating...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{polCalc.tokenAmount}</div>
                    <div className="text-[10px] text-slate-400 font-mono">1 POL ≈ {polCalc.formattedRate}</div>
                  </>
                )}
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">VERSE Amount</div>
                {verseCalc.isCalculating ? (
                  <div className="flex items-center gap-1 text-xs text-purple-600 font-medium py-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Calculating...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{verseCalc.tokenAmount}</div>
                    <div className="text-[10px] text-slate-400 font-mono">1 VERSE ≈ {verseCalc.formattedRate}</div>
                  </>
                )}
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <div className="text-xs text-slate-500 font-medium">USDC Amount</div>
                {usdcCalc.isCalculating ? (
                  <div className="flex items-center gap-1 text-xs text-purple-600 font-medium py-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Calculating...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{usdcCalc.tokenAmount}</div>
                    <div className="text-[10px] text-slate-400 font-mono">1 USDC = $1.00</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="p-6 md:p-8 space-y-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{item.description}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">${item.unitPrice}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsQrOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <QrCode className="w-4 h-4 text-purple-600" />
                Scan QR with Mobile Wallet
              </button>

              <button
                onClick={() => setIsPayOpen(true)}
                disabled={isPaid}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                  isPaid
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                {isPaid ? "Invoice Paid" : "Pay with Web3 Wallet"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <InvoicePaymentModal
        invoice={invoice}
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        onSuccess={() => fetchInvoice()}
      />
      <PaymentQrModal
        invoice={invoice}
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
      />
    </div>
  )
}
