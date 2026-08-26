"use client"

import * as React from "react"
import { Invoice } from "@/lib/invoices/types"
import {
  SUPPORTED_PAYMENT_TOKENS,
  PaymentToken,
  MERCHANT_RECEIVING_ADDRESS,
} from "@/lib/payments/config"
import { POLYGON_MAINNET_CHAIN_ID, POLYGON_AMOY_CHAIN_ID } from "@/lib/web3/config"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"
import { useAccount, useSendTransaction, useWriteContract, useSwitchChain, useBalance } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { parseUnits, erc20Abi } from "viem"
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Coins,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  X,
  Wallet,
} from "lucide-react"

interface InvoicePaymentModalProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function InvoicePaymentModal({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}: InvoicePaymentModalProps) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { prices, calculateAmount, refreshPrices, isLoading: pricesLoading } = useCryptoPrices()

  const [selectedChainId, setSelectedChainId] = React.useState<number>(POLYGON_MAINNET_CHAIN_ID)
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>("USDC")
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false)
  const [txHash, setTxHash] = React.useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const activeChainId = chainId || selectedChainId
  const availableTokens =
    SUPPORTED_PAYMENT_TOKENS[activeChainId] ||
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

  const { data: balanceData } = useBalance({
    address: address,
    token: activeToken.isNative ? undefined : activeToken.address,
    chainId: activeChainId,
  })

  const { sendTransactionAsync } = useSendTransaction()
  const { writeContractAsync } = useWriteContract()

  // Reset state when opened
  React.useEffect(() => {
    if (isOpen) {
      setTxHash(null)
      setPaymentSuccess(false)
      setErrorMessage(null)
      setIsProcessing(false)
      refreshPrices()
    }
  }, [isOpen, refreshPrices])

  if (!isOpen) return null

  const handlePay = async () => {
    if (!isConnected || !address) return
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Check network
      if (chainId !== activeChainId && switchChain) {
        await switchChain({ chainId: activeChainId })
      }

      let hash = ""
      const recipient = (invoice.paymentAddress || MERCHANT_RECEIVING_ADDRESS) as `0x${string}`

      if (activeToken.isNative) {
        // Native POL payment
        const valueInWei = parseUnits(tokenCalc.tokenAmount, activeToken.decimals)
        hash = await sendTransactionAsync({
          to: recipient,
          value: valueInWei,
          chainId: activeChainId,
        })
      } else {
        // ERC-20 payment (USDC, VERSE)
        const amountUnits = parseUnits(tokenCalc.tokenAmount, activeToken.decimals)
        hash = await writeContractAsync({
          address: activeToken.address,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient, amountUnits],
          chainId: activeChainId,
        })
      }

      setTxHash(hash)

      // Record payment with API
      const res = await fetch(`/api/invoices/${invoice.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: hash,
          token: activeToken,
          chainId: activeChainId,
          payerAddress: address,
          recipientAddress: recipient,
        }),
      })

      if (res.ok) {
        setPaymentSuccess(true)
        if (onSuccess) onSuccess()
      }
    } catch (err: any) {
      console.error("[Payment Error]:", err)
      setErrorMessage(err?.shortMessage || err?.message || "Transaction failed or was rejected.")
    } finally {
      setIsProcessing(false)
    }
  }

  const explorerUrl =
    activeChainId === POLYGON_AMOY_CHAIN_ID
      ? `https://amoy.polygonscan.com/tx/${txHash}`
      : `https://polygonscan.com/tx/${txHash}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Pay Invoice #{invoice.invoiceNumber}</h3>
            <p className="text-xs text-slate-500">
              Total Due: ${invoice.total} {invoice.currency} • Real-Time On-Chain Settlement
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {paymentSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in-50">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Payment Successful!</h4>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                Paid <span className="font-semibold text-slate-900">{tokenCalc.tokenAmount} {activeToken.symbol}</span> ($
                {invoice.total} USD) directly on Polygon.
              </p>
              {txHash && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 font-medium underline pt-2"
                >
                  View on PolygonScan <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Network Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>1. Network</span>
                  <span className="text-[11px] text-purple-600 font-medium">Polygon Ecosystem</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChainId(POLYGON_MAINNET_CHAIN_ID)
                      if (switchChain && isConnected) switchChain({ chainId: POLYGON_MAINNET_CHAIN_ID })
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeChainId === POLYGON_MAINNET_CHAIN_ID
                        ? "border-purple-600 bg-purple-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-semibold text-sm text-slate-900">Polygon Mainnet</div>
                    <div className="text-xs text-slate-500">Low fees & instant finality</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChainId(POLYGON_AMOY_CHAIN_ID)
                      if (switchChain && isConnected) switchChain({ chainId: POLYGON_AMOY_CHAIN_ID })
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      activeChainId === POLYGON_AMOY_CHAIN_ID
                        ? "border-purple-600 bg-purple-50/50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-semibold text-sm text-slate-900">Amoy Testnet</div>
                    <div className="text-xs text-slate-500">Free test faucet tokens</div>
                  </button>
                </div>
              </div>

              {/* Token Selector with Live Crypto Rate Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <span>2. Payment Asset</span>
                  <button
                    onClick={() => refreshPrices()}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-purple-600 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${pricesLoading ? "animate-spin" : ""}`} />
                    Live Rates
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {availableTokens.map((token) => {
                    const calc = calculateAmount(invoiceAmountNum, invoice.currency || "USD", token.symbol)
                    const isSelected = selectedSymbol.toUpperCase() === token.symbol.toUpperCase()

                    return (
                      <button
                        key={token.symbol}
                        type="button"
                        onClick={() => setSelectedSymbol(token.symbol)}
                        className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-900">{token.symbol}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{calc.formattedRate}</span>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-purple-950 truncate">
                            {calc.tokenAmount}
                          </div>
                          <div className="text-[11px] text-slate-500">{token.symbol}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Conversion Summary Callout */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Billed Invoice Amount</span>
                  <span className="font-bold text-slate-900">${invoice.total} {invoice.currency}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Real-Time Exchange Rate</span>
                  <span className="font-medium text-slate-700 font-mono">1 {activeToken.symbol} ≈ {tokenCalc.formattedRate}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-bold">
                  <span className="text-slate-900">Total to Pay:</span>
                  <span className="text-purple-600 font-mono text-lg">
                    {tokenCalc.tokenAmount} {activeToken.symbol}
                  </span>
                </div>
                {isConnected && balanceData && (
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Wallet Balance:</span>
                    <span className="font-medium text-slate-700">
                      {parseFloat(balanceData.formatted).toFixed(4)} {balanceData.symbol}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {!isConnected ? (
                  <div className="flex justify-center">
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button
                          onClick={openConnectModal}
                          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
                        >
                          <Wallet className="w-4 h-4" /> Connect Wallet to Pay
                        </button>
                      )}
                    </ConnectButton.Custom>
                  </div>
                ) : (
                  <button
                    onClick={handlePay}
                    disabled={isProcessing}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Confirming on Polygon...
                      </>
                    ) : (
                      <>
                        <span>Pay {tokenCalc.tokenAmount} {activeToken.symbol}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
