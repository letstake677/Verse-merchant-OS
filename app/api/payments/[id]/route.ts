import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { requireCurrentMerchant } from "@/lib/auth/merchant"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"

/**
 * GET /api/payments/[id]
 * Authenticated server endpoint to retrieve a single merchant payment and its associated invoice.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const payment = await PaymentRepository.findByIdForMerchant(paymentId, merchantId)
    if (!payment) {
      return NextResponse.json(
        { ok: false, message: "Payment record not found." },
        { status: 404 }
      )
    }

    const invoice = await InvoiceRepository.findByIdForMerchant(payment.invoiceId, merchantId)

    return NextResponse.json({
      ok: true,
      payment,
      invoice,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    console.error("[GET /api/payments/[id]] Error:", errorMsg)

    return NextResponse.json(
      { ok: false, message: "Failed to retrieve payment details." },
      { status: 500 }
    )
  }
}
