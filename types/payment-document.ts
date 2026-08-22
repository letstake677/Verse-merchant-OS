import { ObjectId } from "mongodb"
import { Payment, PaymentStatus, PaymentToken } from "./payment"

/**
 * MongoDB Persisted Payment Document Contract
 *
 * Represents the document structure stored inside the MongoDB "payments" collection.
 * Maintains strict merchant isolation via `merchantId`.
 *
 * Financial integrity:
 * - Amount is preserved as a fixed-precision string to avoid IEEE-754 floating point inaccuracies.
 * - Currency and amount must derive from the persisted Invoice total.
 */
export interface PaymentDocument {
  _id: ObjectId
  merchantId: string
  invoiceId: string
  status: PaymentStatus
  chainId: number
  token: PaymentToken
  amount: string
  currency: string
  payerAddress?: string
  recipientAddress?: string
  transactionHash?: string
  blockNumber?: number
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date
  customerName?: string
  customerEmail?: string
  reference?: string
}

/**
 * DTO for creating a new Payment intent in the repository
 */
export interface CreatePaymentInput {
  merchantId: string
  invoiceId: string
  status?: PaymentStatus
  chainId: number
  token: PaymentToken
  amount: string
  currency: string
  payerAddress?: string
  recipientAddress?: string
  transactionHash?: string
  blockNumber?: number
  customerName?: string
  customerEmail?: string
  reference?: string
}

/**
 * DTO for updating payment status & on-chain verification metadata
 */
export interface UpdatePaymentStatusInput {
  paymentId: string
  merchantId: string
  status: PaymentStatus
  transactionHash?: string
  blockNumber?: number
  payerAddress?: string
  confirmedAt?: Date
}

/**
 * Query options for filtering and paginating merchant payments
 */
export interface PaymentQueryOptions {
  status?: PaymentStatus | "all"
  search?: string
  dateRange?: "all" | "today" | "7d" | "30d" | "90d"
  tokenSymbol?: string | "all"
  page?: number
  limit?: number
  skip?: number
  sort?: Record<string, 1 | -1>
}

/**
 * Transforms a MongoDB PaymentDocument into an application-level Payment contract.
 */
export function serializePaymentDocument(doc: PaymentDocument): Payment {
  return {
    id: doc._id.toHexString(),
    merchantId: doc.merchantId,
    invoiceId: doc.invoiceId,
    status: doc.status,
    chainId: doc.chainId,
    token: {
      symbol: doc.token?.symbol || "POL",
      name: doc.token?.name || "Polygon Native",
      isNative: Boolean(doc.token?.isNative),
      decimals: doc.token?.decimals || 18,
      address: doc.token?.address,
      chainId: doc.token?.chainId || doc.chainId,
    },
    amount: doc.amount,
    currency: doc.currency,
    payerAddress: doc.payerAddress,
    recipientAddress: doc.recipientAddress,
    transactionHash: doc.transactionHash,
    blockNumber: doc.blockNumber,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
    confirmedAt: doc.confirmedAt ? doc.confirmedAt.toISOString() : undefined,
    customerName: doc.customerName,
    customerEmail: doc.customerEmail,
    reference: doc.reference,
    asset: doc.token?.symbol || doc.currency,
    fiatAmount: doc.amount,
  }
}
