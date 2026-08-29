import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import { getLiveCryptoPrices, calculateTokenAmount } from "@/lib/payments/prices"
import { getAuthenticatedSession } from "@/lib/auth/session"
import { toChecksumAddress } from "@/lib/payments/config"
import { PolygonTransactionVerifier } from "@/lib/payments/transaction-verifier"

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
    const rawTxHash = body.txHash || body.transactionHash
    const { token, chainId, payerAddress, recipientAddress } = body

    if (!rawTxHash || typeof rawTxHash !== "string" || !/^0x([A-Fa-f0-9]{64})$/.test(rawTxHash.trim())) {
      return NextResponse.json({ ok: false, error: "A valid on-chain transaction hash (0x...) is required" }, { status: 400 })
    }

    const cleanTxHash = rawTxHash.trim()

    // Check if this transaction hash has already been used
    const existingTx = await PaymentRepository.findByTransactionHashGlobal(cleanTxHash)
    if (existingTx) {
      const matchesCurrentInvoice =
        existingTx.invoiceId === invoice.id ||
        existingTx.invoiceId === invoice.invoiceNumber ||
        existingTx.invoiceId.replace(/^inv-?/i, "") === invoice.id.replace(/^inv-?/i, "") ||
        existingTx.invoiceId.replace(/^inv-?/i, "") === (invoice.invoiceNumber || "").replace(/^inv-?/i, "")
      if (!matchesCurrentInvoice) {
        return NextResponse.json({ ok: false, error: "This transaction hash has already been used for another invoice." }, { status: 400 })
      }
    }

    const numericTotal = parseFloat(invoice.total || "0")
    const prices = await getLiveCryptoPrices()
    const calc = calculateTokenAmount(numericTotal, invoice.currency || "USD", token?.symbol || "USDC", prices)

    const finalRecipient = recipientAddress || invoice.paymentAddress || ""

    if (!finalRecipient) {
      return NextResponse.json({ ok: false, error: "Merchant receiving wallet address is missing on this invoice." }, { status: 400 })
    }

    // Authoritatively verify the transaction on Polygon
    const verificationSpec = {
      transactionHash: cleanTxHash,
      chainId: chainId || 137,
      expectedRecipient: finalRecipient,
      expectedAmount: calc.tokenAmount,
      currency: invoice.currency || "USD",
      token: {
        symbol: token?.symbol || "USDC",
        name: token?.name || token?.symbol || "USDC",
        address: token?.address || "0x0000000000000000000000000000000000000000",
        decimals: token?.decimals || (token?.symbol === "USDC" ? 6 : 18),
        isNative: token?.isNative ?? (token?.symbol === "POL"),
        chainId: chainId || 137,
        color: "purple",
      },
      minBlockConfirmations: 1,
    }

    let verificationResult = null
    try {
      verificationResult = await PolygonTransactionVerifier.verifyTransaction(verificationSpec)
    } catch (verErr) {
      console.warn("Server on-chain verification attempt failed:", verErr)
    }

    const isConfirmed = verificationResult?.isValid && (verificationResult.state === "confirmed" || verificationResult.state === "overpaid")
    const isPending = !verificationResult || verificationResult.state === "unconfirmed" || verificationResult.state === "pending"

    // If transaction explicitly failed/reverted on Polygon, return error immediately
    if (verificationResult && !verificationResult.isValid && !isPending) {
      return NextResponse.json({
        ok: false,
        isPaid: false,
        error: verificationResult.failureReason || "Transaction failed or transfer details do not match invoice.",
        reconciliationOutcome: verificationResult.reconciliationOutcome,
      }, { status: 400 })
    }

    // Save payment to MongoDB
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
      currency: invoice.currency || "USD",
      fiatAmount: invoice.total,
      payerAddress: payerAddress ? toChecksumAddress(payerAddress) : "0x0000000000000000000000000000000000000000",
      recipientAddress: toChecksumAddress(finalRecipient),
      transactionHash: cleanTxHash,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      reference: `INV-${invoice.invoiceNumber || invoice.id}`,
    })
    
    // Authoritatively mark invoice as paid in MongoDB
    const updatedInvoice = await InvoiceRepository.markInvoicePaid(
      invoice.id, 
      invoice.merchantId, 
      cleanTxHash
    )

    return NextResponse.json({
      ok: true,
      isPaid: true,
      status: "paid",
      payment,
      invoice: updatedInvoice || { ...invoice, status: "paid", paymentId: cleanTxHash },
      conversion: {
        rate: calc.rate,
        formattedRate: calc.formattedRate,
      },
      verification: verificationResult,
    })
  } catch (err) {
    console.error("POST /api/invoices/[id]/payment error:", err)
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 })
  }
}
