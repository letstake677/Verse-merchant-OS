/**
 * Verse Merchant OS - Payment Intent Domain Contract (Phase 6I)
 *
 * Defines the core types and interfaces for payment intent creation,
 * lifecycle management, and server-authoritative settlement preparation.
 */

export type PaymentIntentStatus =
  | "pending"
  | "awaiting_payment"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "underpaid"
  | "overpaid"
  | "failed"
  | "expired"
  | "cancelled"

export interface PaymentIntentToken {
  symbol: string
  name: string
  isNative: boolean
  decimals: number
  address?: string // ERC-20 contract address (undefined/omitted for native tokens)
  chainId: number
}

export interface PaymentIntent {
  paymentId: string
  merchantId: string
  invoiceId: string
  invoiceNumber: string
  payerWalletAddress?: string | null
  merchantWalletAddress: string
  chainId: number
  token: PaymentIntentToken
  expectedAmount: string // Safe fixed-precision financial string (e.g. "120.00")
  currency: string // Persisted currency from invoice (e.g. "USD", "POL", "USDC")
  status: PaymentIntentStatus
  createdAt: string
  updatedAt: string
  expiresAt?: string | null
  transactionHash?: string | null
  blockNumber?: number | null
  confirmedAt?: string | null
  customerName?: string
  customerEmail?: string
}

export interface CreatePaymentIntentInput {
  merchantId: string
  invoiceId: string
  invoiceNumber: string
  merchantWalletAddress: string
  chainId: number
  token: PaymentIntentToken
  expectedAmount: string
  currency: string
  customerName?: string
  customerEmail?: string
  expiresAtMs?: number
}

export interface UpdatePaymentIntentStateInput {
  paymentId: string
  merchantId: string
  targetStatus: PaymentIntentStatus
  transactionHash?: string
  blockNumber?: number
  payerWalletAddress?: string
  confirmedAt?: Date
}
