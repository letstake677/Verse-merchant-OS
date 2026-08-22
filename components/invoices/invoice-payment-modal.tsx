"use client"

import * as React from "react"
import {
  useAccount,
  useConnect,
  useSendTransaction,
  useWriteContract,
  useSwitchChain,
  useChainId,
} from "wagmi"
import { erc20Abi, parseUnits } from "viem"
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Printer,
  FileText,
} from "lucide-react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { Invoice } from "@/types/invoice"
import { Payment, PaymentToken } from "@/types/payment"
import {
  POLYGON_MAINNET_CHAIN_ID,
  POLYGON_AMOY_CHAIN_ID,
  SUPPORTED_PAYMENT_TOKENS,
  getExplorerBaseUrl,
  isSettlementChainSupported,
} from "@/lib/payments/config"

function formatWalletAddress(address?: string | null): string {
  if (!address || typeof address !== "string" || address.length < 10) return address || ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface InvoicePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: Invoice
  onPaymentSuccess?: () => void
}

type PaymentExecutionState =
  | "idle"
  | "initiating"
  | "signing"
  | "verifying"
  | "confirmed"
  | "error"

export function InvoicePaymentModal({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}: InvoicePaymentModalProps) {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const currentChainId = useChainId()
  const { connect, connectors, isPending: isConnectingWallet } = useConnect()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()

  const { sendTransactionAsync } = useSendTransaction()
  const { writeContractAsync } = useWriteContract()

  // Selected chain & token state
  const [selectedChainId, setSelectedChainId] = React.useState<number>(POLYGON_MAINNET_CHAIN_ID)
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>("USDC")

  const activeChainId =
    currentChainId && isSettlementChainSupported(currentChainId)
      ? currentChainId
      : selectedChainId

  // Get tokens for active chain
  const availableTokens: PaymentToken[] = React.useMemo(() => {
    return (
      SUPPORTED_PAYMENT_TOKENS[activeChainId] ||
      SUPPORTED_PAYMENT_TOKENS[POLYGON_MAINNET_CHAIN_ID] ||
      []
    )
  }, [activeChainId])

  const activeSymbol = React.useMemo(() => {
    if (
      availableTokens.length > 0 &&
      !availableTokens.some((t) => t.symbol === selectedSymbol)
    ) {
      return availableTokens[0].symbol
    }
    return selectedSymbol
  }, [availableTokens, selectedSymbol])

  // Payment execution state
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentExecutionState>("idle")
  const [activePayment, setActivePayment] = React.useState<Payment | null>(null)
  const [transactionHash, setTransactionHash] = React.useState<string>("")
  const [errorMessage, setErrorMessage] = React.useState<string>("")
  const [confirmations, setConfirmations] = React.useState<number>(0)
  const [copiedHash, setCopiedHash] = React.useState<boolean>(false)
  const [settledAt, setSettledAt] = React.useState<string>("")

  // Account switch guard
  const prevAddressRef = React.useRef(address)
  React.useEffect(() => {
    if (
      prevAddressRef.current &&
      address &&
      prevAddressRef.current.toLowerCase() !== address.toLowerCase()
    ) {
      if (paymentStatus === "signing" || paymentStatus === "verifying") {
        setTimeout(() => {
          setErrorMessage("Wallet account changed during payment. Please restart transaction.")
          setPaymentStatus("error")
        }, 0)
      }
    }
    prevAddressRef.current = address
  }, [address, paymentStatus])

  // Reset modal state when opening
  const [prevIsOpen, setPrevIsOpen] = React.useState(isOpen)
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) {
      setPaymentStatus("idle")
      setActivePayment(null)
      setTransactionHash("")
      setErrorMessage("")
      setConfirmations(0)
      setSettledAt("")
    }
  }

  const isSupportedChain = isSettlementChainSupported(currentChainId)

  // Copy transaction hash helper
  const handleCopyHash = React.useCallback(async () => {
    if (!transactionHash) return
    try {
      await navigator.clipboard.writeText(transactionHash)
      setCopiedHash(true)
      setTimeout(() => setCopiedHash(false), 2000)
    } catch {
      // Fallback
    }
  }, [transactionHash])

  // Print receipt helper
  const handlePrintReceipt = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }, [])

  // Poll server verification endpoint until confirmed or failed
  const verifyOnServerRef = React.useRef<((paymentId: string, txHash: string, pollCount?: number) => Promise<void>) | null>(null)

  const verifyOnServer = React.useCallback(
    async (paymentId: string, txHash: string, pollCount = 0) => {
      try {
        const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionHash: txHash }),
        })

        const data = await res.json()

        if (data.ok && data.verified) {
          setPaymentStatus("confirmed")
          setSettledAt(new Date().toLocaleString())
          toast({
            title: "Payment Confirmed!",
            description: `Invoice #${invoice.invoiceNumber} has been successfully settled on Polygon.`,
            type: "success",
          })
          if (onPaymentSuccess) {
            onPaymentSuccess()
          }
          return
        }

        if (data.ok && data.pendingConfirmations) {
          setConfirmations(data.confirmations || 0)
          if (pollCount < 20) {
            setTimeout(() => {
              if (verifyOnServerRef.current) {
                verifyOnServerRef.current(paymentId, txHash, pollCount + 1)
              }
            }, 3000)
            return
          }
        }

        // If not verified after max polling or returned explicit error
        throw new Error(data.message || "Transaction verification timed out on-chain.")
      } catch (err: unknown) {
        console.error("[verifyOnServer] Error:", err)
        const msg = err instanceof Error ? err.message : "Server verification failed."
        setErrorMessage(msg)
        setPaymentStatus("error")
      }
    },
    [invoice.invoiceNumber, onPaymentSuccess, toast]
  )

  React.useEffect(() => {
    verifyOnServerRef.current = verifyOnServer
  }, [verifyOnServer])

  // Step 1 & 2: Initiate Payment Intent & Execute Wallet Transaction
  const handleInitiatePayment = React.useCallback(async () => {
    if (!isConnected || !address) {
      setErrorMessage("Please connect your Web3 wallet first.")
      return
    }

    if (!isSupportedChain) {
      setErrorMessage("Please switch your wallet to Polygon Mainnet or Polygon Amoy.")
      return
    }

    setPaymentStatus("initiating")
    setErrorMessage("")

    try {
      const targetChain = currentChainId || POLYGON_MAINNET_CHAIN_ID
      const res = await fetch(`/api/invoices/${encodeURIComponent(invoice.id)}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenSymbol: activeSymbol,
          chainId: targetChain,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.ok || !data.payment) {
        throw new Error(data.message || "Failed to initialize payment intent.")
      }

      const intentPayment: Payment = data.payment
      setActivePayment(intentPayment)

      // Step 2: Trigger Web3 Wallet transaction
      setPaymentStatus("signing")

      const token = intentPayment.token
      const recipient = intentPayment.recipientAddress as `0x${string}`
      const amountStr = intentPayment.amount

      if (!recipient) {
        throw new Error("Merchant recipient address is missing in payment intent.")
      }

      let txHash = ""

      if (token.isNative) {
        // Native POL payment
        const valueInWei = parseUnits(amountStr, 18)
        txHash = await sendTransactionAsync({
          to: recipient,
          value: valueInWei,
          chainId: targetChain,
        })
      } else {
        // ERC-20 payment (USDC, VERSE)
        if (!token.address) {
          throw new Error(`Token contract address missing for ${token.symbol}.`)
        }

        const valueInBaseUnits = parseUnits(amountStr, token.decimals)
        txHash = await writeContractAsync({
          address: token.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient, valueInBaseUnits],
          chainId: targetChain,
        })
      }

      if (!txHash) {
        throw new Error("No transaction hash returned from wallet.")
      }

      setTransactionHash(txHash)
      setPaymentStatus("verifying")

      // Step 3: Server-side Polygon RPC verification
      await verifyOnServer(intentPayment.id, txHash)
    } catch (err: unknown) {
      console.error("[InvoicePaymentModal] Payment error:", err)
      const msg = err instanceof Error ? err.message : "Failed to execute transaction."

      let userMsg = msg
      if (msg.includes("User rejected") || msg.includes("User denied") || msg.includes("rejected")) {
        userMsg = "Transaction signature was cancelled in your wallet."
      } else if (msg.includes("insufficient funds") || msg.includes("exceeds balance")) {
        userMsg = `Insufficient ${activeSymbol} balance in your wallet to complete payment.`
      }

      setErrorMessage(userMsg)
      setPaymentStatus("error")
    }
  }, [
    isConnected,
    address,
    isSupportedChain,
    currentChainId,
    invoice.id,
    activeSymbol,
    sendTransactionAsync,
    writeContractAsync,
    verifyOnServer,
  ])

  const explorerBaseUrl = getExplorerBaseUrl(activeChainId)
  const explorerUrl = transactionHash ? `${explorerBaseUrl}/tx/${transactionHash}` : null

  const networkName =
    activeChainId === POLYGON_AMOY_CHAIN_ID ? "Polygon Amoy Testnet" : "Polygon Mainnet"

  return (
    <Dialog
      isOpen={isOpen}
      onClose={paymentStatus === "signing" || paymentStatus === "verifying" ? () => {} : onClose}
      title="Pay Invoice with Web3 Wallet"
      description={`Invoice #${invoice.invoiceNumber} • Total Due: $${invoice.total} ${invoice.currency}`}
      maxWidth="md"
    >
      <div className="space-y-5 py-2" id="invoice-payment-modal-body">
        {/* 1. Wallet Connection Banner */}
        {!isConnected ? (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <Wallet className="w-4 h-4 text-amber-600" />
              <span>Connect Wallet to Pay</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Connect your Web3 wallet (MetaMask, Trust Wallet, Coinbase Wallet, or WalletConnect) to execute non-custodial payment settlement on Polygon.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  const hasInjected = typeof window !== "undefined" && Boolean((window as any).ethereum)
                  const injectedConnector = connectors.find((c) => c.type === "injected" || c.id === "injected")
                  const wcConnector = connectors.find((c) => c.type === "walletConnect" || c.id === "walletConnect")
                  const targetConnector = hasInjected ? (injectedConnector || wcConnector) : (wcConnector || injectedConnector || connectors[0])
                  if (targetConnector) connect({ connector: targetConnector })
                }}
                disabled={isConnectingWallet}
                variant="primary"
                size="sm"
                className="w-full min-h-[44px] text-xs font-semibold gap-2"
              >
                {isConnectingWallet ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting Wallet...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Connect Wallet</span>
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const wcConnector = connectors.find((c) => c.type === "walletConnect" || c.id === "walletConnect")
                    if (wcConnector) connect({ connector: wcConnector })
                  }}
                  disabled={isConnectingWallet}
                  className="min-h-[40px] text-[11px] font-semibold gap-1.5 border-amber-300 text-amber-900 bg-amber-100/50 hover:bg-amber-100"
                >
                  <span>WalletConnect / Mobile</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const injectedConnector = connectors.find((c) => c.type === "injected" || c.id === "injected")
                    if (injectedConnector) connect({ connector: injectedConnector })
                  }}
                  disabled={isConnectingWallet}
                  className="min-h-[40px] text-[11px] font-semibold gap-1.5 border-amber-300 text-amber-900 bg-amber-100/50 hover:bg-amber-100"
                >
                  <span>Browser Wallet</span>
                </Button>
              </div>
            </div>
          </div>
        ) : !isSupportedChain ? (
          /* 2. Wrong Network Switch Banner */
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/70 text-purple-900 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-900">
              <AlertCircle className="w-4 h-4 text-purple-600" />
              <span>Polygon Settlement Network Required</span>
            </div>
            <p className="text-xs text-purple-700 leading-relaxed">
              Your wallet is connected to an unsupported network (Chain ID: {currentChainId}). Switch to Polygon Mainnet (137) or Polygon Amoy (80002) to pay.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => switchChain({ chainId: POLYGON_MAINNET_CHAIN_ID })}
                disabled={isSwitchingChain}
                variant="secondary"
                size="sm"
                className="flex-1 min-h-[44px] text-xs font-semibold gap-2 bg-purple-600 text-white hover:bg-purple-700 border-none"
              >
                {isSwitchingChain ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Switching...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Switch to Polygon Mainnet (137)</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => switchChain({ chainId: POLYGON_AMOY_CHAIN_ID })}
                disabled={isSwitchingChain}
                variant="outline"
                size="sm"
                className="min-h-[44px] text-xs font-semibold gap-2 text-purple-700 border-purple-300 hover:bg-purple-50"
              >
                <span>Amoy (80002)</span>
              </Button>
            </div>
          </div>
        ) : (
          /* 3. Connected Wallet Badge */
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/80 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-700">Connected Wallet:</span>
              <span className="font-mono text-slate-900 font-semibold">
                {formatWalletAddress(address)}
              </span>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-medium">
              {networkName} ({currentChainId})
            </Badge>
          </div>
        )}

        {/* 4. Payment Token & Network Selection */}
        {paymentStatus === "idle" && isConnected && isSupportedChain && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Select Payment Token:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableTokens.map((token) => {
                  const isSelected = activeSymbol === token.symbol
                  return (
                    <button
                      key={token.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(token.symbol)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer min-h-[56px] ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/60 ring-1 ring-purple-600/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{token.symbol}</span>
                        {isSelected && <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate">{token.name}</p>
                      <p className="text-[11px] font-semibold text-slate-800 mt-1.5">
                        {invoice.total} {token.symbol}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Merchant Settlement Address Detail */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total:</span>
                <span className="font-bold text-slate-900">${invoice.total} {invoice.currency}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Settlement Network:</span>
                <span className="font-medium text-purple-700">{networkName}</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. In-Flight Execution Statuses */}
        {paymentStatus === "initiating" && (
          <div className="p-6 text-center space-y-3 rounded-xl border border-slate-200 bg-slate-50/50">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-800">Initializing Payment Intent...</p>
            <p className="text-[11px] text-slate-500">Creating server-authoritative settlement parameters on Polygon.</p>
          </div>
        )}

        {paymentStatus === "signing" && (
          <div className="p-6 text-center space-y-3 rounded-xl border border-purple-200 bg-purple-50/40">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto text-purple-600 animate-bounce">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-purple-900">Waiting for Wallet Signature...</p>
            <p className="text-[11px] text-purple-700 max-w-sm mx-auto leading-relaxed">
              Please inspect and confirm the transaction in your connected browser wallet popup.
            </p>
            {activePayment?.recipientAddress && (
              <p className="text-[10px] font-mono text-purple-600 bg-white/80 py-1 px-2.5 rounded-lg border border-purple-200 inline-block">
                Recipient: {formatWalletAddress(activePayment.recipientAddress)}
              </p>
            )}
          </div>
        )}

        {paymentStatus === "verifying" && (
          <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-blue-900">Verifying On-Chain Settlement</h4>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  {confirmations > 0
                    ? `Polygon Block confirmations: ${confirmations}/1`
                    : "Transaction broadcasted to RPC. Awaiting block inclusion..."}
                </p>
              </div>
            </div>

            {transactionHash && (
              <div className="p-2.5 rounded-lg bg-white border border-blue-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Tx Hash:</span>
                  <span className="font-mono text-[11px] text-slate-800 font-medium truncate">
                    {formatWalletAddress(transactionHash)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Copy full transaction hash"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <span>Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. Confirmed Success & Receipt Experience */}
        {paymentStatus === "confirmed" && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2.5 text-sm font-bold text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <span>Payment Confirmed & Settled!</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Your payment was authoritatively verified on the Polygon blockchain and linked to Invoice #{invoice.invoiceNumber}.
              </p>
            </div>

            {/* Official Payment Receipt Breakdown */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-sans">Invoice Reference:</span>
                <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-sans">Settled Amount:</span>
                <span className="font-bold text-slate-900">{invoice.total} {activeSymbol}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-sans">Settlement Network:</span>
                <span className="font-medium text-purple-700 font-sans">{networkName}</span>
              </div>
              {transactionHash && (
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Transaction Hash:</span>
                  <span className="text-slate-800 font-semibold">{formatWalletAddress(transactionHash)}</span>
                </div>
              )}
              {settledAt && (
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500 font-sans">Settled At:</span>
                  <span className="text-slate-700">{settledAt}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Error Alert Banner */}
        {paymentStatus === "error" && errorMessage && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50/80 text-red-900 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Payment Execution Error</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
        {paymentStatus === "confirmed" ? (
          <div className="w-full flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrintReceipt}
                variant="outline"
                size="sm"
                className="min-h-[44px] px-4 text-xs font-semibold gap-1.5 text-slate-700 border-slate-300"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </Button>
              {activePayment?.id && (
                <a
                  href={`/payments/${activePayment.id}/receipt`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50/80 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors h-11"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>View Full Receipt</span>
                  <ExternalLink className="w-3 h-3 text-indigo-400" />
                </a>
              )}
            </div>
            <Button
              onClick={onClose}
              variant="primary"
              size="sm"
              className="min-h-[44px] px-6 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <Button
              onClick={onClose}
              variant="secondary"
              size="sm"
              disabled={paymentStatus === "signing" || paymentStatus === "verifying"}
              className="w-full sm:w-auto min-h-[44px] px-4 text-xs font-semibold text-slate-600 border-slate-200"
            >
              Cancel
            </Button>

            {isConnected && isSupportedChain && (
              <Button
                onClick={handleInitiatePayment}
                disabled={
                  paymentStatus === "initiating" ||
                  paymentStatus === "signing" ||
                  paymentStatus === "verifying"
                }
                variant="primary"
                size="sm"
                className="w-full sm:w-auto min-h-[44px] px-6 text-xs font-bold gap-2 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-xs"
              >
                {paymentStatus === "initiating" || paymentStatus === "signing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Wallet...</span>
                  </>
                ) : paymentStatus === "verifying" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying On-Chain...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ${invoice.total} {activeSymbol}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>
    </Dialog>
  )
}
