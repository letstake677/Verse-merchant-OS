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
  Info,
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

  const [selectedChainId, setSelectedChainId] = React.useState<number>(POLYGON_MAINNET_CHAIN_ID)
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>("USDC")
  const [qrSvg, setQrSvg] = React.useState<string>("")
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("")
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false)
  const [copiedAddress, setCopiedAddress] = React.useState<boolean>(false)
  const [isPrintSlipOpen, setIsPrintSlipOpen] = React.useState<boolean>(false)

  // Construct canonical payment URL
  const paymentUrl = React.useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/pay/${invoice.id}`
    }
    return `/pay/${invoice.id}`
  }, [invoice.id])

  // Supported tokens for active chain
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
      width: 260,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error("[PaymentQRModal] SVG gen error:", err))

    QRCode.toDataURL(paymentUrl, {
      margin: 1,
      width: 512,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error("[PaymentQRModal] DataURL gen error:", err))
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
        description: "Settlement wallet address copied to clipboard.",
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
      : "Polygon Mainnet (137)"

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title="Pay Invoice via QR Code"
        description={`Invoice #${invoice.invoiceNumber} • Public Web3 Polygon Settlement`}
        maxWidth="lg"
      >
        <div className="space-y-5 py-2" id="payment-qr-modal-body">
          {/* Main 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left Column (5 cols on md): Crisp Scannable QR Presentation */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs max-w-[260px] w-full flex items-center justify-center">
                {qrSvg ? (
                  <div
                    className="w-full aspect-square flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-mono">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 block">
                  Scan with Phone or Web3 Wallet
                </span>
                <p className="text-[11px] text-slate-500 max-w-[220px] mx-auto leading-tight">
                  Point your phone camera or mobile wallet scanner to open the payment page.
                </p>
              </div>

              {/* QR Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-1">
                <Button
                  onClick={handleDownloadQR}
                  variant="outline"
                  size="sm"
                  className="flex-1 min-h-[44px] text-xs font-semibold gap-1.5 text-slate-700 border-slate-200 hover:bg-white"
                  title="Download high-resolution QR PNG"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save QR</span>
                </Button>
                <Button
                  onClick={handlePrintQR}
                  variant="outline"
                  size="sm"
                  className="flex-1 min-h-[44px] text-xs font-semibold gap-1.5 text-slate-700 border-slate-200 hover:bg-white"
                  title="Print customer counter payment slip"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </Button>
              </div>
            </div>

            {/* Right Column (7 cols on md): Authoritative Safety & Invoice Parameters */}
            <div className="md:col-span-7 space-y-4">
              {/* Prominent Verification & Safety Header */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 text-purple-950 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Authoritative Polygon Payment Request</span>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">
                  You are viewing official settlement parameters for{" "}
                  <strong>{businessName}</strong> Invoice #{invoice.invoiceNumber}.
                </p>
              </div>

              {/* Invoice Breakdown Parameters */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Billed Amount:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    ${invoice.total} <span className="text-xs uppercase text-slate-500">{invoice.currency}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Settlement Asset:</span>
                  <span className="font-bold text-slate-900">
                    {invoice.total} {selectedSymbol}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Network:</span>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-medium">
                    {networkName}
                  </Badge>
                </div>

                {merchantWalletAddress && (
                  <div className="pt-1 space-y-1">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="font-medium">Merchant Recipient Address:</span>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-semibold text-[11px] cursor-pointer"
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
                    <p className="font-mono text-[11px] text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100 break-all font-semibold">
                      {merchantWalletAddress}
                    </p>
                  </div>
                )}
              </div>

              {/* Supported Tokens Bar */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 block">
                  Accepted Settlement Tokens on Polygon:
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableTokens.map((t) => (
                    <button
                      key={t.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(t.symbol)}
                      className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedSymbol === t.symbol
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span>{t.symbol}</span>
                      <span className="text-[10px] opacity-80 font-normal">
                        ({t.isNative ? "Native" : "ERC-20"})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety Warning */}
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Verification Note:</strong> Always verify that the recipient address and payment amount in your Web3 wallet match the invoice details above before signing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-slate-100">
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto min-h-[44px] px-4 text-xs font-semibold text-slate-600 border-slate-200"
          >
            Close
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto min-h-[44px] px-4 text-xs font-semibold gap-1.5 text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Payment Link</span>
                </>
              )}
            </Button>

            <a
              href={`/pay/${invoice.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center min-h-[44px] px-5 text-xs font-bold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-xs"
            >
              <span>Open Public Checkout</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </Dialog>

      {/* Hidden container for print slip */}
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
