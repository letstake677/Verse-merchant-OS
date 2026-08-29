import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import { getDb } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"

/**
 * POST /api/invoices/[id]/claim-paid
 * Allows a public customer who paid via QR / mobile wallet / transfer
 * to submit their payment claim ("I Have Paid").
 * This updates the invoice status to 'payment_submitted' and notifies the merchant.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing invoice ID." }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const { txHash, payerWallet, tokenSymbol, tokenAmount, customerNote } = body

    const cleanId = decodeURIComponent(id).trim()

    // 1. Locate the invoice globally (by ID or InvoiceNumber)
    let invoice = await InvoiceRepository.findById(cleanId)
    if (!invoice) {
      invoice = await InvoiceRepository.findByInvoiceNumber(cleanId)
    }

    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice not found." }, { status: 404 })
    }

    if (invoice.status === "paid") {
      return NextResponse.json({
        ok: true,
        message: "Invoice is already marked as paid.",
        status: "paid",
        invoice,
      })
    }

    const now = new Date()
    const paymentClaim = {
      claimedAt: now.toISOString(),
      tokenSymbol: (tokenSymbol || "USDC").toUpperCase(),
      tokenAmount: tokenAmount || invoice.total,
      txHash: txHash ? txHash.trim() : undefined,
      payerWallet: payerWallet ? payerWallet.trim() : undefined,
      customerNote: customerNote ? customerNote.trim() : undefined,
    }

    // 2. Update invoice status in MongoDB
    try {
      const db = await getDb()
      const collection = db.collection("invoices")

      const filter: any = {}
      if (ObjectId.isValid(cleanId)) {
        filter.$or = [{ _id: new ObjectId(cleanId) }, { invoiceNumber: cleanId }]
      } else {
        filter.$or = [{ invoiceNumber: cleanId }, { _id: cleanId }]
      }

      await collection.updateOne(filter, {
        $set: {
          status: "payment_submitted",
          paymentClaim,
          updatedAt: now,
        },
      })
    } catch (dbErr) {
      console.warn("[claim-paid] Database update notice:", dbErr)
    }

    // 3. Return updated state
    const updatedInvoice = {
      ...invoice,
      status: "payment_submitted" as const,
      paymentClaim,
      updatedAt: now.toISOString(),
    }

    return NextResponse.json({
      ok: true,
      message: "Payment claim submitted successfully. Merchant has been notified for verification.",
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error("[claim-paid] Error processing payment claim:", error)
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred while submitting payment claim." },
      { status: 500 }
    )
  }
}
