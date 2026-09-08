"use client"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Invoice, InvoiceItem } from "@/lib/invoices/types"
import { decodeInvoiceFromUrlParam, generatePayUrl } from "@/lib/invoices/invoice-link"
import { PaymentQrModal } from "@/components/payments/payment-qr-modal"
import { SmartQRCard } from "@/components/payments/smart-qr-card"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"
import { useAppKit } from "@reown/appkit/react"
import { useAccount, useDisconnect, useSendTransaction, useWriteContract, useSwitchChain, useBalance } from "wagmi"
import { parseUnits, formatUnits, erc20Abi } from "viem"
import { formatWalletAddress } from "@/lib/utils/wallet"
import { QRCodeSVG } from "qrcode.react"
import {
  SUPPORTED_PAYMENT_TOKENS,
  POLYGON_MAINNET_CHAIN_ID,
  MERCHANT_RECEIVING_ADDRESS,
  toChecksumAddress,
} from "@/lib/payments/config"
import { VerseLogo } from "@/components/ui/verse-logo"
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building,
  AlertCircle,
  Loader2,
  RefreshCw,
  Wallet,
  Copy,
  Check,
  Printer,
  ArrowRight,
  Smartphone,
  LogOut,
  XCircle,
  ShieldAlert,
} from "lucide-react"

