import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { requireCurrentMerchant } from "@/lib/auth/merchant"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PolygonTransactionVerifier } from "@/lib/payments/transaction-verifier"
import { PaymentVerificationSpec } from "@/lib/payments/verification-architecture"
import { NotificationService } from "@/lib/notifications/notification-service"
import { checkRateLimit, createRateLimitResponse } from "@/lib/auth/rate-limiter"
import { AppLogger } from "@/lib/observability/logger"

/**
 * POST /api/payments/[id]/reconcile
 * Authenticated server endpoint for merchants to re-verify and reconcile on-chain payment settlement.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit reconcile requests
  const rateLimit = checkRateLimit(req, "payment_reconcile")
  if (rateLimit.limited) {
    return createRateLimitResponse(rateLimit.retryAfterSec)
  }

  try {
    // 1. Authenticate merchant
    let merchantId: string
    try {
      const identity = await requireCurrentMerchant()
      merchantId = identity.merchantId
    } catch (authError) {
      if (authError instanceof Error && authError.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { ok: false, message: "Authentication required." },
          { status: 401 }
        )
      }
      throw authError
    }

    const { id: paymentId } = await params
    if (!paymentId) {
      return NextResponse.json(
        { ok: false, message: "Payment ID is required." },
        { status: 400 }
      )
    }

    // 2. Load payment record strictly scoped to merchant
    const payment = await PaymentRepository.findByIdForMerchant(paymentId, merchantId)
    if (!payment) {
      return NextResponse.json(
        { ok: false, message: "Payment record not found." },
        { status: 404 }
      )
    }

    if (!payment.transactionHash) {
      return NextResponse.json(
        {
          ok: false,
          message: "No on-chain transaction hash associated with this payment record.",
          payment,
        },
        { status: 400 }
      )
    }

    // 3. Load associated invoice record
    const invoice = await InvoiceRepository.findByIdForMerchant(payment.invoiceId, merchantId)
    if (!invoice) {
      return NextResponse.json(
        { ok: false, message: "Associated invoice record not found." },
        { status: 404 }
      )
    }

    // 4. Global Replay Protection Check
    const globalTxMatch = await PaymentRepository.findByTransactionHashGlobal(
      payment.transactionHash
    )
    if (globalTxMatch && globalTxMatch.id !== payment.id) {
      // Transaction hash already settled another invoice!
      await PaymentRepository.updatePaymentStatus({
        paymentId: payment.id,
        merchantId,
        status: "failed",
      })

      AppLogger.warn("[Payment:Reconcile] Replay transaction hash collision prevented", {
        paymentId: payment.id,
        existingPaymentId: globalTxMatch.id,
        transactionHash: payment.transactionHash,
      })

      return NextResponse.json({
        ok: false,
        reconciled: false,
        status: "failed",
        message: "Transaction hash has already been used to settle a different invoice (Replay detected).",
      })
    }

    // 5. Build verification specification
    const spec: PaymentVerificationSpec = {
      transactionHash: payment.transactionHash,
      chainId: payment.chainId,
      expectedRecipient: payment.recipientAddress || invoice.merchantId,
      expectedAmount: payment.amount,
      currency: payment.currency,
      token: payment.token,
      minBlockConfirmations: 1,
    }

    AppLogger.auditPayment("verification_started", {
      action: "reconciliation_initiated",
      paymentId: payment.id,
      invoiceId: invoice.id,
      merchantId,
      transactionHash: payment.transactionHash,
    })

    // 6. Independently query Polygon RPC
    const verification = await PolygonTransactionVerifier.verifyTransaction(spec)

    // 7. Process verification state transitions atomically
    let updatedPayment = payment

    if (verification.isValid && (verification.state === "confirmed" || verification.state === "overpaid")) {
      const targetStatus = verification.state === "overpaid" ? "overpaid" : "confirmed"
      const confirmedTime = new Date()

      updatedPayment = (await PaymentRepository.updatePaymentStatus({
        paymentId: payment.id,
        merchantId,
        status: targetStatus,
        transactionHash: verification.transactionHash,
        blockNumber: verification.blockNumber,
        payerAddress: verification.payerAddress,
        confirmedAt: confirmedTime,
      })) || payment

      // Mark invoice paid atomically
      await InvoiceRepository.markInvoicePaid(invoice.id, merchantId, payment.id)

      AppLogger.auditPayment("reconciled", {
        paymentId: payment.id,
        merchantId,
        invoiceId: invoice.id,
        state: targetStatus,
        transactionHash: verification.transactionHash,
      })

      NotificationService.dispatchPaymentConfirmed({
        paymentId: payment.id,
        merchantId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        tokenSymbol: payment.token?.symbol || payment.currency,
        payerAddress: verification.payerAddress || payment.payerAddress || "N/A",
        recipientAddress: payment.recipientAddress || "N/A",
        transactionHash: verification.transactionHash || payment.transactionHash || "",
        blockNumber: verification.blockNumber,
        confirmedAt: confirmedTime.toISOString(),
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
      }).catch((err) => AppLogger.warn("[ReconcileRoute] Notification dispatch notice:", { error: err }))
    } else if (verification.reconciliationOutcome === "underpaid") {
      updatedPayment = (await PaymentRepository.updatePaymentStatus({
        paymentId: payment.id,
        merchantId,
        status: "underpaid",
        transactionHash: verification.transactionHash,
        blockNumber: verification.blockNumber,
        payerAddress: verification.payerAddress,
      })) || payment
    } else if (verification.state === "failed") {
      updatedPayment = (await PaymentRepository.updatePaymentStatus({
        paymentId: payment.id,
        merchantId,
        status: "failed",
        transactionHash: verification.transactionHash,
        blockNumber: verification.blockNumber,
      })) || payment
    }

    return NextResponse.json({
      ok: true,
      reconciled: verification.isValid,
      verification,
      payment: updatedPayment,
    })
  } catch (error) {
    AppLogger.error("[POST /api/payments/[id]/reconcile] Error:", error)

    return NextResponse.json(
      { ok: false, message: "Failed to reconcile payment on blockchain." },
      { status: 500 }
    )
  }
}
