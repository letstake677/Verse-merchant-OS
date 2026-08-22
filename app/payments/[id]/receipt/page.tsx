"use client"

export const dynamic = "force-dynamic"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ShieldCheck,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  FileText,
  Building2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  Clock,
} from "lucide-react"
import { PaymentReceipt } from "@/types/receipt"
import { Button } from "@/components/ui/button"

function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr || "N/A"
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "N/A"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return dateStr
  }
}

export default function PaymentReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const rawId = params?.id as string

  const [receipt, setReceipt] = React.useState<PaymentReceipt | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string>("")
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true
    if (!rawId) return

    fetch(`/api/payments/${encodeURIComponent(rawId)}/receipt`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        if (!data.ok || !data.receipt) {
          setError(data.message || "Payment receipt unavailable.")
        } else {
          setReceipt(data.receipt)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load payment receipt.")
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [rawId])

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading Official Payment Receipt...</p>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Receipt Unavailable</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error || "The requested payment receipt could not be retrieved."}
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/payments")}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Return to Payments
          </Button>
        </div>
      </div>
    )
  }

  const isConfirmed = receipt.confirmationState === "confirmed" || receipt.confirmationState === "overpaid"

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0 print:px-0">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Top Action Bar (Hidden during printing) */}
        <div className="flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            {receipt.transactionHash && (
              <a
                href={receipt.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
              >
                <span>PolygonScan</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              className="px-4 py-2 text-xs font-semibold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save Receipt</span>
            </Button>
          </div>
        </div>

        {/* Canonical Receipt Document */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden print:border-none print:shadow-none print:rounded-none">
          
          {/* Header Branding */}
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50 print:bg-white print:p-0 print:border-b-2 print:border-slate-900 print:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs print:border print:border-slate-900">
                    V
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                      {receipt.businessName}
                    </h1>
                    <p className="text-xs text-slate-500 font-mono">
                      Official Payment Receipt • Verse Merchant OS
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 print:border-slate-900 print:bg-slate-100 print:text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 print:text-slate-900" />
                  <span>
                    {receipt.confirmationState === "overpaid"
                      ? "CONFIRMED (OVERPAID)"
                      : receipt.confirmationState === "confirmed"
                      ? "CONFIRMED & SETTLED"
                      : "PAYMENT PENDING"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono block">
                  Receipt ID: {receipt.paymentId}
                </p>
              </div>
            </div>
          </div>

          {/* Core Receipt Info Grid */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-slate-100 pb-6">
              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                  Billed Customer
                </span>
                <div className="font-bold text-slate-900 text-sm">{receipt.customerName}</div>
                {receipt.customerEmail && (
                  <div className="text-slate-600 font-medium">{receipt.customerEmail}</div>
                )}
              </div>

              <div className="space-y-1.5 sm:text-right">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                  Invoice Metadata
                </span>
                <div className="font-mono font-bold text-slate-900 text-sm">
                  #{receipt.invoiceNumber}
                </div>
                <div className="text-slate-500">
                  Settled At: <span className="font-medium text-slate-800">{formatDate(receipt.settledAt)}</span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">
                Itemized Summary
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden print:border-slate-300">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 print:bg-slate-100">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipt.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-3 font-medium text-slate-800">{item.description}</td>
                        <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-600">${item.unitPrice.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold text-slate-900">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>${receipt.subtotal.toFixed(2)}</span>
                </div>
                {receipt.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({receipt.taxRate}%)</span>
                    <span>${receipt.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Settled</span>
                  <span>
                    ${receipt.total.toFixed(2)} {receipt.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Polygon Blockchain Settlement Verification Card */}
            <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-4 print:bg-white print:border-slate-300">
              <div className="flex items-center justify-between border-b border-indigo-100/80 pb-3 print:border-slate-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 print:text-slate-900" />
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider print:text-slate-900">
                    Polygon Settlement Verification
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 print:border print:border-slate-300">
                  On-Chain Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-500 block text-[11px]">Settlement Network</span>
                  <span className="font-semibold text-slate-900 block">{receipt.networkName}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[11px]">Settled Token Asset</span>
                  <span className="font-semibold text-slate-900 block">
                    {receipt.token.name} ({receipt.token.symbol})
                  </span>
                  {receipt.token.address && (
                    <span className="font-mono text-[10px] text-slate-400 truncate block">
                      Contract: {formatAddress(receipt.token.address)}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[11px]">Payer Wallet Address</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-800 font-medium break-all text-[11px]">
                      {receipt.payerAddress}
                    </span>
                    <button
                      onClick={() => handleCopy(receipt.payerAddress, "payer")}
                      className="p-1 text-slate-400 hover:text-slate-600 print:hidden"
                      title="Copy Address"
                    >
                      {copiedField === "payer" ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[11px]">Merchant Settlement Wallet</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-slate-800 font-medium break-all text-[11px]">
                      {receipt.recipientAddress}
                    </span>
                    <button
                      onClick={() => handleCopy(receipt.recipientAddress, "merchant")}
                      className="p-1 text-slate-400 hover:text-slate-600 print:hidden"
                      title="Copy Address"
                    >
                      {copiedField === "merchant" ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* On-Chain Tx Hash & Block Height */}
              <div className="pt-3 border-t border-indigo-100/80 space-y-2 print:border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">On-Chain Transaction Hash</span>
                  {receipt.blockNumber && (
                    <span className="text-[10px] font-mono text-slate-500">
                      Block #{receipt.blockNumber}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-indigo-100 font-mono text-xs text-indigo-950 break-all print:border-slate-300">
                  <span className="truncate">{receipt.transactionHash}</span>
                  <div className="flex items-center gap-1 shrink-0 print:hidden">
                    <button
                      onClick={() => handleCopy(receipt.transactionHash, "txHash")}
                      className="p-1 text-slate-400 hover:text-slate-600"
                      title="Copy Tx Hash"
                    >
                      {copiedField === "txHash" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {receipt.transactionHash && (
                      <a
                        href={receipt.explorerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-indigo-600 hover:text-indigo-800"
                        title="View on PolygonScan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Terms / Notes */}
            {(receipt.notes || receipt.terms) && (
              <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
                {receipt.notes && (
                  <div>
                    <span className="font-semibold text-slate-700 block">Notes:</span>
                    <p className="italic leading-relaxed">{receipt.notes}</p>
                  </div>
                )}
                {receipt.terms && (
                  <div>
                    <span className="font-semibold text-slate-700 block">Terms & Conditions:</span>
                    <p className="leading-relaxed">{receipt.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer Watermark */}
            <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400 font-mono">
              Issued by {receipt.businessName} • Verified by Verse Merchant OS Settlement Engine
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
