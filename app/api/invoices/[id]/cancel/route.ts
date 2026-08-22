import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { canTransitionInvoiceStatus } from "@/lib/invoices/lifecycle"
import { requireCurrentMerchant } from "@/lib/auth/merchant"

/**
 * POST /api/invoices/[id]/cancel
 * Cancels an eligible invoice (status in draft, open, overdue) strictly scoped to the authenticated merchant.
 * Does not accept sensitive input, merchant ID, or status from the client.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Validate ID format (24-character hexadecimal MongoDB ObjectId string)
    if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      return NextResponse.json(
        { ok: false, message: "Invalid invoice ID." },
        { status: 400 }
      )
    }

    const cleanId = id.trim()

    // 2. Authoritatively resolve merchant identity on the server
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

    // 3. Resolve the current invoice using merchant-scoped repository lookup
    const existingInvoice = await InvoiceRepository.findByIdForMerchant(cleanId, merchantId)
    if (!existingInvoice) {
      return NextResponse.json(
        { ok: false, message: "Invoice not found." },
        { status: 404 }
      )
    }

    // 4. Validate the transition using the lifecycle utility
    const canCancel = canTransitionInvoiceStatus(existingInvoice.status, "cancelled")
    if (!canCancel) {
      return NextResponse.json(
        { ok: false, message: "This invoice cannot be cancelled." },
        { status: 409 }
      )
    }

    // 5. Perform the scoped update atomically
    const updatedInvoice = await InvoiceRepository.cancelInvoiceForMerchant(
      cleanId,
      merchantId
    )

    if (!updatedInvoice) {
      return NextResponse.json(
        { ok: false, message: "Invoice not found." },
        { status: 404 }
      )
    }

    // 6. Return the updated serialized invoice
    return NextResponse.json(
      {
        ok: true,
        message: "Invoice cancelled successfully.",
        invoice: updatedInvoice,
      },
      { status: 200 }
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    console.error("[POST /api/invoices/[id]/cancel] Error:", errorMsg)

    // Check for specific transition denial
    if (errorMsg === "This invoice cannot be cancelled.") {
      return NextResponse.json(
        { ok: false, message: "This invoice cannot be cancelled." },
        { status: 409 }
      )
    }

    const safeUserMessage = errorMsg.includes("MONGODB_URI")
      ? "Database configuration error: MongoDB connection is not configured."
      : "Unable to cancel this invoice."

    return NextResponse.json(
      {
        ok: false,
        message: safeUserMessage,
      },
      { status: 500 }
    )
  }
}
