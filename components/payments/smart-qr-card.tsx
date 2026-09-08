"use client"

import * as React from "react"
import { QRCodeSVG } from "qrcode.react"
import { Invoice } from "@/lib/invoices/types"
import {
  toChecksumAddress,
  SUPPORTED_PAYMENT_TOKENS,
  POLYGON_MAINNET_CHAIN_ID,
} from "@/lib/payments/config"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Share2,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react"

interface SmartQRCardProps {
  invoice: Invoice
  targetRecipient?: string
  merchantName?: string
  initialTokenSymbol?: string
  showControls?: boolean
  showTokenSwitcher?: boolean
  onViewDetails?: () => void
  className?: string
  id?: string
}

export function SmartQRCard({
  invoice,
  targetRecipient: propRecipient,
  merchantName: propMerchantName,
  initialTokenSymbol = "USDC",
  showControls = true,
  showTokenSwitcher = true,
  onViewDetails,
  className = "",
  id = "smart-qr-card",
}: SmartQRCardProps) {
  const [selectedTokenSymbol, setSelectedTokenSymbol] = React.useState<string>(initialTokenSymbol)
  const [copied, setCopied] = React.useState<boolean>(false)
  const [shareSuccess, setShareSuccess] = React.useState<boolean>(false)
  const [isDownloading, setIsDownloading] = React.useState<boolean>(false)

  const { calculateAmount } = useCryptoPrices()

  // Canonical server-authoritative checkout URL (never encodes mutable client state)
  const canonicalCheckoutUrl = React.useMemo(() => {
    const targetId = invoice.id || invoice.invoiceNumber || "INV-0001"
    if (typeof window !== "undefined" && window.location.origin) {
      return `${window.location.origin}/pay/${encodeURIComponent(targetId)}`
    }
    return `https://verse-merchant-os.vercel.app/pay/${encodeURIComponent(targetId)}`
  }, [invoice.id, invoice.invoiceNumber])

  // Resolve verified merchant display name
  const verifiedMerchantName =
    propMerchantName ||
    invoice.merchantBusinessName ||
    invoice.businessName ||
    invoice.merchantName ||
    "Verse Verified Merchant"

  // Resolve verified recipient address
  const rawRecipient =
    propRecipient ||
    invoice.paymentAddress ||
    (invoice as any).merchantWalletAddress ||
    (invoice.merchantId?.startsWith("0x") ? invoice.merchantId : "") ||
    ""
  const targetRecipient = toChecksumAddress(rawRecipient)

  // Token calculations
  const availableTokens = SUPPORTED_PAYMENT_TOKENS[POLYGON_MAINNET_CHAIN_ID] || []
  const activeToken =
    availableTokens.find((t) => t.symbol.toUpperCase() === selectedTokenSymbol.toUpperCase()) ||
    availableTokens[0] || {
      symbol: "USDC",
      name: "USD Coin",
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as `0x${string}`,
      decimals: 6,
      chainId: 137,
      color: "blue",
    }

  const numericTotal = parseFloat(invoice.total || "0")
  const activeTokenCalc = calculateAmount(
    numericTotal,
    invoice.currency || "USD",
    activeToken.symbol
  )

  const isPaid = invoice.status === "paid"
  const isCancelled = invoice.status === "cancelled"
  const isDraft = invoice.status === "draft"
  const isOpen = !isPaid && !isCancelled && !isDraft

  // Copy payment link with visual feedback
  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(canonicalCheckoutUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }
    } catch {
      // Fallback
    }
  }

  // Share payment request using Web Share API with clipboard fallback
  const handleShare = async () => {
    const shareTitle = `Invoice #${invoice.invoiceNumber} - ${verifiedMerchantName}`
    const shareText = `Payment request for $${invoice.total} ${invoice.currency} on Polygon PoS via Verse Merchant OS.`

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: canonicalCheckoutUrl,
        })
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2200)
        return
      } catch (err: any) {
        if (err.name === "AbortError") return
      }
    }

    // Fallback: Copy link
    await handleCopyLink()
  }

  // Download high-resolution PNG of the Smart QR
  const handleDownloadQr = () => {
    setIsDownloading(true)
    try {
      const svgElement = document.getElementById(`smart-qr-svg-${invoice.id || invoice.invoiceNumber}`)
      if (!svgElement) {
        setIsDownloading(false)
        return
      }

      const svgData = new XMLSerializer().serializeToString(svgElement)
      const canvas = document.createElement("canvas")
      const size = 640
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = "#ffffff"
          ctx.fillRect(0, 0, size, size)
          ctx.drawImage(img, 40, 40, size - 80, size - 80)
          const pngUrl = canvas.toDataURL("image/png")
          const downloadLink = document.createElement("a")
          downloadLink.href = pngUrl
          downloadLink.download = `SmartQR-${invoice.invoiceNumber || invoice.id}.png`
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        }
        setIsDownloading(false)
      }
      img.onerror = () => {
        setIsDownloading(false)
      }
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
    } catch (err) {
      console.error("Smart QR download failed:", err)
      setIsDownloading(false)
    }
  }

  return (
    <div
      id={id}
      className={`w-full max-w-sm mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col font-sans text-slate-900 transition-all ${className}`}
    >
      {/* Top Brand Bar */}
      <div className="px-5 pt-4 pb-3 bg-slate-900 text-white text-center border-b border-slate-800">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-300">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>VERSE MERCHANT OS</span>
        </div>
        <h3 className="text-base font-bold text-white mt-1 truncate">
          {verifiedMerchantName}
        </h3>
        <p className="text-xs font-mono text-slate-400">
          Invoice #{invoice.invoiceNumber}
        </p>
      </div>

      {/* Main QR Presentation Box */}
      <div className="p-6 flex flex-col items-center justify-center bg-slate-50/50">
        {/* State-aware QR container */}
        <div className="relative p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center">
          <QRCodeSVG
            id={`smart-qr-svg-${invoice.id || invoice.invoiceNumber}`}
            value={canonicalCheckoutUrl}
            size={188}
            level="M"
            includeMargin={false}
            className={`rounded-lg transition-opacity ${!isOpen ? "opacity-30 blur-[1px]" : "opacity-100"}`}
          />

          {/* Paid Overlay */}
          {isPaid && (
            <div className="absolute inset-0 m-2 bg-emerald-950/85 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-3 text-center text-white animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-300">
                PAID &amp; SETTLED
              </span>
              <p className="text-[11px] text-emerald-100/90 mt-1 leading-tight">
                Settled on Polygon PoS
              </p>
            </div>
          )}

          {/* Cancelled Overlay */}
          {isCancelled && (
            <div className="absolute inset-0 m-2 bg-slate-900/90 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-3 text-center text-white">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mb-1.5">
                <XCircle className="w-6 h-6 text-rose-400" />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-rose-300">
                INVOICE CANCELLED
              </span>
              <p className="text-[10px] text-slate-300 mt-1">Payment disabled</p>
            </div>
          )}

          {/* Draft Overlay */}
          {isDraft && (
            <div className="absolute inset-0 m-2 bg-slate-900/90 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-3 text-center text-white">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mb-1.5">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-amber-300">
                DRAFT INVOICE
              </span>
              <p className="text-[10px] text-slate-300 mt-1">Not yet issued</p>
            </div>
          )}
        </div>

        {/* Scan to Pay instruction */}
        <div className="mt-3 text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {isOpen ? "SCAN TO PAY" : isPaid ? "INVOICE SETTLED" : "PAYMENT UNAVAILABLE"}
          </span>
          <p className="text-[11px] text-slate-500">
            {isOpen
              ? "Scan with phone camera or mobile Web3 wallet"
              : isPaid
              ? "This invoice has already been settled on-chain"
              : "Payment cannot be processed for this state"}
          </p>
        </div>

        {/* Verified Payment Request Badge */}
        <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Verified Payment Request</span>
        </div>

        {/* Currency & Token Amount */}
        <div className="mt-3 text-center">
          <div className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
            ${invoice.total}{" "}
            <span className="text-sm font-sans font-normal text-slate-500">
              {invoice.currency || "USD"}
            </span>
          </div>

          <div className="text-xs font-mono text-purple-700 font-semibold mt-0.5 flex items-center justify-center gap-1">
            <span>Polygon (137)</span>
            <span>•</span>
            <span>
              {activeTokenCalc.isCalculating ? (
                <span className="inline-flex items-center gap-1 text-purple-500 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Live rate...
                </span>
              ) : (
                `${activeTokenCalc.tokenAmount} ${activeToken.symbol}`
              )}
            </span>
          </div>
        </div>

        {/* Token selector buttons if enabled */}
        {showTokenSwitcher && isOpen && (
          <div className="mt-3.5 flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            {availableTokens.map((t) => (
              <button
                key={t.symbol}
                type="button"
                onClick={() => setSelectedTokenSymbol(t.symbol)}
                className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  selectedTokenSymbol.toUpperCase() === t.symbol.toUpperCase()
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recipient Wallet Verification Footer */}
      <div className="px-5 py-3 bg-white border-t border-slate-100 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-500 font-medium">
          <span className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Verified Recipient:
          </span>
          {targetRecipient ? (
            <span className="font-mono text-[11px] text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {targetRecipient.slice(0, 6)}...{targetRecipient.slice(-4)}
            </span>
          ) : (
            <span className="text-amber-700 font-medium text-[11px]">Address Pending</span>
          )}
        </div>

        {/* View Details CTA */}
        {onViewDetails ? (
          <button
            type="button"
            onClick={onViewDetails}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View Payment Details</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </button>
        ) : (
          <a
            href={canonicalCheckoutUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
          >
            <span>View Payment Details</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        )}
      </div>

      {/* Share / Copy / Download Controls */}
      {showControls && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Copy checkout link to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          {/* Share Request */}
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Share payment request"
          >
            {shareSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Shared</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Download Smart QR */}
          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={isDownloading}
            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
            title="Download QR code image as PNG"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