type ApprovalState =
  | "SCANNED"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "EXECUTING"
  | "CONFIRMING"
  | "COMPLETED"
  | "REJECTED"
  | "FAILED"
  | "EXPIRED"

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

  const { address, isConnected, status, chainId, isConnecting, isReconnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const { sendTransactionAsync } = useSendTransaction()
  const { writeContractAsync } = useWriteContract()

  const isWalletConnected = Boolean(mounted && address && (isConnected || status === "connected"))
  const isWalletConnecting = Boolean(mounted && (isConnecting || isReconnecting || status === "connecting" || status === "reconnecting"))
  const isWrongChain = Boolean(isWalletConnected && chainId && chainId !== POLYGON_MAINNET_CHAIN_ID)

  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Direct Approval State Machine
  const [approvalState, setApprovalState] = React.useState<ApprovalState>("PENDING_APPROVAL")
  const [executionTxHash, setExecutionTxHash] = React.useState<string | null>(null)
  const [approvalErrorMessage, setApprovalErrorMessage] = React.useState<string | null>(null)

  // Payment Token Selection
  const [selectedTokenSymbol, setSelectedTokenSymbol] = React.useState<string>("USDC")
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false)
  const [copiedField, setCopiedField] = React.useState<string | null>(null)

  const { calculateAmount, refreshPrices, secondsRemaining, setPaused, isLoading: pricesLoading } = useCryptoPrices()

  // Pause price oscillation during active approval execution
  React.useEffect(() => {
    setPaused(approvalState === "EXECUTING" || approvalState === "CONFIRMING")
  }, [approvalState, setPaused])

  const fetchInvoice = React.useCallback(async (silent = false) => {
    if (!id) return
    if (!silent) {
      setIsLoading(true)
      setError(null)
    }

    const cleanId = decodeURIComponent(id).trim()

    // 1. Fetch real-time invoice status directly from MongoDB backend API
    try {
      const res = await fetch(`/api/invoices/${encodeURIComponent(cleanId)}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.invoice) {
          setInvoice((prev) => {
            if (prev?.status === "paid" && data.invoice.status !== "paid") {
              return {
                ...data.invoice,
                status: "paid",
                paidAt: prev.paidAt,
                paymentId: prev.paymentId,
                payments: prev.payments || data.invoice.payments,
              }
            }
            return data.invoice
          })
          if (data.invoice.status === "paid") {
            setApprovalState("COMPLETED")
          }
          setIsLoading(false)
          return
        }
      }
    } catch {
      // Backend fetch failed, continue to fallback sync
    }

    // 2. Check if URL contains embedded compressed snapshot data (?d=...)
    let dataParam = searchParams?.get("d")
    if (!dataParam && typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      dataParam = urlParams.get("d")
    }

    if (dataParam) {
      const decoded = decodeInvoiceFromUrlParam(dataParam)
      if (decoded) {
        try {
          const syncRes = await fetch("/api/invoices/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(decoded),
          })
          if (syncRes.ok) {
            const syncData = await syncRes.json()
            if (syncData.invoice) {
              setInvoice((prev) => {
                if (prev?.status === "paid" && syncData.invoice.status !== "paid") {
                  return {
                    ...syncData.invoice,
                    status: "paid",
                    paidAt: prev.paidAt,
                    paymentId: prev.paymentId,
                    payments: prev.payments,
                  }
                }
                return syncData.invoice
              })
              if (syncData.invoice.status === "paid") {
                setApprovalState("COMPLETED")
              }
              setIsLoading(false)
              return
            }
          }
        } catch {}

        setInvoice((prev) => {
          if (prev?.status === "paid" && decoded.status !== "paid") {
            return { ...decoded, status: "paid", paidAt: prev.paidAt, paymentId: prev.paymentId }
          }
          return decoded
        })
        if (decoded.status === "paid") {
          setApprovalState("COMPLETED")
        }
        setIsLoading(false)
        return
      }
    }

    // If invoice not found in DB or URL, report clean error
    setError("Invoice record not found on the network or has expired.")
    setIsLoading(false)
  }, [id, searchParams])

  // Fetch invoice status on mount and poll while pending
  React.useEffect(() => {
    fetchInvoice()
  }, [fetchInvoice])

  // Background real-time polling to detect on-chain settlement across devices
  React.useEffect(() => {
    if (!invoice || invoice.status === "paid") return

    const interval = setInterval(() => {
      fetchInvoice(true)
    }, 3500)

    return () => clearInterval(interval)
  }, [invoice?.status, fetchInvoice])

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

  const handleOpenMetaMask = () => {
    if (typeof window !== "undefined") {
      const cleanUrl = window.location.href.replace(/^https?:\/\//, "")
      window.location.href = `https://metamask.app.link/dapp/${cleanUrl}`
    }
  }

  const handleOpenTrustWallet = () => {
    if (typeof window !== "undefined") {
      const fullUrl = encodeURIComponent(window.location.href)
      window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${fullUrl}`
    }
  }

  const numericTotal = parseFloat(invoice?.total || "0")
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

  const activeTokenCalc = calculateAmount(
    numericTotal,
    invoice?.currency || "USD",
    activeToken.symbol
  )

  const rawRecipient =
    invoice?.paymentAddress ||
    (invoice as any)?.merchantWalletAddress ||
    (invoice?.merchantId?.startsWith("0x") ? invoice.merchantId : "") ||
    ""
  const targetRecipient = toChecksumAddress(rawRecipient)
  const isRecipientValid = Boolean(targetRecipient && targetRecipient !== "0x0000000000000000000000000000000000000000")

  const merchantDisplayName =
    invoice?.merchantBusinessName ||
    invoice?.businessName ||
    invoice?.merchantName ||
    "Verse Verified Merchant"

  const publicCheckoutUrl = invoice ? generatePayUrl(invoice) : ""

  // Direct Approve & Pay Execution Handler
  const handleApproveAndPay = async () => {
    if (!invoice) return

    // 1. One-time payment protection
    if (invoice.status === "paid" || approvalState === "COMPLETED") {
      setApprovalErrorMessage("This payment request has already been completed and settled.")
      return
    }

    // 2. Prevent double submission
    if (approvalState === "EXECUTING" || approvalState === "CONFIRMING") {
      return
    }

    // 3. Ensure wallet is connected
    if (!isWalletConnected || !address) {
      setApprovalErrorMessage(null)
      open()
      return
    }

    // 4. Validate recipient
    if (!isRecipientValid || !targetRecipient) {
      setApprovalErrorMessage("Merchant settlement recipient address is missing or invalid.")
      return
    }

    // 5. Network validation
    if (chainId !== POLYGON_MAINNET_CHAIN_ID) {
      if (switchChain) {
        try {
          await switchChain({ chainId: POLYGON_MAINNET_CHAIN_ID })
        } catch {
          setApprovalErrorMessage("Please switch your wallet network to Polygon Mainnet (Chain ID 137) to approve.")
          return
        }
      } else {
        setApprovalErrorMessage("Please switch your wallet network to Polygon Mainnet (Chain ID 137) to approve.")
        return
      }
    }

    // Set state to APPROVED -> EXECUTING
    setApprovalState("EXECUTING")
    setApprovalErrorMessage(null)

    try {
      let hash = ""
      const recipient = targetRecipient

      if (activeToken.isNative) {
        // Native POL transaction
        const valueInWei = parseUnits(activeTokenCalc.tokenAmount, activeToken.decimals)
        hash = await sendTransactionAsync({
          to: recipient,
          value: valueInWei,
          gas: 60000n,
        })
      } else {
        // ERC-20 token transfer (USDC, VERSE)
        const amountUnits = parseUnits(activeTokenCalc.tokenAmount, activeToken.decimals)
        hash = await writeContractAsync({
          address: activeToken.address,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient, amountUnits],
          gas: 120000n,
        })
      }

      if (!hash) {
        throw new Error("No transaction hash returned from wallet.")
      }

      setExecutionTxHash(hash)
      setApprovalState("CONFIRMING")

      // 1. Synchronize invoice status to paid in backend database immediately
      try {
        await fetch("/api/invoices/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...invoice,
            status: "paid",
            paidAt: new Date().toISOString(),
            paymentId: hash,
            payments: [
              {
                id: `pay_${Date.now()}`,
                invoiceId: invoice.id,
                txHash: hash,
                amount: activeTokenCalc.tokenAmount,
                token: activeToken,
                chainId: POLYGON_MAINNET_CHAIN_ID,
                payerAddress: toChecksumAddress(address),
                recipientAddress: recipient,
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        })
      } catch (err) {
        console.warn("Database sync notice:", err)
      }

      // 2. Record payment event
      try {
        await fetch(`/api/invoices/${encodeURIComponent(invoice.id)}/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txHash: hash,
            token: activeToken,
            chainId: POLYGON_MAINNET_CHAIN_ID,
            payerAddress: toChecksumAddress(address),
            recipientAddress: recipient,
          }),
        })
      } catch (err) {
        console.warn("Payment event notice:", err)
      }

      // Update local invoice state
      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              status: "paid",
              paidAt: new Date().toISOString(),
              paymentId: hash,
              payments: [
                {
                  id: `pay_${Date.now()}`,
                  invoiceId: prev.id,
                  txHash: hash,
                  amount: activeTokenCalc.tokenAmount,
                  token: activeToken,
                  chainId: POLYGON_MAINNET_CHAIN_ID,
                  payerAddress: toChecksumAddress(address),
                  recipientAddress: recipient,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : null
      )

      setApprovalState("COMPLETED")
    } catch (err: any) {
      console.error("Payment approval execution error:", err)
      const msg = err?.message || ""
      if (msg.includes("rejected") || msg.includes("denied") || msg.includes("User rejected")) {
        setApprovalErrorMessage("Transaction authorization was cancelled in your wallet. No funds were transferred.")
      } else {
        setApprovalErrorMessage(msg || "Payment authorization failed. Please check your token balance and network fees.")
      }
      setApprovalState("FAILED")
    }
  }

  const handleReject = () => {
    setApprovalState("REJECTED")
    setApprovalErrorMessage(null)
  }

  const handleResetApproval = () => {
    setApprovalState("PENDING_APPROVAL")
    setApprovalErrorMessage(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center space-y-4 max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">Loading Payment Request</h3>
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
            <h2 className="text-lg font-bold text-slate-900">Payment Request Not Found</h2>
            <p className="text-xs text-slate-500">
              The requested payment request <strong className="font-mono text-slate-700">{id}</strong> could not be located on the network.
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

  const isPaid = invoice.status === "paid" || approvalState === "COMPLETED"
  const isCancelled = invoice.status === "cancelled"

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-900 flex flex-col font-sans selection:bg-purple-100">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <VerseLogo size="md" subtitle="Smart Approval Checkout" priority />
          </div>

          <div className="flex items-center gap-2">
            {isWalletConnected ? (
              <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1 pr-2.5">
                <button
                  type="button"
                  onClick={() => open()}
                  className="px-2 py-1 text-slate-800 text-xs font-semibold flex items-center gap-1.5 hover:text-purple-600 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>{formatWalletAddress(address || "")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  title="Disconnect wallet"
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isWalletConnecting ? (
              <button
                type="button"
                onClick={() => disconnect()}
                className="px-3.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Connecting...</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => open()}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-purple-600" />
                <span>Connect Wallet</span>
              </button>
            )}
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/60 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Verified Direct Approval
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isPaid
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : isCancelled
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : approvalState === "REJECTED"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {isPaid ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCancelled || approvalState === "REJECTED" ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  {isPaid
                    ? "Completed & Settled"
                    : isCancelled
                    ? "Cancelled"
                    : approvalState === "REJECTED"
                    ? "Approval Rejected"
                    : "Pending Approval"}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  Merchant: <strong className="text-slate-200">{merchantDisplayName}</strong>
                </span>
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

            {/* Total Display */}
            <div className="md:text-right space-y-1 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Approved Amount Due
              </div>
              <div className="text-3xl font-bold font-mono text-white tracking-tight">
                ${invoice.total}{" "}
                <span className="text-sm font-sans font-normal text-slate-400">
                  {invoice.currency || "USD"}
                </span>
              </div>
              <div className="text-xs text-purple-300 font-mono flex items-center md:justify-end gap-1">
                <span>≈ {activeTokenCalc.tokenAmount} {activeToken.symbol}</span>
                <span>(Polygon PoS)</span>
              </div>
            </div>
          </div>

          {/* Direct Approval Flow States */}
          {isCancelled ? (
            /* Cancelled State */
            <div className="p-6 md:p-8 space-y-4 text-center bg-rose-50/40 border-b border-rose-100">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-slate-900">Payment Request Cancelled</h3>
                <p className="text-sm text-slate-600">
                  This payment request was cancelled by the merchant and can no longer receive approvals or payments.
                </p>
              </div>
            </div>
          ) : isPaid ? (
            /* One-time Payment Protection: Already Completed */
            <div className="p-6 md:p-8 space-y-6 text-center bg-emerald-50/30">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-slate-900">Payment Request Already Completed</h3>
                <p className="text-sm text-slate-600">
                  This payment request has been processed and settled on the Polygon PoS network. Further payments are disabled to protect against double-spending.
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
          ) : approvalState === "REJECTED" ? (
            /* Rejected State */
            <div className="p-6 md:p-8 space-y-5 text-center bg-slate-50/50">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-xl font-bold text-slate-900">Payment Approval Rejected</h3>
                <p className="text-sm text-slate-600">
                  You declined this payment request. No funds were transferred or deducted from your wallet.
                </p>
              </div>
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleResetApproval}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Review Request Again
                </button>
              </div>
            </div>
          ) : (
            /* Primary Direct Payment Approval Screen */
            <div className="p-6 md:p-8 space-y-6">
              {/* Approval Box */}
              <div className="p-5 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-700" />
                    <span className="font-bold text-sm text-purple-950">Payment Approval</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
                    Polygon Mainnet (137)
                  </span>
                </div>

                {/* Clear Authorization Parameters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                    <span className="text-slate-500 font-medium">Merchant:</span>
                    <div className="font-bold text-slate-900 text-sm">{merchantDisplayName}</div>
                    <div className="font-mono text-[11px] text-slate-500 break-all">{targetRecipient}</div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1">
                    <span className="text-slate-500 font-medium">Amount:</span>
                    <div className="font-bold text-purple-700 text-base font-mono">
                      {activeTokenCalc.tokenAmount} {activeToken.symbol}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Fiat Value: ${invoice.total} {invoice.currency || "USD"}
                    </div>
                  </div>
                </div>

                {/* Token Switcher */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Select Currency:</span>
                    <div className="flex items-center gap-2 text-purple-700 font-medium">
                      <span>Rate locked ({secondsRemaining}s)</span>
                      <button
                        type="button"
                        onClick={() => refreshPrices()}
                        className="hover:underline flex items-center gap-1 cursor-pointer"
                        title="Refresh market rates"
                      >
                        <RefreshCw className={`w-3 h-3 ${pricesLoading ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {availableTokens.map((t) => {
                      const isSelected = t.symbol.toUpperCase() === selectedTokenSymbol.toUpperCase()
                      const calc = calculateAmount(numericTotal, invoice.currency || "USD", t.symbol)
                      return (
                        <button
                          key={t.symbol}
                          type="button"
                          onClick={() => setSelectedTokenSymbol(t.symbol)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-white border-purple-600 shadow-xs ring-2 ring-purple-600/20"
                              : "bg-white/60 border-purple-100 hover:bg-white text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-xs text-slate-900">{t.symbol}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>}
                          </div>
                          <div className="font-mono text-xs text-purple-700 font-semibold truncate">
                            {calc.tokenAmount}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Clear Consequence Notice */}
                <div className="p-3 bg-white/80 rounded-xl border border-purple-100 text-xs text-slate-700 space-y-1">
                  <div className="font-semibold text-slate-900">
                    You are approving this payment to <span className="text-purple-700">{merchantDisplayName}</span>.
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Scanning the QR only opens this review. When you click <strong>Approve &amp; Pay</strong> and complete the required wallet authorization/signature, the amount will be automatically sent from your wallet directly to the merchant on Polygon.
                  </p>
                </div>

                {/* Error Banner if any */}
                {approvalErrorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{approvalErrorMessage}</span>
                  </div>
                )}

                {/* Connected Wallet State */}
                <div className="p-3 bg-white rounded-xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-500 font-medium">Payer Wallet:</span>
                    <div className="font-mono font-semibold text-slate-900">
                      {isWalletConnected ? (
                        <span className="flex items-center gap-1.5 text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{formatWalletAddress(address || "")}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Not connected</span>
                      )}
                    </div>
                  </div>

                  {isWalletConnected && isWrongChain && (
                    <button
                      type="button"
                      onClick={() => switchChain && switchChain({ chainId: POLYGON_MAINNET_CHAIN_ID })}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Switch to Polygon Mainnet</span>
                    </button>
                  )}
                </div>

                {/* Primary Action Buttons: Reject vs Approve & Pay */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={approvalState === "EXECUTING" || approvalState === "CONFIRMING"}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveAndPay}
                    disabled={approvalState === "EXECUTING" || approvalState === "CONFIRMING"}
                    className="w-full sm:w-auto flex-1 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {approvalState === "EXECUTING" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Waiting for Wallet Authorization...</span>
                      </>
                    ) : approvalState === "CONFIRMING" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirming on Polygon Block...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Approve &amp; Pay</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* In-app Mobile Browser Launchers */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Mobile Wallet 1-Tap Launchers:</span>
                  <span>Polygon PoS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleOpenMetaMask}
                    className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                    <span>Open in MetaMask</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenTrustWallet}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                    <span>Open in Trust Wallet</span>
                  </button>
                </div>
              </div>
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
            <span>Decentralized direct approval payment powered by Polygon PoS &amp; Verse</span>
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

      {/* QR Modal when requested */}
      {isQrModalOpen && (
        <PaymentQrModal
          invoice={invoice}
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false)
            fetchInvoice(true)
          }}
          onPaid={(paidData) => {
            if (paidData) setInvoice(paidData)
            fetchInvoice(true)
          }}
        />
      )}
    </div>
  )
}
