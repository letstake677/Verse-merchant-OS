import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { toChecksumAddress } from "@/lib/payments/config"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || (!body.id && !body.invoiceNumber)) {
      return NextResponse.json({ ok: false, error: "Invalid invoice data" }, { status: 400 })
    }

    const targetId = body.id || body.invoiceNumber
    let existing = await InvoiceRepository.findById(targetId)
    if (!existing && body.invoiceNumber) {
      existing = await InvoiceRepository.findByInvoiceNumber(body.invoiceNumber)
    }
    if (!existing && body.id) {
      existing = await InvoiceRepository.findByInvoiceNumber(body.id)
    }

    if (existing) {
      if (body.status === "paid" || existing.status === "paid") {
        const updated = await InvoiceRepository.markInvoicePaid(
          existing.id || targetId,
          existing.merchantId,
          body.paymentId || existing.paymentId
        )
        return NextResponse.json({ ok: true, invoice: updated || { ...existing, status: "paid" } })
      }
      return NextResponse.json({ ok: true, invoice: existing })
    }

    const paymentAddress = body.paymentAddress ? toChecksumAddress(body.paymentAddress) : ""
    const created = await InvoiceRepository.createInvoice({
      ...body,
      id: body.id,
      invoiceNumber: body.invoiceNumber || body.id,
      paymentAddress,
      merchantId: body.merchantId || "shared_merchant",
      status: body.status || "pending",
      paymentId: body.paymentId,
      paidAt: body.status === "paid" ? (body.paidAt || new Date()) : undefined,
    })

    return NextResponse.json({ ok: true, invoice: created })
  } catch (err) {
    console.error("POST /api/invoices/sync error:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}
