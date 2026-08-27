"use client"

import * as React from "react"
import { FileText, Calendar, CreditCard, Clock, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { InvoiceStatus } from "@/types/invoice"
import { Payment } from "@/types/payment"

interface InvoiceDetailSummaryProps {
  invoiceId?: string
  invoiceNumber: string
  status: InvoiceStatus
  currency: string
  createdAt?: string
  dueDate?: string
  paymentId?: string
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function InvoiceDetailSummary({
  invoiceId,
  invoiceNumber,
  status,
  currency,
  createdAt,
  dueDate,
  paymentId,
}: InvoiceDetailSummaryProps) {
  const formattedCreated = formatDisplayDate(createdAt)
  const formattedDue = dueDate ? formatDisplayDate(dueDate) : "Upon receipt"

  const [payment, setPayment] = React.useState<Payment | null>(null)
  const [isLoadingPayment, setIsLoadingPayment] = React.useState<boolean>(Boolean(invoiceId))

  React.useEffect(() => {
    if (!invoiceId) return

    let isMounted = true

    fetch(`/api/invoices/${encodeURIComponent(invoiceId)}/payment`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && data.ok) {
          setPayment(data.payment || null)
        }
      })
      .catch((err) => {
        console.error("[InvoiceDetailSummary] Error fetching payment state:", err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingPayment(false)
      })

    return () => {
      isMounted = false
    }
  }, [invoiceId])

  const getPaymentStatusBadge = (pStatus?: string) => {
    if (!pStatus) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <span>Unpaid</span>
        </span>
      )
    }
    return <StatusBadge status={pStatus as any} size="sm" />
  }

  return (
    <div className="space-y-4" id="invoice-detail-summary-container">
      {/* 1. Invoice Metadata Card */}
      <Card id="invoice-detail-metadata-card" className="print:shadow-none print:border-slate-300 print:bg-white print:break-inside-avoid">
        <CardHeader className="pb-3 border-b border-slate-100 print:border-slate-300">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 print:hidden" />
            <span>Invoice Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Invoice Number</span>
            <span className="font-mono font-bold text-slate-900">{invoiceNumber}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50 print:border-slate-200">
            <span className="text-slate-500">Status</span>
            <StatusBadge status={status} size="sm" />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50 print:border-slate-200">
            <span className="text-slate-500">Billing Currency</span>
            <span className="font-semibold text-slate-800 uppercase">{currency}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50 print:border-slate-200">
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400 print:hidden" />
              <span>Issued Date</span>
            </span>
            <span className="text-slate-800 font-medium">{formattedCreated}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-50 print:border-slate-200">
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400 print:hidden" />
              <span>Due Date</span>
            </span>
            <span className="text-slate-800 font-medium">{formattedDue}</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Payment Reference Card */}
      <Card id="invoice-detail-payment-ref-card" className="print:shadow-none print:border-slate-300 print:bg-white print:break-inside-avoid">
        <CardHeader className="pb-3 border-b border-slate-100 print:border-slate-300 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 print:hidden" />
            <span>Payment Settlement</span>
          </CardTitle>
          {getPaymentStatusBadge(payment?.status)}
        </CardHeader>
        <CardContent className="p-4 text-xs space-y-3">
          {isLoadingPayment ? (
            <div className="py-2 text-slate-400 text-xs flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Checking settlement status...</span>
            </div>
          ) : payment ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Intent</span>
                <span className="font-mono text-[11px] text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                  {payment.id}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <span className="text-slate-500">Settlement Network</span>
                <span className="font-medium text-slate-800 text-[11px]">
                  Polygon Mainnet (Chain ID 137)
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                <span className="text-slate-500">Requested Amount</span>
                <span className="font-semibold text-slate-900">
                  {payment.amount} {payment.token?.symbol || payment.currency}
                </span>
              </div>

              {payment.payerAddress && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-slate-500">Payer Wallet</span>
                  <span className="font-mono text-[11px] text-slate-800 font-medium truncate max-w-[160px]">
                    {payment.payerAddress}
                  </span>
                </div>
              )}

              {payment.recipientAddress && (
                <div className="pt-2 border-t border-slate-50 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Merchant Settlement Address</span>
                  <span className="font-mono text-[11px] text-slate-700 break-all bg-slate-50 p-1.5 rounded block border border-slate-100">
                    {payment.recipientAddress}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-50 space-y-1">
                <span className="text-slate-500 text-[11px] block">Transaction Hash</span>
                {payment.transactionHash ? (
                  <a
                    href={`https://polygonscan.com/tx/${payment.transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-indigo-600 hover:text-indigo-800 break-all flex items-center gap-1 bg-indigo-50/50 p-1.5 rounded border border-indigo-100"
                  >
                    <span className="truncate">{payment.transactionHash}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[11px] block">
                    No transaction submitted on-chain
                  </span>
                )}
              </div>

              {payment.id && (
                <div className="pt-3 border-t border-slate-100">
                  <a
                    href={`/payments/${payment.id}/receipt`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Official Payment Receipt</span>
                    <ExternalLink className="w-3 h-3 text-indigo-400" />
                  </a>
                </div>
              )}
            </>
          ) : paymentId ? (
            <div className="space-y-1.5">
              <span className="text-slate-500 block text-[11px]">Linked Payment ID</span>
              <span className="font-mono font-medium text-slate-800 text-xs break-all bg-slate-50 print:bg-slate-100 p-2 rounded-lg block border border-slate-100 print:border-slate-300">
                {paymentId}
              </span>
            </div>
          ) : (
            <div className="py-2 text-slate-400 italic text-xs">
              Payment not recorded.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
