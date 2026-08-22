import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

import { PaymentRepository } from "@/lib/repositories/payment-repository"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { buildCanonicalReceipt } from "@/lib/payments/receipt"
import { getDb } from "@/lib/db/mongodb"

/**
 * GET /api/payments/[id]/receipt
 * Public server endpoint to retrieve a canonical, sanitized payment receipt.
 *
 * Security:
 * - Publicly accessible for valid payment IDs so customers can verify receipts without merchant credentials.
 * - Enforces strict sanitization to prevent merchant data leakage (strips database ObjectIds, internal flags, SIWE session tokens, etc.).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      return NextResponse.json(
        { ok: false, message: "Invalid payment receipt ID format." },
        { status: 400 }
      )
    }

    const paymentId = id.trim()

    // 1. Fetch payment record
    const payment = await PaymentRepository.findById(paymentId)
    if (!payment) {
      return NextResponse.json(
        { ok: false, message: "Receipt unavailable. Payment record not found." },
        { status: 404 }
      )
    }

    // 2. Fetch associated invoice
    const invoice = await InvoiceRepository.findById(payment.invoiceId)
    if (!invoice) {
      return NextResponse.json(
        { ok: false, message: "Receipt unavailable. Associated invoice not found." },
        { status: 404 }
      )
    }

    // 3. Fetch merchant business name if available
    let merchantInfo: { businessName?: string; displayName?: string } = {}
    try {
      const db = await getDb()
      const merchantDoc = await db.collection("merchants").findOne(
        { _id: payment.merchantId as any },
        { projection: { businessName: 1, displayName: 1 } }
      )
      if (merchantDoc) {
        merchantInfo = {
          businessName: merchantDoc.businessName,
          displayName: merchantDoc.displayName,
        }
      }
    } catch {
      // Non-critical fallback
    }

    // 4. Construct canonical, sanitized receipt
    const receipt = buildCanonicalReceipt(payment, invoice, merchantInfo)

    return NextResponse.json({
      ok: true,
      receipt,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    console.error("[GET /api/payments/[id]/receipt] Error:", errorMsg)

    return NextResponse.json(
      { ok: false, message: "Failed to generate payment receipt. Please try again." },
      { status: 500 }
    )
  }
}
