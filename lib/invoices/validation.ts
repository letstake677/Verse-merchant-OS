import { parseQuantity, parseToCents, calculateLineItemAmount, calculateInvoiceTotals } from "@/lib/financial"

export interface ValidatedLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: string
  amount: string
}

export interface ValidatedInvoiceData {
  customerName: string
  customerEmail?: string
  currency: string
  items: ValidatedLineItem[]
  subtotal: string
  taxRate: string
  taxAmount: string
  total: string
  notes?: string
  dueDate?: string
}

export interface ValidationResult {
  ok: boolean
  error?: string
  data?: ValidatedInvoiceData
}

const SUPPORTED_CURRENCIES = new Set(["USD", "EUR", "GBP"])

/**
 * Pure server-side validation function for invoice creation/updating.
 * Enforces strict financial invariants and data limits.
 * 
 * @param body - The raw request body
 */
export function validateInvoiceData(body: any): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request payload." }
  }

  // 1. Customer Name Validation
  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : ""
  if (!customerName) {
    return { ok: false, error: "Customer name is required." }
  }
  if (customerName.length > 150) {
    return { ok: false, error: "Customer name cannot exceed 150 characters." }
  }

  // 2. Customer Email Validation (Optional)
  let customerEmail: string | undefined = undefined
  if (typeof body.customerEmail === "string" && body.customerEmail.trim()) {
    const emailTrimmed = body.customerEmail.trim()
    if (emailTrimmed.length > 254) {
      return { ok: false, error: "Customer email cannot exceed 254 characters." }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailTrimmed)) {
      return { ok: false, error: "Invalid customer email address." }
    }
    customerEmail = emailTrimmed
  }

  // 3. Currency Validation
  const currency = typeof body.currency === "string" ? body.currency.trim().toUpperCase() : "USD"
  if (!SUPPORTED_CURRENCIES.has(currency)) {
    return { ok: false, error: "A valid currency (USD, EUR, or GBP) is required." }
  }

  // 4. Line Items Validation
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { ok: false, error: "At least one line item is required." }
  }
  if (body.items.length > 50) {
    return { ok: false, error: "An invoice cannot contain more than 50 line items." }
  }

  const validatedItems: ValidatedLineItem[] = []
  for (let i = 0; i < body.items.length; i++) {
    const rawItem = body.items[i]
    if (!rawItem || typeof rawItem !== "object") {
      return { ok: false, error: `Line item ${i + 1} is malformed.` }
    }

    const description = typeof rawItem.description === "string" ? rawItem.description.trim() : ""
    if (!description) {
      return { ok: false, error: `Line item ${i + 1} must include a description.` }
    }
    if (description.length > 500) {
      return { ok: false, error: `Line item ${i + 1} description cannot exceed 500 characters.` }
    }

    // Parse & Validate Quantity
    const rawQty = rawItem.quantity
    const qty = parseQuantity(rawQty)
    if (qty <= 0) {
      return { ok: false, error: `Line item ${i + 1} quantity must be greater than 0.` }
    }
    if (qty > 1000000) {
      return { ok: false, error: `Line item ${i + 1} quantity cannot exceed 1,000,000.` }
    }
    if (!isFinite(qty) || isNaN(qty)) {
      return { ok: false, error: `Line item ${i + 1} quantity is invalid.` }
    }

    // Parse & Validate Unit Price
    const rawPrice = rawItem.unitPrice
    const unitCents = parseToCents(rawPrice)
    if (unitCents < 0) {
      return { ok: false, error: `Line item ${i + 1} unit price cannot be negative.` }
    }
    if (unitCents > 1000000000) { // $10,000,000.00
      return { ok: false, error: `Line item ${i + 1} unit price is too high.` }
    }
    if (!isFinite(unitCents) || isNaN(unitCents)) {
      return { ok: false, error: `Line item ${i + 1} unit price is invalid.` }
    }

    const lineAmountFormatted = calculateLineItemAmount(qty, rawPrice)

    validatedItems.push({
      id: rawItem.id && typeof rawItem.id === "string" ? rawItem.id : `item-${i + 1}`,
      description,
      quantity: qty,
      unitPrice: rawPrice !== undefined && rawPrice !== null ? String(rawPrice).trim() : "0.00",
      amount: lineAmountFormatted,
    })
  }

  // 5. Server-Authoritative Totals Calculation
  const totals = calculateInvoiceTotals(validatedItems)

  // 6. Notes Validation (Optional)
  let notes: string | undefined = undefined
  if (typeof body.notes === "string") {
    const trimmedNotes = body.notes.trim()
    if (trimmedNotes.length > 2000) {
      return { ok: false, error: "Customer notes cannot exceed 2000 characters." }
    }
    if (trimmedNotes.length > 0) {
      notes = trimmedNotes
    }
  }

  // 7. Due Date Validation (Optional)
  let dueDate: string | undefined = undefined
  if (typeof body.dueDate === "string" && body.dueDate.trim()) {
    const dateTrimmed = body.dueDate.trim()
    const parsedDate = new Date(dateTrimmed)
    if (isNaN(parsedDate.getTime())) {
      return { ok: false, error: "Due date must be a valid date." }
    }
    dueDate = dateTrimmed
  }

  return {
    ok: true,
    data: {
      customerName,
      customerEmail,
      currency,
      items: validatedItems,
      subtotal: totals.subtotalFormatted,
      taxRate: "0.00",
      taxAmount: "0.00",
      total: totals.totalFormatted,
      notes,
      dueDate,
    },
  }
}
