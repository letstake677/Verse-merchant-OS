import { NextRequest, NextResponse } from "next/server"
import { getInvoiceById, saveInvoice } from "@/lib/invoices/data"
import { getLiveCryptoPrices, calculateTokenAmount } from "@/lib/payments/prices"
import { InvoicePayment } from "@/lib/invoices/types"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = getInvoiceById(id)
  if (!invoice) {
    return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { txHash, token, chainId, payerAddress, recipientAddress } = body

    const numericTotal = parseFloat(invoice.total || "0")
    const prices = await getLiveCryptoPrices()
    const calc = calculateTokenAmount(numericTotal, invoice.currency || "USD", token?.symbol || "USDC", prices)

    const payment: InvoicePayment = {
      id: `pay-${Date.now()}`,
      txHash: txHash || `0x${Math.random().toString(16).substring(2)}`,
      amount: calc.tokenAmount,
      cryptoAmount: `${calc.tokenAmount} ${token?.symbol || "USDC"}`,
      currency: invoice.currency,
      token: {
        symbol: token?.symbol || "USDC",
        address: token?.address || "0x0000000000000000000000000000000000000000",
        decimals: token?.decimals || 18,
        isNative: token?.isNative ?? false,
      },
      chainId: chainId || 137,
      payerAddress: payerAddress || "0x0000000000000000000000000000000000000000",
      recipientAddress: recipientAddress || invoice.paymentAddress,
      status: "confirmed",
      confirmations: 2,
      timestamp: Date.now(),
    }

    const currentPayments = invoice.payments || []
    const updatedInvoice = {
      ...invoice,
      status: "paid" as const,
      paidAt: new Date().toISOString(),
      payments: [...currentPayments, payment],
    }

    saveInvoice(updatedInvoice)

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
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
