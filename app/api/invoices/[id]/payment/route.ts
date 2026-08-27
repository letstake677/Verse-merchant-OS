import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import { getLiveCryptoPrices, calculateTokenAmount } from "@/lib/payments/prices"
import { getAuthenticatedSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    let invoice = await InvoiceRepository.findByIdForMerchant(id, session.merchantId)
    if (!invoice) {
      invoice = await InvoiceRepository.findByMerchantIdAndInvoiceNumber(session.merchantId, id)
    }

    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 })
    }

    const body = await req.json()
    const { txHash, token, chainId, payerAddress, recipientAddress } = body

    const numericTotal = parseFloat(invoice.total || "0")
    const prices = await getLiveCryptoPrices()
    const calc = calculateTokenAmount(numericTotal, invoice.currency || "USD", token?.symbol || "USDC", prices)

    // Save payment securely to MongoDB
    const payment = await PaymentRepository.createPayment({
      merchantId: session.merchantId,
      invoiceId: invoice.id,
      status: "confirmed",
      chainId: chainId || 137,
      token: {
        symbol: token?.symbol || "USDC",
        address: token?.address || "0x0000000000000000000000000000000000000000",
        decimals: token?.decimals || 18,
        isNative: token?.isNative ?? false,
      },
      amount: calc.tokenAmount,
      currency: invoice.currency,
      payerAddress: payerAddress || "0x0000000000000000000000000000000000000000",
      recipientAddress: recipientAddress || invoice.paymentAddress,
      transactionHash: txHash || `0x${Math.random().toString(16).substring(2)}`
    })
    
    // Mark invoice as paid
    const updatedInvoice = await InvoiceRepository.markInvoicePaid(
      invoice.id, 
      session.merchantId, 
      payment.id
    )

    if (!updatedInvoice) {
      return NextResponse.json({ ok: false, error: "Could not update invoice status" }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      payment,
      invoice: updatedInvoice,
      conversion: {
        rate: calc.rate,
        formattedRate: calc.formattedRate,
      },
    })
  } catch (err) {
    console.error("POST /api/invoices/[id]/payment error:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
