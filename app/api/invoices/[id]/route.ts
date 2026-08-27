import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { getAuthenticatedSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing invoice ID" }, { status: 400 })
    }

    const session = await getAuthenticatedSession()
    let invoice = null

    if (session) {
      // First try by database ObjectId, then fallback to invoiceNumber for authenticated merchant
      invoice = await InvoiceRepository.findByIdForMerchant(id, session.merchantId)
      
      if (!invoice) {
        invoice = await InvoiceRepository.findByMerchantIdAndInvoiceNumber(session.merchantId, id)
      }
    }

    // If no session or not found in merchant scope (e.g. public customer payment checkout /pay/[id])
    if (!invoice) {
      invoice = await InvoiceRepository.findById(id)
      if (!invoice) {
        invoice = await InvoiceRepository.findByInvoiceNumber(id)
      }
    }

    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 })
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
