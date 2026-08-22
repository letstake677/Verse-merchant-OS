/**
 * Deterministic Financial Math Utilities for Verse Merchant OS
 *
 * Avoids JavaScript floating-point representation bugs (e.g. 0.1 + 0.2 !== 0.3)
 * by computing currency line items and aggregates strictly in integer cents/base units.
 */

/**
 * Converts a numeric or string monetary value into integer cents.
 * Handles empty, partial, or malformed inputs deterministically.
 */
export function parseToCents(amount: string | number | undefined | null): number {
  if (amount === undefined || amount === null) return 0

  if (typeof amount === "number") {
    if (isNaN(amount) || !isFinite(amount)) return 0
    return Math.round(amount * 100)
  }

  if (typeof amount === "string") {
    const trimmed = amount.trim()
    if (!trimmed) return 0

    // Remove any currency symbols or formatting commas
    const cleanStr = trimmed.replace(/[^0-9.-]/g, "")
    const parsed = parseFloat(cleanStr)
    if (isNaN(parsed) || !isFinite(parsed)) return 0

    return Math.round(parsed * 100)
  }

  return 0
}

/**
 * Formats an integer amount of cents to a standard 2-decimal fixed string (e.g., "12.50").
 */
export function formatCents(cents: number): string {
  if (isNaN(cents) || !isFinite(cents)) return "0.00"
  const safeCents = Math.max(0, Math.round(cents))
  return (safeCents / 100).toFixed(2)
}

/**
 * Parses a quantity value safely. Supports integer and fractional quantities.
 */
export function parseQuantity(quantity: number | string | undefined | null): number {
  if (quantity === undefined || quantity === null) return 0

  if (typeof quantity === "number") {
    if (isNaN(quantity) || !isFinite(quantity)) return 0
    return Math.max(0, quantity)
  }

  if (typeof quantity === "string") {
    const trimmed = quantity.trim()
    if (!trimmed) return 0
    const parsed = parseFloat(trimmed)
    if (isNaN(parsed) || !isFinite(parsed)) return 0
    return Math.max(0, parsed)
  }

  return 0
}

/**
 * Calculates a single line item amount in cents deterministically.
 */
export function calculateLineItemCents(
  quantity: number | string | undefined | null,
  unitPrice: string | number | undefined | null
): number {
  const qty = parseQuantity(quantity)
  const unitCents = parseToCents(unitPrice)
  return Math.round(qty * unitCents)
}

/**
 * Formats a calculated line item amount to a safe 2-decimal string.
 */
export function calculateLineItemAmount(
  quantity: number | string | undefined | null,
  unitPrice: string | number | undefined | null
): string {
  const cents = calculateLineItemCents(quantity, unitPrice)
  return formatCents(cents)
}

/**
 * Computes aggregated financial totals for an array of line items.
 */
export function calculateInvoiceTotals(
  items: Array<{ quantity: number | string; unitPrice: string | number }>
): {
  subtotalCents: number
  subtotalFormatted: string
  totalCents: number
  totalFormatted: string
} {
  let subtotalCents = 0

  if (Array.isArray(items)) {
    for (const item of items) {
      subtotalCents += calculateLineItemCents(item.quantity, item.unitPrice)
    }
  }

  const formatted = formatCents(subtotalCents)

  return {
    subtotalCents,
    subtotalFormatted: formatted,
    totalCents: subtotalCents,
    totalFormatted: formatted,
  }
}

/**
 * Formats a currency amount with currency code or symbol for display.
 */
export function formatCurrencyDisplay(amountFormatted: string, currency: string): string {
  const safeAmount = amountFormatted || "0.00"
  const safeCurrency = currency || "USD"

  return `${safeAmount} ${safeCurrency}`
}
