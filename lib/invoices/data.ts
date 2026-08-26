import { Invoice } from "./types"
import { MERCHANT_RECEIVING_ADDRESS } from "../payments/config"

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv-0001",
    invoiceNumber: "INV-0001",
    customerName: "Acme Web3 Labs",
    customerEmail: "finance@acmelabs.io",
    customerWallet: "0x71C...89A",
    createdAt: "2026-08-20",
    dueDate: "2026-09-20",
    currency: "USD",
    items: [
      {
        id: "item-1",
        description: "Polygon Smart Contract Security Audit",
        quantity: 1,
        unitPrice: "450.00",
        amount: "450.00",
      },
    ],
    subtotal: "450.00",
    tax: "0.00",
    total: "450.00",
    status: "paid",
    notes: "Payment settled on-chain with USDC.",
    paymentAddress: MERCHANT_RECEIVING_ADDRESS,
    paymentNetwork: "Polygon Mainnet",
    chainId: 137,
    paidAt: "2026-08-21T14:20:00Z",
  },
  {
    id: "inv-0002",
    invoiceNumber: "INV-0002",
    customerName: "Verse Ecosystem DAO",
    customerEmail: "treasury@verse.org",
    createdAt: "2026-08-22",
    dueDate: "2026-09-22",
    currency: "USD",
    items: [
      {
        id: "item-1",
        description: "DeFi Liquidity Pool Integration",
        quantity: 1,
        unitPrice: "1250.00",
        amount: "1250.00",
      },
    ],
    subtotal: "1250.00",
    tax: "0.00",
    total: "1250.00",
    status: "pending",
    notes: "Awaiting on-chain payment.",
    paymentAddress: MERCHANT_RECEIVING_ADDRESS,
    paymentNetwork: "Polygon Mainnet",
    chainId: 137,
  },
  {
    id: "inv-0003",
    invoiceNumber: "INV-0003",
    customerName: "Polygon Micro-Test Customer",
    customerEmail: "tester@polygon.tech",
    createdAt: "2026-08-25",
    dueDate: "2026-09-25",
    currency: "USD",
    items: [
      {
        id: "item-1",
        description: "On-Chain Micro Checkout Test",
        quantity: 1,
        unitPrice: "0.05",
        amount: "0.05",
      },
    ],
    subtotal: "0.05",
    tax: "0.00",
    total: "0.05",
    status: "sent",
    notes: "Real-time crypto price calculation test.",
    paymentAddress: MERCHANT_RECEIVING_ADDRESS,
    paymentNetwork: "Polygon Mainnet",
    chainId: 137,
  },
]

// Server-side in-memory registry
let globalInvoices = [...INITIAL_INVOICES]

export function getAllInvoices(): Invoice[] {
  return globalInvoices
}

export function getInvoiceById(id: string): Invoice | undefined {
  return globalInvoices.find(
    (inv) => inv.id.toLowerCase() === id.toLowerCase() || inv.invoiceNumber.toLowerCase() === id.toLowerCase()
  )
}

export function saveInvoice(invoice: Invoice): Invoice {
  const index = globalInvoices.findIndex((inv) => inv.id === invoice.id)
  if (index >= 0) {
    globalInvoices[index] = invoice
  } else {
    globalInvoices.unshift(invoice)
  }
  return invoice
}
