import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { getAuthenticatedSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    // First try by database ObjectId, then fallback to invoiceNumber
    let invoice = await InvoiceRepository.findByIdForMerchant(session.merchantId, id)
    
    if (!invoice) {
      invoice = await InvoiceRepository.findByMerchantIdAndInvoiceNumber(session.merchantId, id)
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
    
    const updated = await InvoiceRepository.updateInvoiceForMerchant(session.merchantId, id, body)

    if (!updated) {
      return NextResponse.json({ ok: false, error: "Invoice not found or could not be updated" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, invoice: updated })
  } catch (err) {
    console.error("PATCH /api/invoices/[id] error:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
