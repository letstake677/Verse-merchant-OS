/**
 * Verse Merchant OS - Invoice TypeScript Data Contract
 *
 * Defines the core types and interfaces for merchant invoices and itemized
 * billing requests.
 *
 * Architectural Boundary Note:
 * An Invoice represents what the merchant requests from the customer.
 * A Payment represents how the invoice was actually settled on-chain.
 * On-chain transaction details (hashes, block numbers, gas fees) reside
 * within the Payment layer and are referenced optionally via `paymentId`.
 */

export type InvoiceStatus = "draft" | "open" | "paid" | "overdue" | "cancelled"

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: string
  amount: string
}

export interface InvoiceLineItemFormState {
  id: string
  description: string
  quantity: number | string
  unitPrice: string
  amount: string
}

export interface InvoiceFormState {
  customerName: string
  customerEmail: string
  currency: string
  dueDate: string
  items: InvoiceLineItemFormState[]
  notes: string
}

export interface InvoiceLineItemErrors {
  description?: string
  quantity?: string
  unitPrice?: string
}

export interface InvoiceFormErrors {
  customerName?: string
  customerEmail?: string
  currency?: string
  items?: Record<number, InvoiceLineItemErrors>
  general?: string
}

/**
 * Validates the client-side InvoiceFormState according to strict business logic.
 */
export function validateInvoiceForm(formData: InvoiceFormState): {
  isValid: boolean
  errors: InvoiceFormErrors
} {
  const errors: InvoiceFormErrors = {}
  let isValid = true

  // 1. Customer Name (Required, not empty)
  if (!formData.customerName || !formData.customerName.trim()) {
    errors.customerName = "Customer name is required."
    isValid = false
  }

  // 2. Customer Email (Optional, but if provided must be valid)
  if (formData.customerEmail && formData.customerEmail.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.customerEmail.trim())) {
      errors.customerEmail = "Enter a valid email address."
      isValid = false
    }
  }

  // 3. Currency (Required)
  if (!formData.currency || !formData.currency.trim()) {
    errors.currency = "Please select a currency."
    isValid = false
  }

  // 4. Line Items (At least 1 item required, valid description, quantity > 0, price >= 0)
  if (!formData.items || formData.items.length === 0) {
    errors.general = "At least one line item is required."
    isValid = false
  } else {
    const itemErrors: Record<number, InvoiceLineItemErrors> = {}
    let hasItemErrors = false

    formData.items.forEach((item, index) => {
      const lineError: InvoiceLineItemErrors = {}

      if (!item.description || !item.description.trim()) {
        lineError.description = "Add a description for this item."
        hasItemErrors = true
      }

      const qty =
        typeof item.quantity === "number"
          ? item.quantity
          : parseFloat(item.quantity)
      if (item.quantity === "" || isNaN(qty) || qty <= 0) {
        lineError.quantity = "Quantity must be greater than 0."
        hasItemErrors = true
      }

      const price = parseFloat(item.unitPrice)
      if (item.unitPrice === "" || isNaN(price) || price < 0) {
        lineError.unitPrice = "Enter a valid unit price."
        hasItemErrors = true
      }

      if (Object.keys(lineError).length > 0) {
        itemErrors[index] = lineError
      }
    })

    if (hasItemErrors) {
      errors.items = itemErrors
      isValid = false
    }
  }

  return { isValid, errors }
}

export interface Invoice {
  id: string
  merchantId: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  invoiceNumber: string
  status: InvoiceStatus
  currency: string
  items: InvoiceItem[]
  subtotal: string
  taxRate?: string
  taxAmount?: string
  total: string
  notes?: string
  dueDate?: string
  paymentAddress?: string
  paymentNetwork?: string
  chainId?: number
  createdAt: string
  updatedAt?: string
  paidAt?: string
  paymentId?: string // Optional reference to the settled Payment record
}

export interface InvoiceFiltersState {
  search: string
  status: InvoiceStatus | "all"
  dateRange: "all" | "today" | "7d" | "30d" | "90d"
  customer: string
}
