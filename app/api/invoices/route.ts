import { NextRequest, NextResponse } from "next/server"
import { getAllInvoices, saveInvoice } from "@/lib/invoices/data"
import { Invoice } from "@/lib/invoices/types"
import { MERCHANT_RECEIVING_ADDRESS } from "@/lib/payments/config"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")?.toLowerCase() || ""
  const status = searchParams.get("status") || "all"
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "20", 10)

  let allInvoices = getAllInvoices()

  // Apply search filter
  if (search) {
    allInvoices = allInvoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(search) ||
        inv.customerName.toLowerCase().includes(search) ||
        inv.customerEmail?.toLowerCase().includes(search)
    )
  }

  // Apply status filter
  if (status && status !== "all") {
    allInvoices = allInvoices.filter((inv) => inv.status === status)
  }

  // Compute summary metrics across all invoices
  const totalInvoices = allInvoices.length
  const draftCount = allInvoices.filter((inv) => inv.status === "draft").length
  
  let outstanding = 0
  let paid = 0
  for (const inv of allInvoices) {
    const val = parseFloat(inv.total) || 0
    if (inv.status === "paid") {
      paid += val
    } else {
      outstanding += val
    }
  }

  const summary = {
    totalInvoices,
    draftCount,
    outstandingAmount: `$${outstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    paidAmount: `$${paid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  }

  // Pagination
  const startIndex = (page - 1) * limit
  const paginatedInvoices = allInvoices.slice(startIndex, startIndex + limit)
  const totalPages = Math.ceil(totalInvoices / limit) || 1

  const pagination = {
    page,
    limit,
    total: totalInvoices,
    totalPages,
  }

  return NextResponse.json({
    ok: true,
    invoices: paginatedInvoices,
    summary,
    pagination,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const all = getAllInvoices()
    const nextNum = (all.length + 1).toString().padStart(4, "0")

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: body.invoiceNumber || `INV-${nextNum}`,
      customerName: body.customerName || "Customer",
      customerEmail: body.customerEmail || "",
      customerWallet: body.customerWallet || "",
      createdAt: new Date().toISOString().split("T")[0],
      dueDate: body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      currency: body.currency || "USD",
      items: body.items || [],
      subtotal: body.subtotal || "0.00",
      tax: body.tax || "0.00",
      total: body.total || "0.00",
      status: "pending",
      notes: body.notes || "",
      paymentAddress: body.paymentAddress || MERCHANT_RECEIVING_ADDRESS,
      paymentNetwork: body.paymentNetwork || "Polygon Mainnet",
      chainId: body.chainId || 137,
    }

    saveInvoice(newInvoice)
    return NextResponse.json({ ok: true, invoice: newInvoice }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
