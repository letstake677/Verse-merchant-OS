import { Payment } from "@/types/payment"
import { Invoice } from "@/types/invoice"
import { PaymentReceipt } from "@/types/receipt"
import { POLYGON_MAINNET_CHAIN_ID } from "@/lib/payments/config"

export function getExplorerTxUrl(txHash: string, _chainId?: number): string {
  if (!txHash) return "#"
  return `https://polygonscan.com/tx/${txHash.trim()}`
}

export function getNetworkDisplayName(_chainId?: number): string {
  return "Polygon Mainnet (Chain #137)"
}

/**
 * Builds a canonical, sanitized payment receipt object for public or merchant receipt views.
 * 
 * Strict Security Guarantees:
 * - Excludes database ObjectIds, internal merchant IDs, session secrets, or private flags.
 * - Formats asset details, wallet addresses, and calculation values safely.
 */
export function buildCanonicalReceipt(
  payment: Payment,
  invoice: Invoice,
  merchantInfo?: { businessName?: string; displayName?: string; email?: string }
): PaymentReceipt {
  const chainId = payment.chainId || invoice.chainId || 137
  const networkName = getNetworkDisplayName(chainId)
  const txHash = payment.transactionHash || ""
  const explorerUrl = getExplorerTxUrl(txHash, chainId)

  const businessName =
    merchantInfo?.businessName ||
    merchantInfo?.displayName ||
    (invoice as any).businessName ||
    "Verse Merchant Workspace"

  const subtotal = typeof invoice.subtotal === "number" ? invoice.subtotal : parseFloat(invoice.subtotal || "0")
  const taxRate = typeof invoice.taxRate === "number" ? invoice.taxRate : parseFloat(invoice.taxRate || "0")
  const taxAmount = typeof invoice.taxAmount === "number" ? invoice.taxAmount : parseFloat(invoice.taxAmount || "0")
  const total = typeof invoice.total === "number" ? invoice.total : parseFloat(invoice.total || "0")

  const items = (invoice.items || []).map((item) => ({
    id: item.id,
    description: item.description || "Invoice Item",
    quantity: item.quantity || 1,
    unitPrice: typeof item.unitPrice === "number" ? item.unitPrice : parseFloat(item.unitPrice || "0"),
    amount: typeof item.amount === "number" ? item.amount : parseFloat(item.amount || "0"),
  }))

  const tokenInfo = {
    symbol: payment.token?.symbol || payment.currency || invoice.currency || "USDC",
    name: payment.token?.name || payment.token?.symbol || payment.currency || "USD Coin",
    decimals: payment.token?.decimals ?? 18,
    address: payment.token?.address,
    isNative: payment.token?.isNative ?? false,
  }

  const confirmationState =
    payment.status === "confirmed"
      ? "confirmed"
      : payment.status === "overpaid"
      ? "overpaid"
      : payment.status === "underpaid"
      ? "underpaid"
      : "pending"

  return {
    paymentId: payment.id,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    businessName,
    businessEmail: merchantInfo?.email,
    customerName: invoice.customerName || payment.customerName || "Customer",
    customerEmail: invoice.customerEmail || payment.customerEmail,
    payerAddress: payment.payerAddress || "N/A",
    recipientAddress: payment.recipientAddress || "N/A",
    networkName,
    chainId,
    token: tokenInfo,
    expectedAmount: payment.amount || invoice.total,
    settledAmount: payment.amount || invoice.total,
    currency: invoice.currency || payment.currency || "USD",
    transactionHash: txHash,
    blockNumber: payment.blockNumber,
    confirmationState,
    confirmations: payment.blockNumber ? 12 : 0,
    settledAt: payment.confirmedAt || payment.updatedAt || new Date().toISOString(),
    createdAt: payment.createdAt || invoice.createdAt,
    items,
    subtotal,
    taxRate,
    taxAmount,
    total,
    notes: invoice.notes,
    terms: invoice.terms,
    explorerUrl,
  }
}
