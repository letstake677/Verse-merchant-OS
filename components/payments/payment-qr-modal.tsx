"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { Invoice } from "@/lib/invoices/types"
import { generatePayUrl } from "@/lib/invoices/invoice-link"
import {
  SUPPORTED_PAYMENT_TOKENS,
  MERCHANT_RECEIVING_ADDRESS,
  toChecksumAddress,
  POLYGON_MAINNET_CHAIN_ID,
} from "@/lib/payments/config"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"
import { parseUnits } from "viem"
import {
  X,
  Copy,
  Check,
  QrCode,
  RefreshCw,
  Loader2,
  Printer,
  Smartphone,
  CheckCircle2,
} from "lucide-react"

interface PaymentQrModalProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
  onPaid?: () => void
}

function safeParseBaseUnits(amountStr: string, decimals: number): string {
  try {
    const cleaned = amountStr.replace(/,/g, "").trim()
    const parts = cleaned.split(".")
    let formatted = parts[0] || "0"
    if (parts[1]) {
      formatted += "." + parts[1].slice(0, decimals)
    }
    return parseUnits(formatted, decimals).toString()
  } catch {
    return "0"
  }
}

export function PaymentQrModal({ invoice, isOpen, onClose, onPaid }: PaymentQrModalProps) {
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>("USDC")
  const [qrType, setQrType] = React.useState<"eip681" | "address" | "link">("eip681")
  const [copied, setCopied] = React.useState<boolean>(false)
  const [isDetectedPaid, setIsDetectedPaid] = React.useState<boolean>(invoice.status === "paid")
  const [manualTxHash, setManualTxHash] = React.useState<string>("")
  const [isVerifyingTx, setIsVerifyingTx] = React.useState<boolean>(false)
  const [txError, setTxError] = React.useState<string | null>(null)

  const { calculateAmount, refreshPrices, isLoading: pricesLoading } = useCryptoPrices()

  // Polling for automated payment detection while QR code is open
  React.useEffect(() => {
    if (!isOpen || isDetectedPaid) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoice.id}/verify-onchain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenSymbol: selectedSymbol }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.isPaid || data.status === "paid") {
            setIsDetectedPaid(true)
            if (onPaid) onPaid()
          }
        }
      } catch {
        // Continue polling
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isOpen, invoice.id, isDetectedPaid, onPaid, selectedSymbol])

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualTxHash.trim()) {
      setTxError("Please enter a transaction hash.")
      return
    }
    const cleanHash = manualTxHash.trim()
    if (!/^0x[a-fA-F0-9]{64}$/.test(cleanHash)) {
      setTxError("Invalid transaction hash format (must start with 0x and be 66 characters long).")
      return
    }

    setIsVerifyingTx(true)
    setTxError(null)

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/verify-onchain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHash: cleanHash,
          tokenSymbol: selectedSymbol,
        }),
      })

      const data = await res.json()
      if (data.ok && (data.isPaid || data.status === "paid")) {
        setIsDetectedPaid(true)
        if (onPaid) onPaid()
      } else {
        setTxError(data.message || "Could not verify transaction on Polygon. Please check the hash.")
      }
    } catch {
      setTxError("Network error while verifying transaction.")
    } finally {
      setIsVerifyingTx(false)
    }
  }

  const availableTokens = SUPPORTED_PAYMENT_TOKENS[POLYGON_MAINNET_CHAIN_ID] || []

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
  const recipient = toChecksumAddress(invoice.paymentAddress || MERCHANT_RECEIVING_ADDRESS)

  // Construct standard EIP-681 payment URI with raw integer base units for wallets
  const baseUnits = safeParseBaseUnits(tokenCalc.tokenAmount, activeToken.decimals)

  let eip681Uri = ""
  if (activeToken.isNative) {
    // Native POL on Polygon (Chain ID 137)
    eip681Uri = `ethereum:${recipient}@137?value=${baseUnits}`
  } else {
    // ERC-20 token transfer on Polygon (Chain ID 137)
    const tokenContract = toChecksumAddress(activeToken.address)
    eip681Uri = `ethereum:${tokenContract}@137/transfer?address=${recipient}&uint256=${baseUnits}`
  }

  // Determine actual QR data depending on user preference
  const checkoutUrl = generatePayUrl(invoice)

  let activeQrValue = eip681Uri
  if (qrType === "address") {
    activeQrValue = recipient
  } else if (qrType === "link") {
    activeQrValue = checkoutUrl
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(recipient)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenWalletDeepLink = () => {
    if (typeof window !== "undefined") {
      window.location.href = eip681Uri
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Scan & Pay</h3>
              <p className="text-[11px] text-slate-500">Auto-detects amount & token in mobile wallets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {isDetectedPaid ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Payment Verified!</h4>
              <p className="text-sm text-slate-600 max-w-xs mx-auto">
                Payment for invoice <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span> has been confirmed on Polygon.
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Asset Switcher */}
              <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Select Payment Currency</span>
              <button
                onClick={() => refreshPrices()}
                className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:underline cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${pricesLoading ? "animate-spin" : ""}`} />
                Live Rates
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {availableTokens.map((token) => {
                const calc = calculateAmount(invoiceAmountNum, invoice.currency || "USD", token.symbol)
                const isSelected = selectedSymbol.toUpperCase() === token.symbol.toUpperCase()
                return (
                  <button
                    key={token.symbol}
                    onClick={() => setSelectedSymbol(token.symbol)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? "border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-sm ring-1 ring-purple-600/30"
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
          </div>

          {/* QR Code Presentation Box */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
            {/* Format Mode Tabs */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg mb-3.5 text-xs font-medium w-full">
              <button
                type="button"
                onClick={() => setQrType("eip681")}
                className={`flex-1 py-1 px-2 rounded-md transition-all text-center cursor-pointer ${
                  qrType === "eip681"
                    ? "bg-white text-purple-950 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Auto-Fill Pay
              </button>
              <button
                type="button"
                onClick={() => setQrType("address")}
                className={`flex-1 py-1 px-2 rounded-md transition-all text-center cursor-pointer ${
                  qrType === "address"
                    ? "bg-white text-purple-950 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Address Only
              </button>
              <button
                type="button"
                onClick={() => setQrType("link")}
                className={`flex-1 py-1 px-2 rounded-md transition-all text-center cursor-pointer ${
                  qrType === "link"
                    ? "bg-white text-purple-950 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Checkout Link
              </button>
            </div>

            {/* The SVG QR code */}
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
              <QRCodeSVG
                value={activeQrValue}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Price / Amount Headline */}
            <div className="mt-3.5 text-center">
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
                  `≈ $${invoice.total} USD on Polygon Mainnet (137)`
                )}
              </div>
            </div>

            {/* EIP-681 Helper Badge */}
            {qrType === "eip681" && (
              <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pre-fills {tokenCalc.tokenAmount} {activeToken.symbol} in MetaMask, Trust Wallet & Phantom</span>
              </div>
            )}
          </div>

          {/* Deep Link Button for Mobile Users */}
          <button
            type="button"
            onClick={handleOpenWalletDeepLink}
            className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open in Installed Crypto Wallet App</span>
          </button>

          {/* Merchant Address Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Merchant Polygon Receiving Address
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-mono text-xs text-slate-700 truncate flex-1">{recipient}</span>
              <button
                onClick={handleCopyAddress}
                className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-white rounded-lg transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Manual Transaction Verification Form & Auto Check Button */}
          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                </span>
                <span className="text-xs font-semibold text-purple-950">Auto-scanning Polygon network</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setIsVerifyingTx(true)
                  setTxError(null)
                  try {
                    const res = await fetch(`/api/invoices/${invoice.id}/verify-onchain`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ tokenSymbol: selectedSymbol }),
                    })
                    const data = await res.json()
                    if (data.isPaid || data.status === "paid") {
                      setIsDetectedPaid(true)
                      if (onPaid) onPaid()
                    } else {
                      setTxError("No new transaction detected for this invoice yet. If you completed payment, paste your Tx Hash below.")
                    }
                  } catch {
                    setTxError("Verification check failed. Please check network connection.")
                  } finally {
                    setIsVerifyingTx(false)
                  }
                }}
                disabled={isVerifyingTx}
                className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
              >
                {isVerifyingTx ? <Loader2 className="w-3 h-3 animate-spin text-purple-700" /> : <RefreshCw className="w-3 h-3 text-purple-700" />}
                <span>Check Now</span>
              </button>
            </div>

            <form onSubmit={handleManualVerify} className="space-y-1.5 pt-1 border-t border-purple-100">
              <label className="text-[11px] font-medium text-slate-600 block">
                Optionally paste Tx Hash if auto-detect is delayed:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualTxHash}
                  onChange={(e) => setManualTxHash(e.target.value)}
                  placeholder="Polygon transaction hash (0x...)"
                  className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <button
                  type="submit"
                  disabled={isVerifyingTx}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-xs"
                >
                  {isVerifyingTx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify Hash"}
                </button>
              </div>
              {txError && <p className="text-[11px] text-red-600 font-medium">{txError}</p>}
            </form>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
            <button
              onClick={() => {
                if (typeof window !== "undefined") window.print()
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer print:hidden shadow-xs"
              id="print-qr-code-button"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print QR Payment Code</span>
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
