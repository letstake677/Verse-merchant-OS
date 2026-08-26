import { NextRequest, NextResponse } from "next/server"
import { getAllInvoices, saveInvoice } from "@/lib/invoices/data"
import { Invoice } from "@/lib/invoices/types"
import { MERCHANT_RECEIVING_ADDRESS } from "@/lib/payments/config"

export const dynamic = "force-dynamic"

export async function GET() {
  const invoices = getAllInvoices()
  return NextResponse.json({ ok: true, invoices })
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
