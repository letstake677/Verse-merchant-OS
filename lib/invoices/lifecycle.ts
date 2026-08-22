import { InvoiceStatus } from "@/types/invoice"

/**
 * Deterministic transition matrix for Invoice Lifecycle.
 * Represents allowed and rejected state transitions.
 */
const ALLOWED_TRANSITIONS: Record<InvoiceStatus, Set<InvoiceStatus>> = {
  draft: new Set<InvoiceStatus>(["open", "cancelled"]),
  open: new Set<InvoiceStatus>(["paid", "overdue", "cancelled"]),
  overdue: new Set<InvoiceStatus>(["paid", "cancelled"]),
  paid: new Set<InvoiceStatus>([]),
  cancelled: new Set<InvoiceStatus>([]),
}

/**
 * Determines whether a status transition is permitted under the invoice lifecycle rules.
 * 
 * @param fromStatus - The current status of the invoice
 * @param toStatus - The proposed new status
 */
export function canTransitionInvoiceStatus(
  fromStatus: InvoiceStatus,
  toStatus: InvoiceStatus
): boolean {
  if (fromStatus === toStatus) return false
  const allowed = ALLOWED_TRANSITIONS[fromStatus]
  return allowed ? allowed.has(toStatus) : false
}

/**
 * Centralized rule of editability for invoices.
 * Invoices in draft, open, or overdue statuses are editable.
 * Paid or cancelled invoices are locked and immutable.
 * 
 * @param status - The current status of the invoice
 */
export function isInvoiceEditable(status: InvoiceStatus): boolean {
  return status === "draft" || status === "open" || status === "overdue"
}

/**
 * Centralized rule of cancellation eligibility for invoices.
 * Invoices in draft, open, or overdue statuses are eligible for cancellation.
 * 
 * @param status - The current status of the invoice
 */
export function isInvoiceCancellable(status: InvoiceStatus): boolean {
  return status === "draft" || status === "open" || status === "overdue"
}
