/**
 * Verse Merchant OS - Payment TypeScript Data Contract (Phase 6I)
 *
 * Defines the core types and interfaces for merchant payment requests and
 * settlement tracking.
 *
 * Status Lifecycle Model:
 * - pending: Payment intent created on server; awaiting transaction submission
 * - submitted: Transaction broadcast to the blockchain; awaiting confirmation
 * - confirmed: Transaction authoritatively verified on-chain at required block depth
 * - failed: Transaction reverted, dropped, or verification failed
 * - cancelled: Payment intent expired or cancelled prior to settlement
 */

export type PaymentStatus =
  | "pending"
  | "submitted"
  | "confirming"
  | "confirmed"
  | "underpaid"
  | "overpaid"
  | "failed"
  | "cancelled"

export interface PaymentToken {
  symbol: string
  name: string
  isNative: boolean
  decimals: number
  address?: string // ERC-20 contract address (empty/undefined for native tokens)
  chainId: number
}

export interface Payment {
  id: string
  merchantId: string
  invoiceId: string
  status: PaymentStatus
  chainId: number
  token: PaymentToken
  amount: string // Safe fixed-precision financial string (e.g. "120.00")
  currency: string // Persisted currency from invoice (e.g. "USD", "POL", "USDC")
  payerAddress?: string
  recipientAddress?: string
  transactionHash?: string
  blockNumber?: number
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  // Optional metadata fields for merchant ledger display
  customerName?: string
  customerEmail?: string
  reference?: string
  // UI backwards compatibility fields
  asset?: string
  fiatAmount?: string
}

export interface PaymentFiltersState {
  search: string
  status: PaymentStatus | "all"
  dateRange: "all" | "today" | "7d" | "30d" | "90d"
  tokenSymbol?: string | "all"
  asset?: string | "all"
}

export interface PaymentSummaryMetrics {
  totalVolume: string
  totalCount: number
  confirmedCount: number
  pendingCount: number
  failedCount: number
  underpaidCount: number
  overpaidCount: number
}
