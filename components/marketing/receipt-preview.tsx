"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  CheckCircle2,
  ExternalLink,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export interface ReceiptLineItem {
  name: string
  description?: string
  amount: string
}

export interface ReceiptPreviewProps {
  merchantName?: string
  invoiceNumber?: string
  amount?: string
  tokenAmount?: string
  lineItems?: ReceiptLineItem[]
  subtotal?: string
  total?: string
  paymentMethod?: string
  network?: string
  asset?: string
  date?: string
  txHash?: string
  receiptUrl?: string
  status?: "paid" | "verifying"
  onToggleStatus?: () => void
  className?: string
}

export function ReceiptPreview({
  merchantName = "ACME DESIGN",
  invoiceNumber = "INV-1024",
  amount = "$150.00",
  tokenAmount = "1,250,000 VERSE",
  lineItems = [
    { name: "Logo Design", description: "Primary brand identity & vector assets", amount: "$150.00" },
  ],
  subtotal = "$150.00",
  total = "$150.00",
  paymentMethod = "Verse",
  network = "Polygon",
  asset = "VERSE",
  date = "Aug 19, 2026",
  txHash = "0x8f3C78B401dE5b8...91ac",
  receiptUrl = "verse.os/receipt/rcpt_8f3a91ac",
  status = "paid",
  onToggleStatus,
  className,
}: ReceiptPreviewProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      id="receipt-card-container"
      className={cn(
        "w-full max-w-md mx-auto rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.07),0_4px_16px_-2px_rgba(0,0,0,0.03)] space-y-6 relative overflow-hidden",
        className
      )}
    >
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700" />

      {/* 1. Header Section with Success Hierarchy */}
      <div className="text-center space-y-2 pt-1">
        {status === "paid" ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PAYMENT RECEIVED</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>VERIFYING ON POLYGON</span>
          </div>
        )}

        {/* Large Amount */}
        <div className="space-y-0.5">
          <div className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight font-tabular">
            {amount}
          </div>
          <p className="text-xs font-medium text-slate-400 font-mono">
            {tokenAmount}
          </p>
        </div>

        {/* Merchant Name & Invoice Number */}
        <div className="pt-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-800 uppercase tracking-wide">
            {merchantName}
          </span>
          <span className="mx-1.5 text-slate-300">•</span>
          <span className="font-mono text-slate-500">Invoice #{invoiceNumber.replace("INV-", "")}</span>
        </div>
      </div>

      <Separator />

      {/* 2. Line Items Table */}
      <div className="space-y-3 text-xs">
        <div className="flex justify-between items-center text-slate-400 font-medium uppercase tracking-wider text-[10px]">
          <span>Description</span>
          <span>Amount</span>
        </div>

        {lineItems.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start">
            <div className="space-y-0.5 max-w-[70%]">
              <p className="font-semibold text-slate-900">{item.name}</p>
              {item.description && (
                <p className="text-[11px] text-slate-500">{item.description}</p>
              )}
            </div>
            <span className="font-semibold text-slate-900 font-tabular">{item.amount}</span>
          </div>
        ))}

        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="font-medium font-tabular text-slate-700">{subtotal}</span>
          </div>
          <div className="flex justify-between text-slate-900 font-semibold text-sm pt-1 border-t border-slate-200">
            <span>Total</span>
            <span className="font-bold font-tabular">{total}</span>
          </div>
        </div>
      </div>

      {/* 3. Transaction Details & Verification Box */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:p-4 text-xs space-y-2.5">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
          <span className="text-slate-500">Payment Status</span>
          <span className="font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Payment Method</span>
            <span className="font-medium text-slate-800">{paymentMethod}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Network</span>
            <span className="font-medium text-slate-800">{network}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Asset</span>
            <span className="font-semibold text-indigo-700">{asset}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Settlement Date</span>
            <span className="font-medium text-slate-700">{date}</span>
          </div>
        </div>

        {/* Monospace Transaction Reference */}
        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between font-mono text-[11px]">
          <span className="text-slate-400 font-sans text-[10px]">Transaction Ref</span>
          <span className="text-slate-800 font-semibold truncate ml-2">
            {txHash}
          </span>
        </div>
      </div>

      {/* 4. Shareable URL Box */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs">
        <div className="flex items-center gap-2 truncate mr-2">
          <span className="text-slate-400 text-[10px] uppercase font-semibold">URL</span>
          <span className="font-mono text-slate-700 text-[11px] truncate">
            {receiptUrl}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-white text-slate-500 hover:text-slate-900 transition-colors shrink-0 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Copy receipt link"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 5. Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (onToggleStatus) {
              onToggleStatus()
            }
          }}
          className="text-xs h-9 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Transaction</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleCopy}
          className="text-xs h-9 gap-1.5 shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share Receipt</span>
        </Button>
      </div>

      {/* 6. Minimal Footer */}
      <div className="pt-2 text-center text-[10px] text-slate-400 font-normal">
        Payment receipt generated by Verse Merchant OS
      </div>
    </div>
  )
}
