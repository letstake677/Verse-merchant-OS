"use client"

import * as React from "react"
import {
  X,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  FileText,
  CreditCard,
  Building2,
} from "lucide-react"
import { Payment } from "@/types/payment"
import { POLYGON_MAINNET_CHAIN_ID, POLYGON_AMOY_CHAIN_ID } from "@/lib/payments/config"

interface PaymentDetailModalProps {
  paymentId: string | null
  isOpen: boolean
  onClose: () => void
  onReconciled?: () => void
}

export function PaymentDetailModal({
  paymentId,
  isOpen,
  onClose,
  onReconciled,
}: PaymentDetailModalProps) {
  const [payment, setPayment] = React.useState<Payment | null>(null)
  const [invoiceNumber, setInvoiceNumber] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [isReconciling, setIsReconciling] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string>("")
  const [copiedField, setCopiedField] = React.useState<string | null>(null)
  const [reconcileMessage, setReconcileMessage] = React.useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  React.useEffect(() => {
    let isCancelled = false
    if (!isOpen || !paymentId) {
      return
    }

    const loadData = async () => {
      try {
        const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}`)
        const data = await res.json()
        if (isCancelled) return
        if (!data.ok || !data.payment) {
          setError(data.message || "Failed to load payment details.")
        } else {
          setPayment(data.payment)
          if (data.invoice?.invoiceNumber) {
            setInvoiceNumber(data.invoice.invoiceNumber)
          } else {
            setInvoiceNumber(data.payment.invoiceId)
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Error fetching payment details.")
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isCancelled = true
    }
  }, [isOpen, paymentId])

  if (!isOpen || !paymentId) return null

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleReconcile = async () => {
    if (!paymentId) return
    setIsReconciling(true)
    setReconcileMessage(null)

    try {
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/reconcile`, {
        method: "POST",
      })
      const data = await res.json()

      if (!res.ok || !data.ok) {
        setReconcileMessage({
          type: "error",
          text: data.message || "Reconciliation failed.",
        })
      } else {
        setReconcileMessage({
          type: "success",
          text: data.verification?.failureReason || `Payment reconciled on-chain. Status: ${data.payment.status.toUpperCase()}`,
        })
        if (data.payment) {
          setPayment(data.payment)
        }
        if (onReconciled) onReconciled()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reconciliation failed."
      setReconcileMessage({ type: "error", text: msg })
    } finally {
      setIsReconciling(false)
    }
  }

  const getExplorerUrl = (txHash?: string, chainId?: number) => {
    if (!txHash) return "#"
    const base =
      chainId === POLYGON_AMOY_CHAIN_ID
        ? "https://amoy.polygonscan.com/tx/"
        : "https://polygonscan.com/tx/"
    return `${base}${txHash}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Confirmed
          </span>
        )
      case "overpaid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Overpaid
          </span>
        )
      case "underpaid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Underpaid
          </span>
        )
      case "submitted":
      case "confirming":
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        )
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Payment Audit & Settlement</h2>
              <p className="text-xs text-slate-500 font-mono truncate max-w-[260px]">
                ID: {paymentId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
              <p className="text-sm font-medium">Loading blockchain settlement metadata...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : payment ? (
            <>
              {reconcileMessage && (
                <div
                  className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                    reconcileMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {reconcileMessage.type === "success" ? (
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{reconcileMessage.text}</span>
                </div>
              )}

              {/* Status Header */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Settlement Status</div>
                  <div className="mt-1">{getStatusBadge(payment.status)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 font-medium">Settled Amount</div>
                  <div className="text-lg font-bold text-slate-900">
                    {payment.amount} {payment.token?.symbol || payment.currency}
                  </div>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-400 font-medium flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Invoice Reference
                  </div>
                  <a
                    href={`/dashboard/invoices/${encodeURIComponent(payment.invoiceId)}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>{invoiceNumber || payment.invoiceId}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    Settlement Network
                  </div>
                  <div className="font-semibold text-slate-800">
                    {payment.chainId === POLYGON_AMOY_CHAIN_ID
                      ? "Polygon Amoy Testnet (80002)"
                      : "Polygon Mainnet (137)"}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-400 font-medium">Asset Class</div>
                  <div className="font-semibold text-slate-800">
                    {payment.token?.name || payment.currency} ({payment.token?.symbol || payment.currency})
                  </div>
                  {payment.token?.address && (
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      Contract: {payment.token.address}
                    </div>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                  <div className="text-slate-400 font-medium">Block Height</div>
                  <div className="font-mono font-semibold text-slate-800">
                    {payment.blockNumber ? `#${payment.blockNumber}` : "Pending Inclusion"}
                  </div>
                </div>
              </div>

              {/* Wallets & On-Chain Addresses */}
              <div className="space-y-3 pt-2">
                {/* Payer Wallet */}
                {payment.payerAddress && (
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-400 font-medium mb-1">Payer Wallet Address</div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-slate-800 break-all">
                        {payment.payerAddress}
                      </span>
                      <button
                        onClick={() => handleCopy(payment.payerAddress!, "payer")}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                        title="Copy Address"
                      >
                        {copiedField === "payer" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Merchant Wallet */}
                {payment.recipientAddress && (
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <div className="text-xs text-slate-400 font-medium mb-1">
                      Merchant Settlement Address
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-slate-800 break-all">
                        {payment.recipientAddress}
                      </span>
                      <button
                        onClick={() => handleCopy(payment.recipientAddress!, "merchant")}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                        title="Copy Address"
                      >
                        {copiedField === "merchant" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Transaction Hash */}
                {payment.transactionHash ? (
                  <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/60">
                    <div className="text-xs text-indigo-900 font-medium mb-1 flex items-center justify-between">
                      <span>On-Chain Transaction Hash</span>
                      <a
                        href={getExplorerUrl(payment.transactionHash, payment.chainId)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline text-[11px]"
                      >
                        <span>View on PolygonScan</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-indigo-950 break-all">
                        {payment.transactionHash}
                      </span>
                      <button
                        onClick={() => handleCopy(payment.transactionHash!, "txHash")}
                        className="p-1.5 text-indigo-400 hover:text-indigo-600 rounded shrink-0"
                        title="Copy Transaction Hash"
                      >
                        {copiedField === "txHash" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-800 italic">
                    No transaction hash has been submitted to the blockchain yet.
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <div>
                  <span className="block font-medium text-slate-400">Created At</span>
                  <span>{new Date(payment.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="block font-medium text-slate-400">Confirmed At</span>
                  <span>
                    {payment.confirmedAt
                      ? new Date(payment.confirmedAt).toLocaleString()
                      : "Unconfirmed"}
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {payment?.transactionHash && (
              <button
                onClick={handleReconcile}
                disabled={isReconciling}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? "animate-spin" : ""}`} />
                {isReconciling ? "Reconciling RPC..." : "Reconcile On-Chain"}
              </button>
            )}
            {payment?.id && (
              <a
                href={`/payments/${payment.id}/receipt`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>View Official Receipt</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
