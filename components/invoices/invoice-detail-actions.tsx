"use client"

import * as React from "react"
import { Printer, Copy, Check, Share2, Edit3, XCircle, Wallet, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { InvoiceStatus } from "@/types/invoice"

interface InvoiceDetailActionsProps {
  invoiceNumber: string
  status?: InvoiceStatus
  onEdit?: () => void
  isEditable?: boolean
  onCancelInvoice?: () => void
  onPayInvoice?: () => void
  onShowQR?: () => void
}

function subscribe() {
  return () => {}
}

function getShareSnapshot() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function"
}

function getServerShareSnapshot() {
  return false
}

export function InvoiceDetailActions({
  invoiceNumber,
  status = "draft",
  onEdit,
  isEditable = true,
  onCancelInvoice,
  onPayInvoice,
  onShowQR,
}: InvoiceDetailActionsProps) {
  const { toast } = useToast()
  const [hasCopied, setHasCopied] = React.useState(false)
  const canShare = React.useSyncExternalStore(subscribe, getShareSnapshot, getServerShareSnapshot)

  const handleCopyLink = React.useCallback(async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(window.location.href)
      } else {
        // Fallback for environments where clipboard API might be restricted
        const textArea = document.createElement("textarea")
        textArea.value = window.location.href
        textArea.style.position = "fixed"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const successful = document.execCommand("copy")
        document.body.removeChild(textArea)
        if (!successful) throw new Error("Copy command failed")
      }

      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)

      toast({
        title: "Invoice link copied",
        description: "The invoice link has been copied to your clipboard.",
        type: "success",
      })
    } catch {
      toast({
        title: "Unable to copy link",
        description: "Please copy the URL from your browser.",
        type: "error",
      })
    }
  }, [toast])

  const handleShare = React.useCallback(async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return

    if (navigator.share && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Invoice ${invoiceNumber}`,
          text: "View this invoice",
          url: window.location.href,
        })
      } catch (err: unknown) {
        // If the user cancelled or aborted the share sheet, treat as normal behavior
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        // Graceful fallback to copying link on any other share failure
        handleCopyLink()
      }
    } else {
      // Fallback to copying link when Web Share API is not available
      handleCopyLink()
    }
  }, [invoiceNumber, handleCopyLink])

  const handlePrint = React.useCallback(() => {
    if (typeof window === "undefined") return
    window.print()
  }, [])

  const disabledEditReason =
    status === "paid"
      ? "Paid invoices cannot be edited."
      : status === "cancelled"
      ? "Cancelled invoices cannot be edited."
      : ""

  return (
    <div
      className="flex flex-wrap items-center gap-2 print:hidden"
      id="invoice-detail-actions-group"
    >
      {/* 0. Pay Invoice Web3 Action (for open or overdue invoices) */}
      {onPayInvoice && (status === "open" || status === "overdue") && (
        <Button
          variant="primary"
          size="sm"
          onClick={onPayInvoice}
          className="h-8 sm:h-9 px-3.5 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
          title="Pay this invoice with Web3 wallet on Polygon"
          aria-label="Pay invoice"
          id="pay-invoice-web3-button"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Pay Invoice</span>
        </Button>
      )}

      {/* 0.05. Show QR Code Payment Modal (for eligible invoices) */}
      {onShowQR && (
        <Button
          variant="outline"
          size="sm"
          onClick={onShowQR}
          className="h-8 sm:h-9 px-3 text-xs font-semibold gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
          title="Show scannable QR payment code for customer"
          aria-label="Show QR payment code"
          id="show-qr-invoice-button"
        >
          <QrCode className="w-3.5 h-3.5 text-purple-600" />
          <span>Show QR</span>
        </Button>
      )}

      {/* 0.1. Edit Invoice Action (when onEdit is supplied) */}
      {onEdit && (
        <Button
          variant="secondary"
          size="sm"
          onClick={isEditable ? onEdit : undefined}
          disabled={!isEditable}
          className={`h-8 sm:h-9 px-3 text-xs font-semibold gap-1.5 border-slate-200 ${
            isEditable
              ? "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
              : "text-slate-400 opacity-60 cursor-not-allowed"
          }`}
          title={isEditable ? "Edit invoice fields and recalculate totals" : disabledEditReason}
          aria-label={isEditable ? "Edit invoice" : disabledEditReason}
          aria-disabled={!isEditable}
          id="edit-invoice-button"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit Invoice</span>
        </Button>
      )}

      {/* 0.5. Cancel Invoice Action (when onCancelInvoice is supplied and status is cancellable) */}
      {onCancelInvoice && (status === "draft" || status === "open" || status === "overdue") && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onCancelInvoice}
          className="h-8 sm:h-9 px-3 text-xs font-semibold gap-1.5"
          title="Cancel this invoice"
          aria-label="Cancel invoice"
          id="cancel-invoice-action-button"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancel Invoice</span>
        </Button>
      )}

      {/* 1. Copy Link Action */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleCopyLink}
        className="h-8 sm:h-9 px-3 text-xs font-semibold gap-1.5 text-slate-700 hover:text-slate-900 border-slate-200"
        title="Copy invoice link to clipboard"
        aria-label="Copy invoice link to clipboard"
        id="copy-invoice-link-button"
      >
        {hasCopied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-500" />
        )}
        <span>{hasCopied ? "Copied" : "Copy Link"}</span>
      </Button>

      {/* 2. Share Action (with Web Share API or graceful Copy Link fallback) */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleShare}
        className="h-8 sm:h-9 px-3 text-xs font-semibold gap-1.5 text-slate-700 hover:text-slate-900 border-slate-200"
        title={canShare ? "Share this invoice" : "Share invoice link"}
        aria-label="Share invoice"
        id="share-invoice-button"
      >
        <Share2 className="w-3.5 h-3.5 text-slate-500" />
        <span>Share</span>
      </Button>

      {/* 3. Print Invoice Action */}
      <Button
        variant="primary"
        size="sm"
        onClick={handlePrint}
        className="h-8 sm:h-9 px-3.5 text-xs font-semibold gap-1.5"
        title="Print invoice document"
        aria-label="Print Invoice"
        id="print-invoice-button"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Print Invoice</span>
      </Button>
    </div>
  )
}
