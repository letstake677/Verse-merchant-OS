import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import { getLiveCryptoPrices, calculateTokenAmount } from "@/lib/payments/prices"
import { getAuthenticatedSession } from "@/lib/auth/session"
import { toChecksumAddress } from "@/lib/payments/config"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing invoice ID" }, { status: 400 })
    }

    const session = await getAuthenticatedSession()
    
    // Look up invoice (by ID or invoice number, authenticated or public)
    let invoice = null
    if (session) {
      invoice = await InvoiceRepository.findByIdForMerchant(id, session.merchantId)
      if (!invoice) {
        invoice = await InvoiceRepository.findByMerchantIdAndInvoiceNumber(session.merchantId, id)
      }
    }
    if (!invoice) {
      invoice = await InvoiceRepository.findById(id)
      if (!invoice) {
        invoice = await InvoiceRepository.findByInvoiceNumber(id)
      }
    }

    if (!invoice) {
      return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 })
    }

    const body = await req.json().catch(() => ({}))
    const { txHash, token, chainId, payerAddress, recipientAddress } = body

    const numericTotal = parseFloat(invoice.total || "0")
    const prices = await getLiveCryptoPrices()
    const calc = calculateTokenAmount(numericTotal, invoice.currency || "USD", token?.symbol || "USDC", prices)

    const finalRecipient = recipientAddress || invoice.paymentAddress || ""

    // Save payment securely to MongoDB
    const payment = await PaymentRepository.createPayment({
      merchantId: invoice.merchantId,
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
      payerAddress: payerAddress ? toChecksumAddress(payerAddress) : "0x0000000000000000000000000000000000000000",
      recipientAddress: finalRecipient ? toChecksumAddress(finalRecipient) : "",
      transactionHash: txHash || `0x${Math.random().toString(16).substring(2)}`
    })
    
    // Mark invoice as paid
    const updatedInvoice = await InvoiceRepository.markInvoicePaid(
      invoice.id, 
      invoice.merchantId, 
      payment.id
    )

    return NextResponse.json({
      ok: true,
      isPaid: true,
      payment,
      invoice: updatedInvoice || { ...invoice, status: "paid", paymentId: payment.id },
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
