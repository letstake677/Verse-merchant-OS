"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { Invoice } from "@/lib/invoices/types"
import { SUPPORTED_PAYMENT_TOKENS, MERCHANT_RECEIVING_ADDRESS } from "@/lib/payments/config"
import { POLYGON_MAINNET_CHAIN_ID, POLYGON_AMOY_CHAIN_ID } from "@/lib/web3/config"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"
import { X, Copy, Check, QrCode, RefreshCw, ExternalLink, Loader2 } from "lucide-react"

interface PaymentQrModalProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
}

export function PaymentQrModal({ invoice, isOpen, onClose }: PaymentQrModalProps) {
  const [selectedChainId, setSelectedChainId] = React.useState<number>(POLYGON_MAINNET_CHAIN_ID)
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>("USDC")
  const [copied, setCopied] = React.useState<boolean>(false)
  const { prices, calculateAmount, refreshPrices, isLoading: pricesLoading, isCalculating } = useCryptoPrices()

  const availableTokens =
    SUPPORTED_PAYMENT_TOKENS[selectedChainId] ||
    SUPPORTED_PAYMENT_TOKENS[POLYGON_MAINNET_CHAIN_ID] ||
    []

  const activeToken =
    availableTokens.find((t) => t.symbol.toUpperCase() === selectedSymbol.toUpperCase()) ||
    availableTokens[0] || {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as `0x${string}`,
      decimals: 6,
      chainId: 137,
      color: "blue",
    }

  const invoiceAmountNum = parseFloat(invoice.total || "0")
  const tokenCalc = calculateAmount(invoiceAmountNum, invoice.currency || "USD", activeToken.symbol)
  const recipient = invoice.paymentAddress || MERCHANT_RECEIVING_ADDRESS

  // Generate EIP-681 compatible QR standard uri
  let qrData = ""
  if (activeToken.isNative) {
    // ethereum:0xRecipient@137?value=1.5e17
    qrData = `ethereum:${recipient}@${selectedChainId}?value=${tokenCalc.tokenAmount}`
  } else {
    // ethereum:0xContract@137/transfer?address=0xRecipient&uint256=1000000
    qrData = `ethereum:${activeToken.address}@${selectedChainId}/transfer?address=${recipient}&uint256=${tokenCalc.tokenAmount}`
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(recipient)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-semibold text-slate-900">Scan & Pay</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Asset Switcher */}
          <div className="grid grid-cols-3 gap-2">
            {availableTokens.map((token) => {
              const calc = calculateAmount(invoiceAmountNum, invoice.currency || "USD", token.symbol)
              const isSelected = selectedSymbol.toUpperCase() === token.symbol.toUpperCase()
              return (
                <button
                  key={token.symbol}
                  onClick={() => setSelectedSymbol(token.symbol)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-sm"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 font-medium"
                  }`}
                >
                  <div className="text-xs">{token.symbol}</div>
                  <div className="text-[11px] text-purple-600 font-mono mt-0.5 truncate">
                    {calc.isCalculating ? "Calculating..." : calc.tokenAmount}
                  </div>
                </button>
              )
            })}
          </div>

          {/* QR Container */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
              <QRCodeSVG
                value={qrData}
                size={180}
                level="M"
                includeMargin={false}
                imageSettings={{
                  src: "/favicon.ico",
                  x: undefined,
                  y: undefined,
                  height: 24,
                  width: 24,
                  excavate: true,
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <div className="text-xl font-mono font-bold text-slate-900">
                {tokenCalc.isCalculating ? (
                  <span className="inline-flex items-center gap-1 text-sm text-purple-600 font-mono animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" /> Calculating rate...
                  </span>
                ) : (
                  `${tokenCalc.tokenAmount} ${activeToken.symbol}`
                )}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {tokenCalc.isCalculating ? (
                  "Fetching live Polygon price feed..."
                ) : (
                  `≈ $${invoice.total} USD (1 ${activeToken.symbol} = ${tokenCalc.formattedRate})`
                )}
              </div>
            </div>
          </div>

          {/* Wallet Address Copy */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Merchant Polygon Receiving Address
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-mono text-xs text-slate-700 truncate flex-1">{recipient}</span>
              <button
                onClick={handleCopy}
                className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-white rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
