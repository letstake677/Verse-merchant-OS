"use client"

import * as React from "react"
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useChainId,
} from "wagmi"
import {
  Wallet,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Info,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Invoice } from "@/types/invoice"
import { PaymentIntent } from "@/types/payment-intent"
import { POLYGON_MAINNET_CHAIN_ID, SUPPORTED_PAYMENT_TOKENS } from "@/lib/payments/config"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"

function formatWalletAddress(address: string): string {
  if (!address || address.length < 10) return address || ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface PaymentPreparationModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice
  paymentIntent?: PaymentIntent | null
  onIntentConfirmed?: (intent: PaymentIntent) => void
}

export function PaymentPreparationModal({
  isOpen,
  onClose,
  invoice,
  paymentIntent: initialIntent,
  onIntentConfirmed,
}: PaymentPreparationModalProps) {
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { calculateAmount, refreshPrices, isCalculating } = useCryptoPrices()

  const [copiedMerchant, setCopiedMerchant] = React.useState(false)
  const [copiedPayer, setCopiedPayer] = React.useState(false)
  const [selectedTokenSymbol, setSelectedTokenSymbol] = React.useState<string>(
    initialIntent?.token?.symbol || invoice.currency || "USDC"
  )
  const [paymentIntent, setPaymentIntent] = React.useState<PaymentIntent | null>(
    initialIntent || null
  )
  const [isCreatingIntent, setIsCreatingIntent] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState("")

  const invoiceAmountNum = parseFloat(invoice.total || "0")
  const selectedCalc = calculateAmount(invoiceAmountNum, invoice.currency || "USD", selectedTokenSymbol)

  const isPolygonChain = currentChainId === POLYGON_MAINNET_CHAIN_ID
  const isPayerMatchesMerchant =
    isConnected &&
    address &&
    paymentIntent?.merchantWalletAddress &&
    address.toLowerCase() === paymentIntent.merchantWalletAddress.toLowerCase()

  // Copy helper
  const handleCopy = (text: string, type: "merchant" | "payer") => {
    navigator.clipboard.writeText(text)
    if (type === "merchant") {
      setCopiedMerchant(true)
      setTimeout(() => setCopiedMerchant(false), 2000)
    } else {
      setCopiedPayer(true)
      setTimeout(() => setCopiedPayer(false), 2000)
    }
  }

  // Handle Intent Creation / Refresh
  const handleCreateOrRefreshIntent = async () => {
    setIsCreatingIntent(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoice.id)}/payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenSymbol: selectedTokenSymbol,
          chainId: POLYGON_MAINNET_CHAIN_ID,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok || !data.paymentIntent) {
        throw new Error(data.message || "Failed to create payment intent.")
      }

      setPaymentIntent(data.paymentIntent)
      if (onIntentConfirmed) {
        onIntentConfirmed(data.paymentIntent)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating payment intent"
      setErrorMsg(msg)
    } finally {
      setIsCreatingIntent(false)
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Web3 Payment Intent Preparation"
      description={`Invoice #${invoice.invoiceNumber} • Total: $${invoice.total} ${invoice.currency}`}
      maxWidth="md"
    >
      <div className="space-y-4 py-2" id="payment-prep-modal-body">
        {/* Phase 6I Architecture Notice */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-950">Payment Intent Mode (Phase 6I)</p>
            <p className="text-blue-800 leading-relaxed text-[11px]">
              This step prepares the server-authoritative payment parameters and verifies Web3 wallet readiness. No blockchain transactions or gas fees will be executed in this phase.
            </p>
          </div>
        </div>

        {/* 1. Invoice & Merchant Summary Box */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2.5">
            <span className="text-slate-500 font-medium">Invoice Number:</span>
            <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2.5">
            <span className="text-slate-500 font-medium">Customer:</span>
            <span className="font-medium text-slate-900">{invoice.customerName}</span>
          </div>

          <div className="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2.5">
            <span className="text-slate-500 font-medium">Authoritative Amount:</span>
            <span className="font-bold text-slate-900 text-sm">
              ${invoice.total} <span className="text-xs text-slate-500">{invoice.currency}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Merchant Recipient Wallet:</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-800 font-semibold">
              <span>{formatWalletAddress(paymentIntent?.merchantWalletAddress || "")}</span>
              {paymentIntent?.merchantWalletAddress && (
                <button
                  type="button"
                  onClick={() => handleCopy(paymentIntent.merchantWalletAddress, "merchant")}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Copy merchant address"
                >
                  {copiedMerchant ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Token & Network Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Settlement Asset & Network Configuration:
            </label>
            <button
              type="button"
              onClick={() => refreshPrices()}
              className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-700 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${isCalculating ? "animate-spin" : ""}`} />
              <span>{isCalculating ? "Updating Rates..." : "Live Market Feed"}</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(SUPPORTED_PAYMENT_TOKENS[POLYGON_MAINNET_CHAIN_ID] || []).map((t) => {
              const isSelected = selectedTokenSymbol === t.symbol
              const calc = calculateAmount(invoiceAmountNum, invoice.currency || "USD", t.symbol)
              return (
                <button
                  key={t.symbol}
                  type="button"
                  onClick={() => setSelectedTokenSymbol(t.symbol)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-purple-600 bg-purple-50/50 ring-1 ring-purple-600/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{t.symbol}</span>
                    {isSelected && <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{t.name}</p>
                  <div className="mt-1.5">
                    {calc.isCalculating ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 font-medium animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Calculating...</span>
                      </span>
                    ) : (
                      <>
                        <span className="text-[12px] font-bold font-mono text-slate-900 block">
                          {calc.tokenAmount} {t.symbol}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          1 {t.symbol} ≈ {calc.formattedRate}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. Connection & Wallet Status */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Payer Web3 Wallet Connection:</label>
          {!isConnected ? (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <span>Wallet Not Connected</span>
                </div>
                <Badge variant="outline" className="bg-amber-100/80 border-amber-300 text-amber-800 text-[10px]">
                  Disconnected
                </Badge>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Connect your browser Web3 wallet to verify address compatibility with Polygon Mainnet.
              </p>
              <Button
                onClick={() => {
                  const conn = connectors[0]
                  if (conn) connect({ connector: conn })
                }}
                disabled={isConnecting}
                variant="primary"
                size="sm"
                className="w-full h-8 text-xs font-semibold gap-1.5"
              >
                {isConnecting ? "Connecting..." : "Connect Web3 Wallet"}
              </Button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-800">Connected Payer Wallet:</span>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  Connected
                </Badge>
              </div>

              <div className="flex items-center justify-between font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-900 font-semibold">{formatWalletAddress(address || "")}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(address || "", "payer")}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {copiedPayer ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {!isPolygonChain && (
                <div className="mt-2 p-2.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-900 flex items-center justify-between">
                  <span className="text-[11px] font-medium">Switch network to Polygon Mainnet (137)</span>
                  <Button
                    onClick={() => switchChain({ chainId: POLYGON_MAINNET_CHAIN_ID })}
                    disabled={isSwitching}
                    variant="secondary"
                    size="sm"
                    className="h-7 text-[11px] bg-purple-600 hover:bg-purple-700 text-white border-none gap-1 px-2.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Switch</span>
                  </Button>
                </div>
              )}

              {isPayerMatchesMerchant && (
                <div className="mt-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Wallet Notice:</strong> Your connected wallet is the merchant recipient address.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Active Intent Summary State */}
        {paymentIntent && (
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2 text-xs">
            <div className="flex items-center justify-between text-emerald-950 font-bold">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payment Intent Ready</span>
              </div>
              <Badge variant="outline" className="bg-emerald-100 border-emerald-300 text-emerald-800 text-[10px] font-semibold">
                {paymentIntent.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-900 pt-1">
              <div>
                <span className="text-emerald-700">Intent ID:</span>{" "}
                <span className="font-mono font-medium">{formatWalletAddress(paymentIntent.paymentId)}</span>
              </div>
              <div>
                <span className="text-emerald-700">Valid Network:</span>{" "}
                <span className="font-medium">Polygon ({paymentIntent.chainId})</span>
              </div>
              <div className="col-span-2 flex items-center gap-1 text-[10px] text-emerald-700">
                <Clock className="w-3 h-3" />
                <span>Expires at: {new Date(paymentIntent.expiresAt || "").toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <Button
          onClick={onClose}
          variant="secondary"
          size="sm"
          className="h-9 px-4 text-xs font-semibold text-slate-600 border-slate-200"
        >
          Close
        </Button>

        <Button
          onClick={handleCreateOrRefreshIntent}
          disabled={isCreatingIntent}
          variant="primary"
          size="sm"
          className="h-9 px-5 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isCreatingIntent ? (
            <span>Creating Intent...</span>
          ) : paymentIntent ? (
            <>
              <span>Refresh Payment Intent</span>
              <RefreshCw className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Prepare Payment Intent</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </div>
    </Dialog>
  )
}
