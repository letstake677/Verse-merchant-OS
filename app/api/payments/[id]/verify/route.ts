import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PolygonTransactionVerifier } from "@/lib/payments/transaction-verifier"
import { PAYMENT_CONFIRMATION_POLICY } from "@/lib/payments/config"
import { NotificationService } from "@/lib/notifications/notification-service"
import { checkRateLimit, createRateLimitResponse } from "@/lib/auth/rate-limiter"
import { AppLogger } from "@/lib/observability/logger"

function sanitizePublicInvoice(invoice: any) {
  if (!invoice) return null
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    status: invoice.status,
    issueDate: invoice.issueDate || invoice.createdAt,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    taxRate: invoice.taxRate,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    items: invoice.items || [],
    notes: invoice.notes,
    terms: invoice.terms,
  }
}

function sanitizePublicPayment(payment: any) {
  if (!payment) return null
  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    chainId: payment.chainId,
    token: payment.token,
    recipientAddress: payment.recipientAddress,
    transactionHash: payment.transactionHash || null,
    confirmedAt: payment.confirmedAt || null,
    blockNumber: payment.blockNumber || null,
    payerAddress: payment.payerAddress || null,
    reference: payment.reference,
  }
}

/**
 * POST /api/payments/[id]/verify
 *
 * Server-authoritative endpoint to verify an on-chain transaction hash against
 * a payment intent and transition the payment and invoice lifecycle.
 *
 * Body: { transactionHash: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Rate limit verification requests
  const rateLimit = checkRateLimit(req, "payment_verify")
  if (rateLimit.limited) {
    return createRateLimitResponse(rateLimit.retryAfterSec)
  }

  try {
    const { id } = await params

    // 2. Validate Payment ID format
    if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      return NextResponse.json(
        { ok: false, message: "Invalid payment ID format." },
        { status: 400 }
      )
    }

    const paymentId = id.trim()

    // 3. Parse request body for transactionHash
    let transactionHash = ""
    try {
      const body = await req.json()
      if (body && typeof body.transactionHash === "string") {
        transactionHash = body.transactionHash.trim().toLowerCase()
      }
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid request body." },
        { status: 400 }
      )
    }

    if (!transactionHash || !/^0x[0-9a-fA-F]{64}$/.test(transactionHash)) {
      return NextResponse.json(
        { ok: false, message: "Invalid transaction hash format. Expected 66-character 0x-prefixed hex string." },
        { status: 400 }
      )
    }

    // 4. Retrieve payment document
    const payment = await PaymentRepository.findById(paymentId)
    if (!payment) {
      return NextResponse.json(
        { ok: false, message: "Payment record not found." },
        { status: 404 }
      )
    }

    // 5. Retrieve associated invoice document
    const invoice = await InvoiceRepository.findById(payment.invoiceId)
    if (!invoice) {
      return NextResponse.json(
        { ok: false, message: "Associated invoice record not found." },
        { status: 404 }
      )
    }

    // 6. Check invoice lifecycle constraints
    if (invoice.status === "cancelled") {
      await PaymentRepository.updatePaymentStatus({
        paymentId: payment.id,
        merchantId: payment.merchantId,
        status: "cancelled",
      })
      return NextResponse.json(
        { ok: false, message: "Invoice was cancelled. Payments cannot be accepted." },
        { status: 400 }
      )
    }

    if (invoice.status === "paid") {
      if (
        payment.status === "confirmed" &&
        payment.transactionHash?.toLowerCase() === transactionHash
      ) {
        return NextResponse.json({
          ok: true,
          verified: true,
          payment: sanitizePublicPayment(payment),
          invoice: sanitizePublicInvoice(invoice),
          message: "Payment already confirmed and invoice marked as paid.",
        })
      }

      return NextResponse.json(
        { ok: false, message: "Invoice is already paid with another transaction." },
        { status: 400 }
      )
    }

    // 7. Global Replay Protection Check
    const existingGlobalConfirmed = await PaymentRepository.findByTransactionHashGlobal(
      transactionHash
    )
    if (existingGlobalConfirmed && existingGlobalConfirmed.id !== payment.id) {
      AppLogger.warn("[Payment:Verify] Replay attempt detected for transaction hash", {
        transactionHash,
        targetPaymentId: payment.id,
        existingPaymentId: existingGlobalConfirmed.id,
      })
      return NextResponse.json(
        {
          ok: false,
          message: "Transaction hash has already been used for another confirmed payment.",
        },
        { status: 409 }
      )
    }

    // 8. Update status to 'submitted' if currently pending
    let currentPayment = payment
    if (payment.status === "pending") {
      const updated = await PaymentRepository.updatePaymentStatus({
        paymentId: payment.id,
        merchantId: payment.merchantId,
        status: "submitted",
        transactionHash,
      })
      if (updated) currentPayment = updated
    }

    AppLogger.auditPayment("verification_started", {
      paymentId: currentPayment.id,
      invoiceId: invoice.id,
      transactionHash,
      chainId: currentPayment.chainId,
    })

    // 9. Execute server-authoritative Polygon RPC verification
    const verification = await PolygonTransactionVerifier.verifyTransaction({
      transactionHash,
      chainId: currentPayment.chainId,
      expectedRecipient: currentPayment.recipientAddress || "",
      expectedAmount: currentPayment.amount,
      currency: currentPayment.currency,
      token: currentPayment.token,
      minBlockConfirmations: PAYMENT_CONFIRMATION_POLICY.requiredConfirmations,
    })

    // 10. Process verification outcome
    if (verification.isValid && verification.state === "confirmed") {
      const confirmedTime = new Date()
      // Confirmed: update payment and mark invoice as paid atomically
      const updatedPayment = await PaymentRepository.updatePaymentStatus({
        paymentId: currentPayment.id,
        merchantId: currentPayment.merchantId,
        status: "confirmed",
        transactionHash,
        blockNumber: verification.blockNumber,
        payerAddress: verification.payerAddress,
        confirmedAt: confirmedTime,
      })

      const updatedInvoice = await InvoiceRepository.markInvoicePaid(
        invoice.id,
        invoice.merchantId,
        currentPayment.id
      )

      AppLogger.auditPayment("verification_succeeded", {
        paymentId: currentPayment.id,
        invoiceId: invoice.id,
        transactionHash,
        blockNumber: verification.blockNumber,
        payerAddress: verification.payerAddress,
      })

      NotificationService.dispatchPaymentConfirmed({
        paymentId: currentPayment.id,
        merchantId: currentPayment.merchantId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: currentPayment.amount,
        currency: currentPayment.currency,
        tokenSymbol: currentPayment.token?.symbol || currentPayment.currency,
        payerAddress: verification.payerAddress || "N/A",
        recipientAddress: currentPayment.recipientAddress || "N/A",
        transactionHash,
        blockNumber: verification.blockNumber,
        confirmedAt: confirmedTime.toISOString(),
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
      }).catch((err) => AppLogger.warn("[VerifyRoute] Notification dispatch notice:", { error: err }))

      return NextResponse.json({
        ok: true,
        verified: true,
        payment: sanitizePublicPayment(updatedPayment || currentPayment),
        invoice: sanitizePublicInvoice(updatedInvoice || invoice),
        message: "Payment successfully verified and confirmed on Polygon!",
      })
    }

    if (verification.state === "unconfirmed") {
      // Unconfirmed (awaiting block depth or block inclusion)
      const updatedPayment = await PaymentRepository.updatePaymentStatus({
        paymentId: currentPayment.id,
        merchantId: currentPayment.merchantId,
        status: "submitted",
        transactionHash,
        payerAddress: verification.payerAddress,
      })

      return NextResponse.json({
        ok: true,
        verified: false,
        pendingConfirmations: true,
        confirmations: verification.confirmations || 0,
        requiredConfirmations: PAYMENT_CONFIRMATION_POLICY.requiredConfirmations,
        payment: sanitizePublicPayment(updatedPayment || currentPayment),
        invoice: sanitizePublicInvoice(invoice),
        message:
          verification.failureReason ||
          `Transaction submitted. Awaiting block confirmations (${verification.confirmations || 0}/${PAYMENT_CONFIRMATION_POLICY.requiredConfirmations}).`,
      })
    }

    // Failed on-chain execution or mismatched transfer details
    const failedPayment = await PaymentRepository.updatePaymentStatus({
      paymentId: currentPayment.id,
      merchantId: currentPayment.merchantId,
      status: "failed",
      transactionHash,
    })

    AppLogger.auditPayment("verification_failed", {
      paymentId: currentPayment.id,
      invoiceId: invoice.id,
      transactionHash,
      reason: verification.failureReason,
    })

    return NextResponse.json(
      {
        ok: false,
        verified: false,
        state: "failed",
        payment: sanitizePublicPayment(failedPayment || currentPayment),
        message: verification.failureReason || "Transaction verification failed on-chain.",
      },
      { status: 400 }
    )
  } catch (error) {
    AppLogger.error("[POST /api/payments/[id]/verify] Error:", error)

    return NextResponse.json(
      { ok: false, message: "Server payment verification error. Please try again." },
      { status: 500 }
    )
  }
}
