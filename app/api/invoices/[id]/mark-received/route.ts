import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSession } from "@/lib/auth/session"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"

/**
 * POST /api/invoices/[id]/mark-received
 * Allows ONLY the invoice creator (authenticated merchant) to mark an invoice as paid/received.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. You must be logged in as the invoice creator." },
        { status: 401 }
      )
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing invoice ID" }, { status: 400 })
    }

    const cleanId = decodeURIComponent(id).trim()

    // 1. Fetch invoice and ensure it belongs to the authenticated merchant
    let invoice = await InvoiceRepository.findByIdForMerchant(cleanId, session.merchantId)
    if (!invoice) {
      invoice = await InvoiceRepository.findByMerchantIdAndInvoiceNumber(session.merchantId, cleanId)
    }

    if (!invoice) {
      // Check if invoice exists globally to return clear error if not owned
      const globalInvoice = await InvoiceRepository.findById(cleanId) || await InvoiceRepository.findByInvoiceNumber(cleanId)
      if (globalInvoice) {
        return NextResponse.json(
          { ok: false, error: "Permission denied. Only the creator of this invoice can mark it as received." },
          { status: 403 }
        )
      }
      return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 })
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ ok: true, message: "Invoice is already marked as paid.", invoice })
    }

    const numericTotal = parseFloat(invoice.total || "0")
    const manualTxHash = `manual_creator_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // 2. Create payment record for accounting/reporting
    const payment = await PaymentRepository.createPayment({
      merchantId: session.merchantId,
      invoiceId: invoice.id,
      status: "confirmed",
      chainId: 137,
      token: {
        symbol: "USDC",
        address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        decimals: 6,
        isNative: false,
      },
      amount: numericTotal,
      currency: invoice.currency || "USD",
      payerAddress: session.walletAddress || "0x0000000000000000000000000000000000000000",
      recipientAddress: invoice.paymentAddress || session.walletAddress || "",
      transactionHash: manualTxHash,
    })

    // 3. Mark invoice paid authoritatively
    const updatedInvoice = await InvoiceRepository.markInvoicePaid(
      invoice.id,
      session.merchantId,
      payment.id
    )

    return NextResponse.json({
      ok: true,
      message: "Invoice marked as received successfully.",
      invoice: updatedInvoice || { ...invoice, status: "paid" },
      payment,
    })
  } catch (error) {
    console.error("[POST /api/invoices/[id]/mark-received] Error:", error)
    return NextResponse.json(
      { ok: false, error: (error as Error).message || "Internal server error" },
      { status: 500 }
    )
  }
}
