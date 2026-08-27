"use client"

export const dynamic = "force-dynamic"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Invoice, InvoiceItem } from "@/lib/invoices/types"
import { decodeInvoiceFromUrlParam, generatePayUrl } from "@/lib/invoices/invoice-link"
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
  HelpCircle,
  Plus,
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
  const searchParams = useSearchParams()
  const rawId = params?.id
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : ""

  const { open } = useAppKit()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    setMounted(true)
  }, [])
  const { address, isConnected } = useAccount()

  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Interactive Quick Pay Fallback state if invoice not found
  const [customAmount, setCustomAmount] = React.useState<string>("50.00")
  const [customMerchantAddress, setCustomMerchantAddress] = React.useState<string>(MERCHANT_RECEIVING_ADDRESS)
  const [customDescription, setCustomDescription] = React.useState<string>("Direct Payment Settlement")

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

    const cleanId = decodeURIComponent(id).trim()

    // 1. Check if URL contains embedded compressed snapshot data (?d=...)
    let dataParam = searchParams?.get("d")
    if (!dataParam && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      dataParam = urlParams.get("d")
    }

    if (dataParam) {
      const decoded = decodeInvoiceFromUrlParam(dataParam)
      if (decoded) {
        setInvoice(decoded)
        setIsLoading(false)
        // Store in localStorage & async sync with backend
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(`verse_invoice_${cleanId}`, JSON.stringify(decoded))
          }
          fetch("/api/invoices/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(decoded),
          }).catch(() => {})
        } catch {}
        return
      }
    }

    // 2. Fetch from backend API
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(cleanId)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.invoice) {
          setInvoice(data.invoice)
          if (typeof window !== "undefined") {
            localStorage.setItem(`verse_invoice_${cleanId}`, JSON.stringify(data.invoice))
          }
          setIsLoading(false)
          return
        }
      }
    } catch {
      // Backend fetch failed, check local storage next
    }

    // 3. Fallback to local storage cache
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`verse_invoice_${cleanId}`)
        if (cached) {
          const parsed = JSON.parse(cached)
          setInvoice(parsed)
          setIsLoading(false)
          return
        }
      } catch {}
    }

    // If invoice not found, report clean error
    setError("Invoice record not found on the network or has expired.")
    setIsLoading(false)
  }, [id, searchParams])

  // Fetch invoice status on mount
  React.useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

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

  // If invoice is not found
  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">Invoice Not Found</h2>
            <p className="text-xs text-slate-500">
              The requested invoice <strong className="font-mono text-slate-700">{id}</strong> could not be located on the network. Please verify the link with the merchant.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => fetchInvoice()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Lookup</span>
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

  const targetRecipient = toChecksumAddress(invoice.paymentAddress)

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

  const publicCheckoutUrl = generatePayUrl(invoice)

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
              <span className="font-bold text-slate-900 tracking-tight">Verse Merchant OS Checkout</span>
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
                <span>
                  Billed to: <strong className="text-slate-200">{invoice.customerName}</strong>
                </span>
                {invoice.dueDate && (
                  <span>
                    Due: <strong className="text-slate-200">{invoice.dueDate}</strong>
                  </span>
                )}
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
              {targetRecipient ? (
                <span className="font-mono font-bold text-purple-950 bg-white px-2 py-0.5 rounded border border-purple-200">
                  {targetRecipient.slice(0, 8)}...{targetRecipient.slice(-6)}
                </span>
              ) : (
                <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 text-[11px]">
                  Address Not Set by Creator
                </span>
              )}
            </div>
            {targetRecipient && (
              <button
                onClick={() => copyToClipboard(targetRecipient, "merchant_wallet")}
                className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-semibold text-xs transition-colors cursor-pointer"
              >
                {copiedField === "merchant_wallet" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedField === "merchant_wallet" ? "Address Copied" : "Copy Wallet"}</span>
              </button>
            )}
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
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official Receipt
                </button>
                <button
                  onClick={() => copyToClipboard(publicCheckoutUrl, "receipt_link")}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedField === "receipt_link" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedField === "receipt_link" ? "Link Copied" : "Copy Receipt Link"}</span>
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
                  <span className="text-xs text-slate-500 font-medium">Polygon PoS (Instant & Low Gas)</span>
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
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        activeTab === "wallet" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
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
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        activeTab === "qr" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>Option 2: Scan QR with Phone</span>
                        {activeTab === "qr" && <span className="w-2 h-2 rounded-full bg-purple-600"></span>}
                      </div>
                      <p className="text-xs text-slate-500 leading-normal">
                        Scan with any mobile crypto wallet camera to auto-fill payment.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tab 1: Wallet Connection & Direct Execution */}
              {activeTab === "wallet" && (
                <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Supported Polygon Currencies</h3>
                      <p className="text-xs text-slate-500">Live exchange rates updated automatically</p>
                    </div>
                    <button
                      onClick={() => refreshPrices()}
                      className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1.5 font-medium cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? "animate-spin" : ""}`} />
                      <span>Refresh Live Rates</span>
                    </button>
                  </div>

                  {/* Token Rate Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">USDC Stablecoin</span>
                        <span className="font-mono text-[11px]">$1.00 USD</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {usdcCalc.tokenAmount}{" "}
                        <span className="text-xs font-sans text-slate-500 font-normal">USDC</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">POL (Native)</span>
                        <span className="font-mono text-[11px]">
                          {polCalc.isCalculating || polCalc.rate <= 0 ? (
                            <span className="animate-pulse text-purple-600 font-sans">Live rate...</span>
                          ) : (
                            polCalc.formattedRate
                          )}
                        </span>
                      </div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {polCalc.isCalculating || polCalc.rate <= 0 ? (
                          <span className="text-xs font-normal text-purple-600 animate-pulse flex items-center gap-1 py-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Fetching live rate...
                          </span>
                        ) : (
                          <>
                            {polCalc.tokenAmount}{" "}
                            <span className="text-xs font-sans text-slate-500 font-normal">POL</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">VERSE Token</span>
                        <span className="font-mono text-[11px]">
                          {verseCalc.isCalculating || verseCalc.rate <= 0 ? (
                            <span className="animate-pulse text-purple-600 font-sans">Live rate...</span>
                          ) : (
                            verseCalc.formattedRate
                          )}
                        </span>
                      </div>
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {verseCalc.isCalculating || verseCalc.rate <= 0 ? (
                          <span className="text-xs font-normal text-purple-600 animate-pulse flex items-center gap-1 py-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Fetching live rate...
                          </span>
                        ) : (
                          <>
                            {verseCalc.tokenAmount}{" "}
                            <span className="text-xs font-sans text-slate-500 font-normal">VERSE</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    {mounted && isConnected ? (
                      <button
                        onClick={() => setIsPayOpen(true)}
                        className="w-full sm:w-auto flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Confirm & Pay ${invoice.total} {invoice.currency}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => open()}
                        className="w-full sm:w-auto flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Connect Web3 Wallet to Pay</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-purple-600" />
                      <span>Open Fullscreen QR</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Mobile QR Code Scanning */}
              {activeTab === "qr" && (
                <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Select Currency for Mobile QR</h3>
                      <p className="text-xs text-slate-500">
                        Scan with MetaMask Mobile, Coinbase Wallet, Trust Wallet, or camera
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                      {availableTokens.map((t) => (
                        <button
                          key={t.symbol}
                          onClick={() => setSelectedTokenSymbol(t.symbol)}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            selectedTokenSymbol === t.symbol
                              ? "bg-purple-600 text-white shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {t.symbol}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-8 justify-center py-2">
                    {/* QR Code Container */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center space-y-3">
                      <div className="p-2 bg-white rounded-xl">
                        <QRCodeSVG
                          value={eip681Uri}
                          size={200}
                          level="M"
                          includeMargin={false}
                          className="rounded-lg"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-purple-800 font-bold bg-purple-50 px-2.5 py-1 rounded-md">
                        {activeTokenCalc.tokenAmount} {activeQrToken.symbol}
                      </span>
                    </div>

                    {/* QR Instructions & Manual Copy */}
                    <div className="space-y-4 max-w-sm text-left">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900">How to pay via mobile QR:</h4>
                        <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                          <li>Open your mobile Web3 wallet app (MetaMask, Trust, etc.).</li>
                          <li>Tap the <strong>Scan QR</strong> icon in your wallet.</li>
                          <li>Point at this QR code — amount & address auto-fill!</li>
                          <li>Approve the transaction on Polygon network.</li>
                        </ol>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-500 font-medium">
                          <span>Merchant Address:</span>
                          <button
                            onClick={() => copyToClipboard(targetRecipient, "qr_address")}
                            className="text-purple-600 hover:text-purple-800 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            {copiedField === "qr_address" ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedField === "qr_address" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <div className="font-mono text-slate-800 break-all text-[11px]">
                          {targetRecipient}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                        <span>Awaiting transaction broadcast on Polygon...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Line Items Breakdown */}
          <div className="p-6 md:p-8 border-t border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Invoice Line Items
            </h3>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 px-4 py-2.5 font-semibold text-slate-600 grid grid-cols-12 gap-2">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {invoice.items.map((item, idx) => (
                <div key={item.id || idx} className="px-4 py-3 grid grid-cols-12 gap-2 text-slate-800 items-center">
                  <div className="col-span-6 font-medium">{item.description}</div>
                  <div className="col-span-2 text-center font-mono text-slate-500">{item.quantity}</div>
                  <div className="col-span-2 text-right font-mono">${item.unitPrice}</div>
                  <div className="col-span-2 text-right font-mono font-bold">${item.amount}</div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-full max-w-xs space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">${invoice.subtotal}</span>
                </div>
                {invoice.tax && parseFloat(invoice.tax) > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span className="font-mono font-medium">${invoice.tax}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Due:</span>
                  <span className="font-mono text-purple-700 font-extrabold">
                    ${invoice.total} {invoice.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Network Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 px-2 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Decentralized non-custodial settlement powered by Polygon PoS & Verse</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span>Chain ID: 137</span>
            <span>•</span>
            <a
              href={`https://polygonscan.com/address/${targetRecipient}`}
              target="_blank"
              rel="noreferrer"
              className="text-purple-600 hover:underline flex items-center gap-1"
            >
              Verify Merchant Wallet <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      {/* Payment Modals */}
      {isPayOpen && (
        <InvoicePaymentModal
          invoice={invoice}
          isOpen={isPayOpen}
          onClose={() => setIsPayOpen(false)}
          onPaid={() => {
            setInvoice({ ...invoice, status: "paid", paidAt: new Date().toISOString() })
            setIsPayOpen(false)
          }}
        />
      )}

      {isQrModalOpen && (
        <PaymentQrModal
          invoice={invoice}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          onPaid={() => {
            setInvoice({ ...invoice, status: "paid", paidAt: new Date().toISOString() })
            setIsQrModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
