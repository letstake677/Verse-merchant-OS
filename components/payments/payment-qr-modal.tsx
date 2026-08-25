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
  CheckCircle2,
  Loader2,
  Smartphone,
  Globe,
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
import { buildEip681Uri } from "@/lib/payments/eip681"
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
  const [qrMode, setQrMode] = React.useState<"wallet" | "web">("wallet")
  const [qrSvg, setQrSvg] = React.useState<string>("")
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("")
  const [copiedLink, setCopiedLink] = React.useState<boolean>(false)
  const [copiedAddress, setCopiedAddress] = React.useState<boolean>(false)
  const [isLiveConfirmed, setIsLiveConfirmed] = React.useState<boolean>(false)
  const [confirmedTxHash, setConfirmedTxHash] = React.useState<string>("")

  const isPaid = invoice.status === "paid" || isLiveConfirmed

  // Construct canonical web checkout URL
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

  // Selected token object
  const currentToken = React.useMemo(() => {
    return availableTokens.find((t) => t.symbol === selectedSymbol) || availableTokens[0]
  }, [availableTokens, selectedSymbol])

  // Construct direct Web3 Wallet URI (EIP-681 standard)
  const eip681Uri = React.useMemo(() => {
    if (!merchantWalletAddress || !currentToken) return ""
    return buildEip681Uri({
      recipientAddress: merchantWalletAddress,
      chainId: selectedChainId,
      token: currentToken,
      amount: invoice.total,
    })
  }, [merchantWalletAddress, currentToken, selectedChainId, invoice.total])

  // The active payload to encode into the QR code
  const activeQrPayload = React.useMemo(() => {
    if (qrMode === "wallet" && eip681Uri) {
      return eip681Uri
    }
    return paymentUrl
  }, [qrMode, eip681Uri, paymentUrl])

  // Generate deterministic QR Code whenever active payload changes
  React.useEffect(() => {
    if (!activeQrPayload) return

    QRCode.toString(activeQrPayload, {
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

    QRCode.toDataURL(activeQrPayload, {
      margin: 1,
      width: 512,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error("[PaymentQRModal] DataURL generation error:", err))
  }, [activeQrPayload])

  // Real-time auto-polling listener while modal is open and unpaid
  React.useEffect(() => {
    if (!isOpen || isPaid) return

    const checkInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/invoices/${invoice.id}/verify-onchain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chainId: selectedChainId, tokenSymbol: selectedSymbol }),
        })
        const data = await res.json()
        if (data.ok && (data.isPaid || data.status === "paid")) {
          setIsLiveConfirmed(true)
          if (data.txHash) {
            setConfirmedTxHash(data.txHash)
          }
          toast({
            title: "Payment Received! 🎉",
            description: `Invoice #${invoice.invoiceNumber} has been verified on Polygon!`,
            type: "success",
          })
        }
      } catch {
        // Silent poll error
      }
    }, 3000)

    return () => clearInterval(checkInterval)
  }, [isOpen, isPaid, invoice.id, invoice.invoiceNumber, selectedChainId, selectedSymbol, toast])

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
        description={`Invoice #${invoice.invoiceNumber} • Polygon Web3 Settlement`}
        maxWidth="lg"
      >
        {isPaid ? (
          <div className="py-6 px-4 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Payment Confirmed! 🎉</h3>
              <p className="text-sm text-slate-600">
                Invoice <strong className="text-slate-900">#{invoice.invoiceNumber}</strong> has been successfully settled on Polygon.
              </p>
            </div>
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1.5 max-w-md mx-auto text-emerald-950">
              <div className="flex justify-between font-medium">
                <span>Total Settled:</span>
                <span className="font-extrabold">{invoice.total} {selectedSymbol}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Network:</span>
                <span>Polygon PoS (137)</span>
              </div>
              {confirmedTxHash && (
                <div className="flex justify-between font-medium items-center pt-1 border-t border-emerald-200/60">
                  <span>Tx Hash:</span>
                  <a
                    href={`https://polygonscan.com/tx/${confirmedTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-purple-700 hover:underline flex items-center gap-0.5"
                  >
                    {formatWalletAddress(confirmedTxHash)}
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                onClick={handlePrintQR}
                variant="outline"
                className="gap-1.5 text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </Button>
              <Button
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-1" id="payment-qr-modal-body">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setQrMode("wallet")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  qrMode === "wallet"
                    ? "bg-white text-purple-950 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span>Crypto Wallet Direct Scan (EIP-681)</span>
              </button>
              <button
                type="button"
                onClick={() => setQrMode("web")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  qrMode === "web"
                    ? "bg-white text-purple-950 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-slate-600" />
                <span>Web Checkout (Phone Camera)</span>
              </button>
            </div>

            {/* Main Grid */}
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
                    {qrMode === "wallet"
                      ? `Scan in MetaMask / Trust Wallet`
                      : `Scan with Phone Camera`}
                  </span>
                  <p className="text-[11px] text-slate-500 max-w-[210px] mx-auto leading-tight">
                    {qrMode === "wallet"
                      ? `Auto-fills ${invoice.total} ${selectedSymbol} directly in your wallet.`
                      : `Opens the hosted web checkout page.`}
                  </p>
                </div>

                {/* Live Payment Listener indicator */}
                <div className="flex items-center gap-1.5 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-medium">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                  <span>Listening for Polygon payment...</span>
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

              {/* Right Column: Invoice Details & Token Selection */}
              <div className="md:col-span-7 space-y-3">
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

                {/* Settlement Token Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Payment Asset on Polygon:
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      USDC / VERSE / POL
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
                            {t.isNative ? "Native" : "ERC-20"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Safety advice */}
                <div className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/60 text-amber-900 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-tight text-[10.5px]">
                    <strong>Direct Pay:</strong> Scanning with MetaMask or Trust Wallet automatically fills the exact {invoice.total} {selectedSymbol} transfer parameters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!isPaid && (
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
                <span>Open Checkout</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
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
