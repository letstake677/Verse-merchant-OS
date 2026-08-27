import { Invoice } from "./types"
import { MERCHANT_RECEIVING_ADDRESS } from "../payments/config"

export const INITIAL_INVOICES: Invoice[] = []

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
