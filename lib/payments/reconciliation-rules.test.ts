import {
  isValidPaymentStatusTransition,
  isTerminalPaymentStatus,
  PAYMENT_STATUS_TRANSITIONS,
} from "./status-machine"
import { PaymentIntentStatus } from "@/types/payment-intent"

/**
 * Phase 6K Deterministic Test Suite
 * Validates Payment Lifecycle State Machine & Settlement Reconciliation Rules
 */
export function runReconciliationTests() {
  const results: { test: string; passed: boolean; error?: string }[] = []

  function assert(condition: boolean, testName: string, failureMsg?: string) {
    if (condition) {
      results.push({ test: testName, passed: true })
    } else {
      results.push({ test: testName, passed: false, error: failureMsg || "Assertion failed" })
    }
  }

  // 1. Test Valid Transitions
  assert(
    isValidPaymentStatusTransition("pending", "awaiting_payment"),
    "pending -> awaiting_payment transition"
  )
  assert(
    isValidPaymentStatusTransition("submitted", "confirming"),
    "submitted -> confirming transition"
  )
  assert(
    isValidPaymentStatusTransition("confirming", "confirmed"),
    "confirming -> confirmed transition"
  )
  assert(
    isValidPaymentStatusTransition("confirming", "underpaid"),
    "confirming -> underpaid transition"
  )
  assert(
    isValidPaymentStatusTransition("confirming", "overpaid"),
    "confirming -> overpaid transition"
  )
  assert(
    isValidPaymentStatusTransition("submitted", "failed"),
    "submitted -> failed transition"
  )

  // 2. Test Terminal States
  assert(isTerminalPaymentStatus("confirmed"), "confirmed is terminal state")
  assert(isTerminalPaymentStatus("underpaid"), "underpaid is terminal state")
  assert(isTerminalPaymentStatus("overpaid"), "overpaid is terminal state")
  assert(isTerminalPaymentStatus("cancelled"), "cancelled is terminal state")
  assert(isTerminalPaymentStatus("expired"), "expired is terminal state")

  // 3. Test Invalid Transitions from Terminal States
  assert(
    !isValidPaymentStatusTransition("confirmed", "submitted"),
    "confirmed -> submitted invalid transition rejected"
  )
  assert(
    !isValidPaymentStatusTransition("underpaid", "confirmed"),
    "underpaid -> confirmed invalid transition rejected"
  )
  assert(
    !isValidPaymentStatusTransition("overpaid", "failed"),
    "overpaid -> failed invalid transition rejected"
  )

  const failures = results.filter((r) => !r.passed)
  if (failures.length > 0) {
    throw new Error(`Reconciliation tests failed: ${JSON.stringify(failures, null, 2)}`)
  }

  return { total: results.length, passed: true }
}

// Execute tests if invoked directly
if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
  runReconciliationTests()
}
