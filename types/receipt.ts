/**
 * Verse Merchant OS - Canonical Payment Receipt Data Contract (Phase 6M)
 */

export interface ReceiptTokenInfo {
  symbol: string
  name: string
  decimals: number
  address?: string
  isNative: boolean
}

export interface ReceiptItemInfo {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface PaymentReceipt {
  paymentId: string
  invoiceId: string
  invoiceNumber: string
  businessName: string
  businessAddress?: string
  businessEmail?: string
  customerName: string
  customerEmail?: string
  payerAddress: string
  recipientAddress: string
  networkName: string
  chainId: number
  token: ReceiptTokenInfo
  expectedAmount: string
  settledAmount: string
  currency: string
  transactionHash: string
  blockNumber?: number
  confirmationState: "confirmed" | "overpaid" | "underpaid" | "pending"
  confirmations?: number
  settledAt: string
  createdAt: string
  items: ReceiptItemInfo[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  notes?: string
  terms?: string
  explorerUrl: string
}
