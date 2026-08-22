"use client"

export const dynamic = "force-dynamic"

import * as React from "react"
import { useParams } from "next/navigation"
import {
  FileText,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  ExternalLink,
} from "lucide-react"
import { Invoice } from "@/types/invoice"
import { Payment } from "@/types/payment"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { InvoicePaymentModal } from "@/components/invoices/invoice-payment-modal"
import { Button } from "@/components/ui/button"

function formatWalletAddress(address: string): string {
  if (!address || address.length < 10) return address || ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function PublicPayInvoicePage() {
  const params = useParams()
  const rawId = params?.id as string

  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [payment, setPayment] = React.useState<Payment | null>(null)
  const [merchantWalletAddress, setMerchantWalletAddress] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string>("")
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState<boolean>(false)

  const [reloadCounter, setReloadCounter] = React.useState(0)

  React.useEffect(() => {
    let isMounted = true
    if (!rawId) return

    fetch(`/api/invoices/${encodeURIComponent(rawId)}/payment`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Invoice not found or invalid link."))))
      .then((data) => {
        if (isMounted && data && data.ok && data.invoice) {
          setInvoice(data.invoice)
          if (data.payment) setPayment(data.payment)
          if (data.merchantWalletAddress) setMerchantWalletAddress(data.merchantWalletAddress)
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load invoice."
        if (isMounted) setError(msg)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [rawId, reloadCounter])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading Verse Invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Unable to Load Invoice</h2>
            <p className="text-xs text-slate-500 leading-relaxed">{error || "The requested invoice link is invalid or expired."}</p>
          </div>
        </div>
      </div>
    )
  }

  const isPaid = invoice.status === "paid"
  const isCancelled = invoice.status === "cancelled"
  const isDraft = invoice.status === "draft"
  const businessName = (invoice as any).businessName || "Verse Merchant"

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 py-6 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header / Merchant Branding */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
              {businessName.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 block">
                {businessName}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Verse Merchant OS • Polygon Web3 Checkout
              </span>
            </div>
          </div>
          <div className="self-start sm:self-auto">
            <StatusBadge status={invoice.status} size="default" />
          </div>
        </div>

        {/* Paid / Cancelled / Draft Banner */}
        {isPaid && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-xs font-bold">This Invoice Has Been Settled</h3>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Payment verified on Polygon blockchain.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {payment?.id && (
                <a
                  href={`/payments/${payment.id}/receipt`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-4 text-xs font-semibold text-emerald-900 bg-emerald-100/80 border border-emerald-300 rounded-lg hover:bg-emerald-200/80 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>View Official Receipt</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>
              )}
              <Button
                onClick={() => {
                  if (typeof window !== "undefined") window.print()
                }}
                variant="outline"
                size="sm"
                className="min-h-[44px] px-4 text-xs font-semibold gap-1.5 text-emerald-800 border-emerald-300 hover:bg-emerald-100/50"
              >
                <span>Print</span>
              </Button>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
            <div>
              <h3 className="text-xs font-bold">Invoice Cancelled</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                This invoice was cancelled by the merchant and can no longer accept payments.
              </p>
            </div>
          </div>
        )}

        {/* Invoice Main Card */}
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl font-bold font-mono tracking-tight text-slate-900">
                  {invoice.invoiceNumber}
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Billed to: <span className="font-semibold text-slate-800">{invoice.customerName}</span>
                  {invoice.customerEmail && ` (${invoice.customerEmail})`}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  ${invoice.total} <span className="text-xs font-semibold text-slate-500 uppercase">{invoice.currency}</span>
                </span>
                {merchantWalletAddress && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Settlement to {formatWalletAddress(merchantWalletAddress)}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Items Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Items</h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items?.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-3 font-medium text-slate-800">{item.description}</td>
                        <td className="p-3 text-center text-slate-600">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-600">${item.unitPrice}</td>
                        <td className="p-3 text-right font-semibold text-slate-900">${item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Breakdown */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>${invoice.subtotal}</span>
                </div>
                {parseFloat(invoice.taxAmount || "0") > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tax ({invoice.taxRate}%)</span>
                    <span>${invoice.taxAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Due</span>
                  <span>${invoice.total} {invoice.currency}</span>
                </div>
              </div>
            </div>

            {/* Pay Action Button */}
            {!isPaid && !isCancelled && !isDraft && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Button
                  onClick={() => setIsPaymentModalOpen(true)}
                  variant="primary"
                  size="lg"
                  className="w-full h-12 text-sm font-bold gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Invoice with Web3 Wallet (${invoice.total})</span>
                </Button>
                <p className="text-[11px] text-center text-slate-500">
                  Supported tokens: <span className="font-semibold text-slate-700">POL, USDC, VERSE</span> on Polygon Mainnet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal trigger */}
        {invoice && (
          <InvoicePaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            invoice={invoice}
            onPaymentSuccess={() => {
              setIsPaymentModalOpen(false)
              setReloadCounter((c) => c + 1)
            }}
          />
        )}
      </div>
    </div>
  )
}
