import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { isInvoiceEditable } from "@/lib/invoices/lifecycle"
import { validateInvoiceData } from "@/lib/invoices/validation"
import { requireCurrentMerchant } from "@/lib/auth/merchant"

/**
 * GET /api/invoices/[id]
 * Retrieves a single invoice document strictly isolated to the authenticated merchant.
 */
export async function GET(
  _req: NextRequest,
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

    // 3. Query repository strictly isolated to merchant
    const invoice = await InvoiceRepository.findByIdForMerchant(cleanId, merchantId)

    if (!invoice) {
      return NextResponse.json(
        { ok: false, message: "Invoice not found." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      invoice,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    console.error("[GET /api/invoices/[id]] Error:", errorMsg)

    const safeUserMessage = errorMsg.includes("MONGODB_URI")
      ? "Database configuration notice: MongoDB connection is not configured."
      : "Failed to retrieve invoice. Please try again later."

    return NextResponse.json(
      { ok: false, message: safeUserMessage },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/invoices/[id]
 * Validates editable invoice fields, recalculates deterministic totals server-side,
 * and persists the updated invoice strictly scoped to the authenticated merchant.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Validate ObjectId format
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

    // 3. Load existing invoice to verify ownership and check editability
    const existingInvoice = await InvoiceRepository.findByIdForMerchant(cleanId, merchantId)

    if (!existingInvoice) {
      return NextResponse.json(
        { ok: false, message: "Invoice not found." },
        { status: 404 }
      )
    }

    // 4. Status restriction checks: Paid and Cancelled invoices cannot be edited
    if (!isInvoiceEditable(existingInvoice.status)) {
      return NextResponse.json(
        { ok: false, message: `${existingInvoice.status.charAt(0).toUpperCase() + existingInvoice.status.slice(1)} invoices cannot be edited.` },
        { status: 409 }
      )
    }

    // 5. Parse request body
    const body = await req.json()

    // 6. Enforce server-side financial invariant and data limits validation
    const validationResult = validateInvoiceData(body)
    if (!validationResult.ok || !validationResult.data) {
      return NextResponse.json(
        { ok: false, message: validationResult.error || "Invalid invoice data." },
        { status: 400 }
      )
    }

    // 7. Persist update in MongoDB via repository
    const updatedInvoice = await InvoiceRepository.updateInvoiceForMerchant(
      cleanId,
      merchantId,
      validationResult.data
    )

    if (!updatedInvoice) {
      return NextResponse.json(
        { ok: false, message: "Invoice not found or could not be updated." },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Invoice updated successfully.",
        invoice: updatedInvoice,
      },
      { status: 200 }
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    console.error("[PATCH /api/invoices/[id]] Error updating invoice:", errorMsg)

    if (errorMsg === "This invoice cannot be edited.") {
      return NextResponse.json(
        { ok: false, message: "This invoice cannot be edited in its current status." },
        { status: 409 }
      )
    }

    const safeUserMessage = errorMsg.includes("MONGODB_URI")
      ? "Database configuration error: MongoDB connection is not configured."
      : "Failed to update invoice. Please try again later."

    return NextResponse.json(
      {
        ok: false,
        message: safeUserMessage,
      },
      { status: 500 }
    )
  }
}
