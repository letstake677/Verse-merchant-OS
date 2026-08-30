import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { getAuthenticatedSession } from "@/lib/auth/session"
import { getDb } from "@/lib/db/mongodb"
import { isValidEvmAddress, toChecksumAddress } from "@/lib/payments/config"
import { ObjectId } from "mongodb"

export const dynamic = "force-dynamic"

async function enrichInvoicePaymentAddress(invoice: any) {
  if (!invoice) return null
  const existing = toChecksumAddress(invoice.paymentAddress)
  if (existing) {
    return { ...invoice, paymentAddress: existing }
  }

  // Fallback 1: If merchantId itself is an EVM address (e.g. 0x...)
  if (invoice.merchantId && isValidEvmAddress(invoice.merchantId)) {
    return { ...invoice, paymentAddress: toChecksumAddress(invoice.merchantId) }
  }

  // Fallback 2: Query merchant profile in database
  if (invoice.merchantId) {
    try {
      const db = await getDb()
      const queryOr: any[] = [{ walletAddress: invoice.merchantId }]
      if (ObjectId.isValid(invoice.merchantId)) {
        queryOr.push({ _id: new ObjectId(invoice.merchantId) })
      } else {
        queryOr.push({ _id: invoice.merchantId })
      }
      const merchantDoc = await db.collection("merchants").findOne({ $or: queryOr })
      if (merchantDoc?.walletAddress && isValidEvmAddress(merchantDoc.walletAddress)) {
        return { ...invoice, paymentAddress: toChecksumAddress(merchantDoc.walletAddress) }
      }
    } catch (e) {
      console.error("Failed to enrich invoice merchant wallet:", e)
    }
  }

  return invoice
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing invoice ID" }, { status: 400 })
    }

    const cleanId = decodeURIComponent(id).trim()
    let invoice = null

    // 1. Direct universal lookup (supports both ObjectId, string ID, and invoiceNumber)
    invoice = await InvoiceRepository.findById(cleanId)
    if (!invoice) {
      invoice = await InvoiceRepository.findByInvoiceNumber(cleanId)
    }

    // 2. If not found, check with authenticated session if present
    if (!invoice) {
      const session = await getAuthenticatedSession()
      if (session) {
        invoice = await InvoiceRepository.findByIdForMerchant(cleanId, session.merchantId)
        if (!invoice) {
          invoice = await InvoiceRepository.findByMerchantIdAndInvoiceNumber(session.merchantId, cleanId)
        }
      }
    }

    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 })
    }

    invoice = await enrichInvoicePaymentAddress(invoice)

    // Query payment records in MongoDB associated specifically with this invoice
    try {
      const db = await getDb()

      const paymentOrClauses: any[] = [
        { invoiceId: invoice.id },
      ]

      if (invoice.merchantId && invoice.invoiceNumber) {
        paymentOrClauses.push({
          invoiceNumber: invoice.invoiceNumber,
          merchantId: invoice.merchantId,
        })
        if (invoice.invoiceNumber) {
          paymentOrClauses.push({
            reference: invoice.invoiceNumber,
            merchantId: invoice.merchantId,
          })
          paymentOrClauses.push({
            reference: `INV-${invoice.invoiceNumber.replace(/^INV-/i, "")}`,
            merchantId: invoice.merchantId,
          })
          paymentOrClauses.push({
            invoiceId: invoice.invoiceNumber,
            merchantId: invoice.merchantId,
          })
        }
      }

      const payments = await db
        .collection("payments")
        .find({ $or: paymentOrClauses })
        .sort({ createdAt: -1 })
        .toArray()

      if (payments && payments.length > 0) {
        const mappedPayments = payments.map((p) => ({
          id: p._id.toString(),
          amount: p.amount,
          currency: p.currency,
          token: p.token,
          txHash: p.transactionHash,
          status: p.status,
          createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
        }))
        ;(invoice as any).payments = mappedPayments

        const hasConfirmedPayment = payments.some(
          (p) => (p.status === "confirmed" || p.status === "paid") && !!p.transactionHash
        )
        if (hasConfirmedPayment && invoice.status !== "paid") {
          invoice.status = "paid"
          invoice.paidAt = payments[0].createdAt instanceof Date ? payments[0].createdAt.toISOString() : new Date().toISOString()
          invoice.paymentId = payments[0].transactionHash || payments[0]._id.toString()
          await InvoiceRepository.markInvoicePaid(
            invoice.id,
            invoice.merchantId,
            invoice.paymentId,
            payments[0].createdAt instanceof Date ? payments[0].createdAt : new Date()
          )
        }
      }
    } catch (paymentQueryErr) {
      console.warn("Could not attach payments to invoice:", paymentQueryErr)
    }

    return NextResponse.json({ ok: true, invoice })
  } catch (err) {
    console.error("GET /api/invoices/[id] error:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    
    const updated = await InvoiceRepository.updateInvoiceForMerchant(id, session.merchantId, body)

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Invoice not found or could not be updated" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, invoice: updated })
  } catch (err) {
    console.error("PATCH /api/invoices/[id] error:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
