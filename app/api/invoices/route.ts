import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { getAuthenticatedSession } from "@/lib/auth/session"
import { InvoiceStatus } from "@/types/invoice"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || undefined
    const status = searchParams.get("status") || undefined
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)

    const [invoicesResult, summary] = await Promise.all([
      InvoiceRepository.findInvoicesWithPagination(session.merchantId, {
        search,
        status: status && status !== "all" ? (status as InvoiceStatus) : undefined,
        page,
        limit,
      }),
      InvoiceRepository.getMerchantInvoiceSummary(session.merchantId)
    ])

    return NextResponse.json({
      ok: true,
      invoices: invoicesResult.invoices,
      summary,
      pagination: invoicesResult.pagination,
    })
  } catch (err) {
    console.error("GET /api/invoices error:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // Auto-generate invoice number if missing
    let invoiceNumber = body.invoiceNumber
    if (!invoiceNumber) {
      const count = await InvoiceRepository.countByMerchantId(session.merchantId)
      const nextNum = (count + 1).toString().padStart(4, "0")
      invoiceNumber = `INV-${nextNum}`
    }

    const newInvoice = await InvoiceRepository.createInvoice({
      ...body,
      merchantId: session.merchantId,
      invoiceNumber,
    })

    return NextResponse.json({ ok: true, invoice: newInvoice }, { status: 201 })
  } catch (err) {
    console.error("POST /api/invoices error:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
