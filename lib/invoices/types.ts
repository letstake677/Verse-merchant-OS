export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: string
  amount: string
}

export type InvoiceStatus = "draft" | "sent" | "open" | "pending" | "payment_submitted" | "paid" | "overdue" | "cancelled"

export interface InvoicePaymentClaim {
  claimedAt: string
  tokenSymbol: string
  tokenAmount: string
  txHash?: string
  payerWallet?: string
  customerNote?: string
}

export interface InvoicePayment {
  id: string
  txHash: string
  amount: string
  cryptoAmount?: string
  currency: string
  token: {
    symbol: string
    address: string
    decimals: number
    isNative?: boolean
  }
  chainId: number
  payerAddress: string
  recipientAddress: string
  status: "pending" | "confirmed" | "failed"
  confirmations: number
  timestamp: number
  blockNumber?: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerWallet?: string
  createdAt: string
  dueDate: string
  currency: string
  items: InvoiceItem[]
  subtotal: string
  tax: string
  total: string
  status: InvoiceStatus
  notes?: string
  paymentAddress: string
  paymentNetwork: string
  chainId: number
  payments?: InvoicePayment[]
  paymentClaim?: InvoicePaymentClaim
  paidAt?: string
}

export function calculateInvoiceTotals(items: InvoiceItem[], taxRate = 0) {
  let subtotal = 0
  for (const item of items) {
    const qty = Number(item.quantity) || 0
    const price = parseFloat(item.unitPrice || "0")
    if (!isNaN(qty) && !isNaN(price)) {
      subtotal += qty * price
    }
  }

  const tax = subtotal * taxRate
  const total = subtotal + tax

  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    subtotalFormatted: subtotal.toFixed(2),
    totalFormatted: total.toFixed(2),
  }
}
