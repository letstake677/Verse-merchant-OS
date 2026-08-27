"use client"

export const dynamic = "force-dynamic"

import * as React from "react"
import { useParams } from "next/navigation"
import { Invoice } from "@/lib/invoices/types"
import { InvoicePaymentModal } from "@/components/invoices/invoice-payment-modal"
import { PaymentQrModal } from "@/components/payments/payment-qr-modal"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"
import { useAppKit } from "@reown/appkit/react"
import { useAccount } from "wagmi"
import { formatWalletAddress } from "@/lib/utils/wallet"
import { QRCodeSVG } from "qrcode.react"
import {
  SUPPORTED_PAYMENT_TOKENS,
  POLYGON_MAINNET_CHAIN_ID,
  MERCHANT_RECEIVING_ADDRESS,
  toChecksumAddress,
} from "@/lib/payments/config"
import {
  Zap,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  Wallet,
  Copy,
  Check,
  Printer,
  ArrowRight,
  Sparkles,
} from "lucide-react"

function safeParseBaseUnits(amountStr: string, decimals: number): string {
  try {
    const clean = amountStr.replace(/,/g, "").trim()
    const num = parseFloat(clean)
    if (isNaN(num) || num <= 0) return "0"
    const [whole = "0", frac = ""] = clean.split(".")
    const paddedFrac = frac.slice(0, decimals).padEnd(decimals, "0")
    const wholeBig = BigInt(whole) * BigInt(10 ** decimals)
    const fracBig = BigInt(paddedFrac)
    return (wholeBig + fracBig).toString()
  } catch {
    return "0"
  }
}

