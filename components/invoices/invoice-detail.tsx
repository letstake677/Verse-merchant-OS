"use client"

import * as React from "react"
import { Invoice } from "@/lib/invoices/types"
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
} from "lucide-react"

interface InvoiceDetailProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
  onPay: () => void
  onQr: () => void
}

export function InvoiceDetail({ invoice, isOpen, onClose, onPay, onQr }: InvoiceDetailProps) {
  const [copied, setCopied] = React.useState(false)
  const { prices, calculateAmount, refreshPrices, isCalculating } = useCryptoPrices()
  const isPaid = invoice.status === "paid"

  const numericTotal = parseFloat(invoice.total || "0")
  const polCalc = calculateAmount(numericTotal, invoice.currency || "USD", "POL")
  const verseCalc = calculateAmount(numericTotal, invoice.currency || "USD", "VERSE")
  const usdcCalc = calculateAmount(numericTotal, invoice.currency || "USD", "USDC")

  const handleCopyLink = () => {
    const url = `${window.location.origin}/pay/${invoice.id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Live Settlement Rates</span>
              <button
                type="button"
                onClick={() => refreshPrices()}
                className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${isCalculating ? "animate-spin" : ""}`} />
                <span>{isCalculating ? "Calculating..." : "Real-time Polygon Market Feed"}</span>
              </button>
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
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied Checkout URL" : "Share Pay Link"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onQr}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              QR Code
            </button>
            <button
              onClick={onPay}
              disabled={isPaid}
              className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all ${
                isPaid
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              }`}
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
