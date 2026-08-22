import { PaymentIntentStatus } from "@/types/payment-intent"

/**
 * Verse Merchant OS - Payment Status Lifecycle & State Machine (Phase 6I)
 *
 * Defines explicit, server-authoritative lifecycle rules and valid transitions
 * for Web3 payment intents.
 *
 * Terminal States:
 * - confirmed: Payment successfully verified on-chain at required block depth
 * - cancelled: Payment intent explicitly voided by merchant or user
 * - expired: Payment intent passed valid time window without submission
 */

export const PAYMENT_STATUS_TRANSITIONS: Record<
  PaymentIntentStatus,
  PaymentIntentStatus[]
> = {
  pending: ["awaiting_payment", "cancelled", "expired"],
  awaiting_payment: ["submitted", "cancelled", "expired"],
  submitted: ["confirming", "confirmed", "underpaid", "overpaid", "failed", "expired"],
  confirming: ["confirmed", "underpaid", "overpaid", "failed"],
  confirmed: [], // Terminal state
  underpaid: [], // Terminal reconciled state
  overpaid: [], // Terminal reconciled state
  failed: ["awaiting_payment", "cancelled", "expired"],
  expired: [], // Terminal state
  cancelled: [], // Terminal state
}

/**
 * Validates whether a state transition from `current` to `target` is allowed.
 */
export function isValidPaymentStatusTransition(
  current: PaymentIntentStatus,
  target: PaymentIntentStatus
): boolean {
  if (current === target) return true
  const allowed = PAYMENT_STATUS_TRANSITIONS[current]
  if (!allowed) return false
  return allowed.includes(target)
}

/**
 * Checks if a status is terminal (cannot transition further).
 */
export function isTerminalPaymentStatus(status: PaymentIntentStatus): boolean {
  const allowed = PAYMENT_STATUS_TRANSITIONS[status]
  return !allowed || allowed.length === 0
}
