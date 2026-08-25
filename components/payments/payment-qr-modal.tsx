"use client"

import * as React from "react"
import QRCode from "qrcode"
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Printer,
  Download,
  ShieldCheck,
  AlertCircle,
  Coins,
  Wallet,
  Sparkles,
  ArrowUpRight,
} from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { Invoice } from "@/types/invoice"
import {
  POLYGON_MAINNET_CHAIN_ID,
  POLYGON_AMOY_CHAIN_ID,
  SUPPORTED_PAYMENT_TOKENS,
  PaymentToken,
} from "@/lib/payments/config"
import { PrintableQRPayment } from "@/components/payments/printable-qr-payment"

interface PaymentQRModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice
  merchantWalletAddress?: string
  businessName?: string
}

function formatWalletAddress(address?: string | null): string {
  if (!address || address.length < 10) return address || ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function PaymentQRModal({
  isOpen,
  onClose,
  invoice,
  merchantWalletAddress = "",
  businessName = "Verse Merchant",
}: PaymentQRModalProps) {
  const { toast } = useToast()

  // Default to Polygon Mainnet (137) and USDC
  const [selectedChainId, setSelectedChainId] = React.useState<number>(POLYGON_MAINNET_CHAIN_ID)
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>("USDC")
  const [qrSvg, setQrSvg] = React.useState<string>("")
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("")
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false)
  const [copiedAddress, setCopiedAddress] = React.useState<boolean>(false)

  // Reset to USDC on open
  React.useEffect(() => {
    if (isOpen) {
      setSelectedChainId(POLYGON_MAINNET_CHAIN_ID)
      setSelectedSymbol("USDC")
    }
  }, [isOpen])

  // Construct canonical payment URL
  const paymentUrl = React.useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/pay/${invoice.id}`
    }
    return `/pay/${invoice.id}`
  }, [invoice.id])

  // Supported tokens for active chain (USDC prioritized)
  const availableTokens: PaymentToken[] = React.useMemo(() => {
    return (
      SUPPORTED_PAYMENT_TOKENS[selectedChainId] ||
      SUPPORTED_PAYMENT_TOKENS[POLYGON_MAINNET_CHAIN_ID] ||
      []
    )
  }, [selectedChainId])

  // Generate deterministic QR Code (SVG and DataURL) whenever URL changes
  React.useEffect(() => {
    if (!paymentUrl) return

    QRCode.toString(paymentUrl, {
      type: "svg",
      margin: 1,
      width: 240,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error("[PaymentQRModal] SVG generation error:", err))

    QRCode.toDataURL(paymentUrl, {
      margin: 1,
      width: 512,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error("[PaymentQRModal] DataURL generation error:", err))
  }, [paymentUrl])

  // Copy Payment URL
  const handleCopyLink = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
      toast({
        title: "Payment link copied",
        description: "Public invoice checkout link copied to clipboard.",
        type: "success",
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually.",
        type: "error",
      })
    }
  }, [paymentUrl, toast])

  // Copy Merchant Receiving Address
  const handleCopyAddress = React.useCallback(async () => {
    if (!merchantWalletAddress) return
    try {
      await navigator.clipboard.writeText(merchantWalletAddress)
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
      toast({
        title: "Merchant address copied",
        description: "Polygon settlement wallet address copied to clipboard.",
        type: "success",
      })
    } catch {
      // Fallback
    }
  }, [merchantWalletAddress, toast])

  // Download QR Code image
  const handleDownloadQR = React.useCallback(() => {
    if (!qrDataUrl) return
    const a = document.createElement("a")
    a.href = qrDataUrl
    a.download = `verse-payment-${invoice.invoiceNumber}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast({
      title: "QR Code downloaded",
      description: `Saved as verse-payment-${invoice.invoiceNumber}.png`,
      type: "success",
    })
  }, [qrDataUrl, invoice.invoiceNumber, toast])

  // Print QR Slip
  const handlePrintQR = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }, [])

  const networkName =
    selectedChainId === POLYGON_AMOY_CHAIN_ID
      ? "Polygon Amoy (80002)"
      : "Polygon PoS (137)"

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="Pay Invoice via QR Code"
        description={`Invoice #${invoice.invoiceNumber} • Polygon USDC Settlement`}
        maxWidth="lg"
      >
        <div className="space-y-4 py-1" id="payment-qr-modal-body">
          {/* Main Grid: Responsive 2-Column on Desktop, Sleek Stack on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            
            {/* Left Column: QR Presentation */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2.5">
              {/* Badge for Network & Token */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100/80 border border-purple-200 rounded-full text-purple-900 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                <span>Polygon PoS • {selectedSymbol}</span>
              </div>

              {/* QR Container with fixed crisp aspect ratio */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs w-48 sm:w-52 aspect-square flex items-center justify-center">
                {qrSvg ? (
                  <div
                    className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-mono">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 block">
                  Scan to Pay in {selectedSymbol}
                </span>
                <p className="text-[11px] text-slate-500 max-w-[210px] mx-auto leading-tight">
                  Scan with your phone camera or mobile wallet to open checkout.
                </p>
              </div>

              {/* QR Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-0.5">
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  size="sm"
                  className="flex-1 min-h-[38px] text-xs font-semibold gap-1 text-slate-700 border-slate-200 hover:bg-white"
                  title="Download high-resolution QR PNG"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save QR</span>
                </Button>
                <Button
                  onClick={handlePrintQR}
                  variant="outline"
                  size="sm"
                  className="flex-1 min-h-[38px] text-xs font-semibold gap-1 text-slate-700 border-slate-200 hover:bg-white"
                  title="Print customer counter payment slip"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Slip</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Invoice Details & USDC Polygon Selection */}
            <div className="md:col-span-7 space-y-3">
              {/* Official Settlement Header */}
              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/70 text-purple-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-purple-900 block">
                    Authoritative Polygon Settlement Request
                  </span>
                  <p className="text-purple-800 text-[11px] leading-tight mt-0.5">
                    Official payment parameters for <strong>{businessName}</strong>.
                  </p>
                </div>
              </div>

              {/* Financial Breakdown Card */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Billed Total:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    ${invoice.total} <span className="text-[11px] uppercase text-slate-500 font-medium">{invoice.currency}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Settlement Amount:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-purple-700 text-sm">
                      {invoice.total} {selectedSymbol}
                    </span>
                    {selectedSymbol === "USDC" && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0">
                        1:1 USD
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Network Chain:</span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-semibold">
                    {networkName}
                  </Badge>
                </div>

                {merchantWalletAddress && (
                  <div className="pt-0.5 space-y-1">
                    <div className="flex justify-between items-center text-slate-500 text-[11px]">
                      <span className="font-medium">Merchant Receiving Address:</span>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        {copiedAddress ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-mono text-[11px] text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 break-all font-semibold select-all">
                      {merchantWalletAddress}
                    </p>
                  </div>
                )}
              </div>

              {/* Settlement Token Selector - USDC on Polygon Primary */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Payment Asset on Polygon:
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    USDC Recommended
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {availableTokens.map((t) => {
                    const isSelected = selectedSymbol === t.symbol
                    const isUsdc = t.symbol === "USDC"
                    return (
                      <button
                        key={t.symbol}
                        type="button"
                        onClick={() => setSelectedSymbol(t.symbol)}
                        className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                          isSelected
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{t.symbol}</span>
                          {isUsdc && (
                            <span className={`text-[8px] uppercase px-1 rounded font-extrabold ${isSelected ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"}`}>
                              Stable
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] opacity-75 font-normal">
                          {t.isNative ? "Native" : "Polygon PoS"}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Verification & Safety Advice */}
              <div className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/60 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-tight text-[10.5px]">
                  <strong>Safety Check:</strong> Verify recipient address and exact {selectedSymbol} amount before approving the transaction in your wallet.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3.5 border-t border-slate-100">
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto min-h-[38px] px-3.5 text-xs font-semibold text-slate-600 border-slate-200 order-2 sm:order-1"
          >
            Close
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto min-h-[38px] px-3 text-xs font-semibold gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            <a
              href={`/pay/${invoice.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center min-h-[38px] px-4 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shadow-xs"
            >
              <span>Pay in {selectedSymbol}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </Dialog>

      {/* Hidden container for clean print slip */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8">
        <PrintableQRPayment
          invoice={invoice}
          merchantWalletAddress={merchantWalletAddress}
          paymentUrl={paymentUrl}
          tokenSymbol={selectedSymbol}
          networkName={networkName}
          businessName={businessName}
        />
      </div>
    </>
  )
}
