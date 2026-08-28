import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db/mongodb"
import { getAuthenticatedSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" })
    }

    const db = await getDb()
    const payments = await db.collection("payments").find({ merchantId: session.merchantId }).toArray()
    const invoices = await db.collection("invoices").find({ merchantId: session.merchantId }).toArray()

    return NextResponse.json({
      ok: true,
      paymentsCount: payments.length,
      invoicesCount: invoices.length,
      payments: payments.map(p => ({
        id: p.id || p._id,
        amount: p.amount,
        status: p.status,
        invoiceId: p.invoiceId,
        txHash: p.txHash,
        token: p.token
      })),
      invoices: invoices.map(i => ({
        id: i.id || i._id,
        invoiceNumber: i.invoiceNumber,
        total: i.total,
        status: i.status
      }))
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message })
  }
}
