import { NextRequest, NextResponse } from "next/server"
import { getInvoiceById, saveInvoice } from "@/lib/invoices/data"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = getInvoiceById(id)
  if (!invoice) {
    return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 })
  }
  return NextResponse.json({ ok: true, invoice })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = getInvoiceById(id)
  if (!invoice) {
    return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 })
  }

  try {
    const body = await req.json()
    const updated = { ...invoice, ...body }
    saveInvoice(updated)
    return NextResponse.json({ ok: true, invoice: updated })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