export default function PublicPayPage() {
  const params = useParams()
  const rawId = params?.id
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : ""
  
  const { open } = useAppKit()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => { setMounted(true) }, [])
  const { address, isConnected } = useAccount()

  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  
  // Payment Mode / Modals
  const [activeTab, setActiveTab] = React.useState<"wallet" | "qr">("wallet")
  const [selectedTokenSymbol, setSelectedTokenSymbol] = React.useState<string>("USDC")
  const [isPayOpen, setIsPayOpen] = React.useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false)
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  const { calculateAmount, refreshPrices, isCalculating } = useCryptoPrices()

  const fetchInvoice = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const cleanId = decodeURIComponent(id).trim()
      const res = await fetch(`/api/invoices/${encodeURIComponent(cleanId)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.invoice) {
          setInvoice(data.invoice)
        } else {
          setError("Invoice record not found.")
        }
      } else {
        setError("Invoice not found. Please verify the payment link with your merchant.")
      }
    } catch {
      setError("Failed to connect to invoice settlement service.")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  // Real-time background auto-verification polling (checks for on-chain incoming funds)
  React.useEffect(() => {
    if (!invoice || invoice.status === "paid") return

    const pollTimer = setInterval(async () => {
      try {
        const cleanId = invoice.id || invoice.invoiceNumber
        const res = await fetch(`/api/invoices/${encodeURIComponent(cleanId)}/verify-onchain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.isPaid || data.status === "paid") {
            setInvoice(data.invoice || { ...invoice, status: "paid" })
          }
        }
      } catch {
        // Silently retry in background
      }
    }, 3500)

    return () => clearInterval(pollTimer)
  }, [invoice])

  const copyToClipboard = (text: string, fieldId: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
    setCopiedField(fieldId)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center space-y-4 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">Loading Invoice Details</h3>
            <p className="text-xs text-slate-500">Connecting to Polygon settlement node...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900">Invoice Not Found</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {error || "The requested invoice could not be located. Please check the URL or contact the merchant."}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => fetchInvoice()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Search</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isPaid = invoice.status === "paid"
  const numericTotal = parseFloat(invoice.total || "0")
  const polCalc = calculateAmount(numericTotal, invoice.currency || "USD", "POL")
  const verseCalc = calculateAmount(numericTotal, invoice.currency || "USD", "VERSE")
  const usdcCalc = calculateAmount(numericTotal, invoice.currency || "USD", "USDC")

  const availableTokens = SUPPORTED_PAYMENT_TOKENS[POLYGON_MAINNET_CHAIN_ID] || []
  const activeQrToken =
    availableTokens.find((t) => t.symbol.toUpperCase() === selectedTokenSymbol.toUpperCase()) ||
    availableTokens[0]

  const activeTokenCalc = calculateAmount(
    numericTotal,
    invoice.currency || "USD",
    activeQrToken.symbol
  )

  const targetRecipient = toChecksumAddress(
    invoice.paymentAddress || MERCHANT_RECEIVING_ADDRESS
  )

  const tokenBaseUnits = safeParseBaseUnits(
    activeTokenCalc.tokenAmount,
    activeQrToken.decimals
  )

  // Construct standard EIP-681 Web3 Payment URI for mobile wallets
  let eip681Uri = ""
  if (activeQrToken.isNative) {
    eip681Uri = `ethereum:${targetRecipient}@137?value=${tokenBaseUnits}`
  } else {
    const tokenContract = toChecksumAddress(activeQrToken.address)
    eip681Uri = `ethereum:${tokenContract}@137/transfer?address=${targetRecipient}&uint256=${tokenBaseUnits}`
  }

  const publicCheckoutUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/pay/${invoice.id || invoice.invoiceNumber}`
      : `/pay/${invoice.id || invoice.invoiceNumber}`

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900 flex flex-col font-sans selection:bg-purple-100">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight">VersePay Checkout</span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2 font-medium">
                Public Settlement Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => open()}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-purple-600" />
              <span>{mounted && isConnected && address ? formatWalletAddress(address) : "Connect Wallet"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Checkout Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 md:p-8 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60">
                  Polygon PoS Invoice
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isPaid
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {isPaid ? "Paid & Settled" : "Pending Payment"}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>Billed to: <strong className="text-slate-200">{invoice.customerName}</strong></span>
                {invoice.dueDate && <span>Due: <strong className="text-slate-200">{invoice.dueDate}</strong></span>}
              </div>
            </div>

            <div className="text-left md:text-right bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 md:bg-transparent md:p-0 md:border-0">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Due</div>
              <div className="text-3xl md:text-4xl font-extrabold font-mono text-purple-300">
                ${invoice.total} <span className="text-base text-slate-400 font-sans font-normal">{invoice.currency}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Instant settlement with zero chargebacks</div>
            </div>
          </div>

          {/* Receiving Merchant Info Pill */}
          <div className="px-6 py-3 bg-purple-50/60 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Merchant Receiving Wallet:</span>
              <span className="font-mono font-bold text-purple-950 bg-white px-2 py-0.5 rounded border border-purple-200">
                {targetRecipient.slice(0, 8)}...{targetRecipient.slice(-6)}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(targetRecipient, "merchant_wallet")}
              className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-semibold text-xs transition-colors"
            >
              {copiedField === "merchant_wallet" ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedField === "merchant_wallet" ? "Address Copied" : "Copy Wallet"}</span>
            </button>
          </div>

          {/* Paid Banner or Payment Methods */}
          {isPaid ? (
            <div className="p-6 md:p-8 space-y-6 text-center bg-emerald-50/30">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-slate-900">Payment Successfully Confirmed!</h3>
                <p className="text-sm text-slate-600">
                  This invoice has been settled on the Polygon PoS network. A cryptographic receipt has been generated.
                </p>
              </div>

              {invoice.payments && invoice.payments.length > 0 && (
                <div className="max-w-lg mx-auto p-4 bg-white rounded-xl border border-emerald-200/80 shadow-xs text-left text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Transaction Hash:</span>
                    <a
                      href={`https://polygonscan.com/tx/${invoice.payments[0].txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-purple-700 hover:underline flex items-center gap-1 font-bold"
                    >
                      {invoice.payments[0].txHash.slice(0, 10)}...{invoice.payments[0].txHash.slice(-8)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Settled Asset:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {invoice.payments[0].amount} {invoice.payments[0].token.symbol}
                    </span>
                  </div>
                  {invoice.paidAt && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Settled At:</span>
                      <span className="font-mono text-slate-800">{new Date(invoice.paidAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official Receipt
                </button>
                <button
                  onClick={() => copyToClipboard(publicCheckoutUrl, "receipt_link")}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedField === "receipt_link" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedField === "receipt_link" ? "Link Copied" : "Copy Receipt Link"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 md:p-8 space-y-6">
              {/* Payment Option Selector (2 Clear Choices) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Select Payment Method
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Polygon PoS (Instant & Low Gas)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Browser Web3 Wallet */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("wallet")}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                      activeTab === "wallet"
                        ? "border-purple-600 bg-purple-50/50 shadow-xs ring-2 ring-purple-600/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activeTab === "wallet" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>Option 1: Connect Wallet & Pay</span>
                        {activeTab === "wallet" && <span className="w-2 h-2 rounded-full bg-purple-600"></span>}
                      </div>
                      <p className="text-xs text-slate-500 leading-normal">
                        Pay with MetaMask, Coinbase, Rainbow, or WalletConnect in 1 click.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: QR Code Mobile Scanning */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("qr")}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                      activeTab === "qr"
                        ? "border-purple-600 bg-purple-50/50 shadow-xs ring-2 ring-purple-600/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activeTab === "qr" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>Option 2: Scan QR with Phone</span>
                        {activeTab === "qr" && <span className="w-2 h-2 rounded-full bg-purple-600"></span>}
                      </div>
                      <p className="text-xs text-slate-500 leading-normal">
                        No browser extension required. Scan QR with your mobile crypto wallet.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tab 1: Web3 Wallet Interactive Flow */}
              {activeTab === "wallet" && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-5 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">Pay via Connected Web3 Wallet</h4>
                      <p className="text-xs text-slate-500">Choose token and execute direct smart contract payment.</p>
                    </div>
                    {mounted && isConnected && address ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Wallet: {formatWalletAddress(address)}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-800">
                        <span>Wallet Not Connected</span>
                      </div>
                    )}
                  </div>

                  {/* Token Rate Live Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <div className="text-[11px] text-slate-500 font-semibold uppercase">USDC (Stable)</div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{usdcCalc.tokenAmount}</div>
                      <div className="text-[10px] text-slate-400 font-mono">1 USDC = $1.00</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <div className="text-[11px] text-slate-500 font-semibold uppercase">POL (Native)</div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{polCalc.tokenAmount}</div>
                      <div className="text-[10px] text-slate-400 font-mono">1 POL ≈ {polCalc.formattedRate}</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                      <div className="text-[11px] text-slate-500 font-semibold uppercase">VERSE</div>
                      <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{verseCalc.tokenAmount}</div>
                      <div className="text-[10px] text-slate-400 font-mono">1 VERSE ≈ {verseCalc.formattedRate}</div>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    onClick={() => setIsPayOpen(true)}
                    className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-xl font-bold text-base shadow-md shadow-purple-200 hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>{mounted && isConnected ? "Pay Invoice with Connected Wallet" : "Connect Wallet & Pay"}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}

              {/* Tab 2: Mobile QR Code Scanner */}
              {activeTab === "qr" && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-5 animate-in fade-in duration-150">
                  {/* Token selector for QR */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Payment Currency for QR
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableTokens.map((tok) => {
                        const isSel = tok.symbol.toUpperCase() === selectedTokenSymbol.toUpperCase()
                        return (
                          <button
                            key={tok.symbol}
                            type="button"
                            onClick={() => setSelectedTokenSymbol(tok.symbol)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isSel
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>{tok.symbol}</span>
                            <span className="text-[10px] opacity-80">({tok.isNative ? "Native" : "ERC-20"})</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* QR Presentation Box */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-6">
                    {/* QR Code Container */}
                    <div className="p-3 bg-white rounded-2xl border-2 border-dashed border-purple-200 shadow-xs shrink-0">
                      <QRCodeSVG
                        value={eip681Uri}
                        size={180}
                        level="M"
                        includeMargin={false}
                        className="rounded-lg"
                      />
                    </div>

                    {/* QR Details and copy helpers */}
                    <div className="flex-1 space-y-3 w-full text-center md:text-left">
                      <div>
                        <div className="text-xs text-slate-500 font-semibold">Amount to Send:</div>
                        <div className="text-2xl font-extrabold font-mono text-purple-950 flex items-center justify-center md:justify-start gap-2 mt-0.5">
                          <span>{activeTokenCalc.tokenAmount} {activeQrToken.symbol}</span>
                          <button
                            onClick={() => copyToClipboard(activeTokenCalc.tokenAmount, "qr_amount")}
                            className="text-slate-400 hover:text-purple-600 transition-colors"
                            title="Copy Exact Amount"
                          >
                            {copiedField === "qr_amount" ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          Equivalent to ${invoice.total} {invoice.currency}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                        <div className="text-slate-500 font-semibold">Recipient Polygon Address:</div>
                        <div className="font-mono text-slate-800 break-all text-[11px] font-semibold bg-white p-2 rounded border border-slate-200 flex items-center justify-between gap-2">
                          <span>{targetRecipient}</span>
                          <button
                            onClick={() => copyToClipboard(targetRecipient, "qr_target_address")}
                            className="p-1 text-slate-400 hover:text-slate-700 shrink-0"
                            title="Copy Address"
                          >
                            {copiedField === "qr_target_address" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a
                          href={eip681Uri}
                          className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-xs"
                        >
                          Open in Mobile Wallet App
                        </a>
                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(true)}
                          className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Full QR Modal
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Auto-listening status */}
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                    <span>Listening on Polygon PoS... Page will auto-update upon payment.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Line Items Accordion / Table */}
          <div className="p-6 md:p-8 border-t border-slate-100 space-y-4">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Itemized Invoice Summary
            </div>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{item.description}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">${item.unitPrice}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal & Tax Breakdown */}
            <div className="max-w-xs ml-auto space-y-1.5 text-xs text-slate-600 pt-2">
              <div className="flex items-center justify-between">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-900 font-semibold">${invoice.subtotal}</span>
              </div>
              {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                <div className="flex items-center justify-between">
                  <span>Tax ({invoice.taxRate || 0}%):</span>
                  <span className="font-mono text-slate-900 font-semibold">${invoice.taxAmount}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount:</span>
                <span className="font-mono text-purple-700">${invoice.total} {invoice.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-400 print:hidden">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Secured by Polygon PoS Smart Contracts</span>
          </div>
          <div>Verse Merchant OS &bull; Public Payment Gateway</div>
        </div>
      </footer>

      {/* Modals */}
      <InvoicePaymentModal
        invoice={invoice}
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        onSuccess={() => fetchInvoice()}
      />
      <PaymentQrModal
        invoice={invoice}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onPaid={() => fetchInvoice()}
      />
    </div>
  )
}
