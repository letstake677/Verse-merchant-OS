"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { Invoice } from "@/types/invoice"

interface PrintableQRPaymentProps {
  invoice: Invoice
  merchantWalletAddress?: string
  paymentUrl: string
  tokenSymbol?: string
  networkName?: string
  businessName?: string
}

function formatWalletAddress(address?: string): string {
  if (!address || address.length < 10) return address || ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function PrintableQRPayment({
  invoice,
  merchantWalletAddress,
  paymentUrl,
  tokenSymbol = "USDC",
  networkName = "Polygon Mainnet (137)",
  businessName = "Verse Merchant",
}: PrintableQRPaymentProps) {
  return (
    <div
      className="p-6 max-w-sm mx-auto bg-white text-slate-900 border-2 border-slate-900 rounded-2xl space-y-4 print:border-slate-900 print:shadow-none print:break-inside-avoid print:max-w-md"
      id="printable-qr-payment-slip"
    >
      {/* Header */}
      <div className="text-center border-b border-slate-200 pb-3">
        <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
          VERSE MERCHANT OS
        </span>
        <h2 className="text-base font-bold tracking-tight text-slate-900 mt-0.5">
          {businessName}
        </h2>
        <p className="font-mono text-xs font-semibold text-slate-700 mt-0.5">
          Invoice #{invoice.invoiceNumber}
        </p>
      </div>

      {/* Financial Details */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center space-y-1">
        <span className="text-[11px] text-slate-500 block">Amount Due</span>
        <p className="text-xl font-extrabold text-slate-900 tracking-tight">
          ${invoice.total}{" "}
          <span className="text-xs font-semibold text-slate-600 uppercase">
            {invoice.currency}
          </span>
        </p>
        <p className="text-[11px] font-semibold text-purple-700">
          Pay with {tokenSymbol} on {networkName}
        </p>
      </div>

      {/* QR Code Container */}
      <div className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        {paymentUrl ? (
          <div className="w-48 h-48 flex items-center justify-center">
            <QRCodeSVG
              value={paymentUrl}
              size={192}
              level="M"
              includeMargin={false}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-mono">
            Generating QR...
          </div>
        )}
        <p className="text-[11px] font-bold text-slate-800 mt-2 text-center">
          Scan with your phone or Web3 wallet
        </p>
      </div>

      {/* Recipient & Safety Instructions */}
      <div className="space-y-2 text-[11px] text-slate-600">
        {merchantWalletAddress && (
          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
            <span className="text-slate-500">Recipient:</span>
            <span className="font-bold text-slate-900">
              {formatWalletAddress(merchantWalletAddress)}
            </span>
          </div>
        )}
        <div className="p-2 rounded-lg bg-purple-50 text-purple-900 border border-purple-100 text-[10px] text-center font-medium">
          Verify the recipient address and amount on your wallet before confirming payment.
        </div>
      </div>

      {/* Footer link */}
      <div className="text-center pt-2 border-t border-slate-100">
        <p className="font-mono text-[9px] text-slate-400 truncate break-all">
          {paymentUrl}
        </p>
      </div>
    </div>
  )
}
