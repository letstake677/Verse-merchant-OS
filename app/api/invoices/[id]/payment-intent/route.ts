import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db/mongodb"
import { requireCurrentMerchant } from "@/lib/auth/merchant"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import {
  resolvePaymentToken,
  getDefaultPaymentTokenForInvoiceCurrency,
  POLYGON_MAINNET_CHAIN_ID,
  isSettlementChainSupported,
} from "@/lib/payments/config"

/**
 * GET /api/invoices/[id]/payment-intent
 * Retrieves active payment intent for an invoice belonging to the authenticated merchant.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchant = await requireCurrentMerchant()
    const { id } = await params

    if (!id || typeof id !== "string" || !ObjectId.isValid(id.trim())) {
      return NextResponse.json(
        { ok: false, message: "Invalid invoice ID format." },
        { status: 400 }
      )
    }

    const cleanId = id.trim()
    const invoice = await InvoiceRepository.findByIdForMerchant(cleanId, merchant.merchantId)

    if (!invoice) {
      return NextResponse.json(
        { ok: false, message: "Invoice not found or unauthorized access." },
        { status: 404 }
      )
    }

    const payment = await PaymentRepository.findPaymentByInvoiceForMerchant(
      invoice.id,
      merchant.merchantId
    )

    if (!payment) {
      return NextResponse.json({
        ok: true,
        paymentIntent: null,
        invoiceNumber: invoice.invoiceNumber,
      })
    }

    return NextResponse.json({
      ok: true,
      paymentIntent: {
        paymentId: payment.id,
        merchantId: payment.merchantId,
        invoiceId: payment.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        merchantWalletAddress: payment.recipientAddress || merchant.walletAddress,
        payerWalletAddress: payment.payerAddress || null,
        chainId: payment.chainId,
        token: payment.token,
        expectedAmount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        expiresAt: new Date(new Date(payment.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        transactionHash: payment.transactionHash || null,
        blockNumber: payment.blockNumber || null,
        confirmedAt: payment.confirmedAt || null,
      },
      invoiceNumber: invoice.invoiceNumber,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    if (errorMsg === "UNAUTHORIZED") {
      return NextResponse.json(
        { ok: false, message: "Authentication required." },
        { status: 401 }
      )
    }

    console.error("[GET /api/invoices/[id]/payment-intent] Error:", errorMsg)
    return NextResponse.json(
      { ok: false, message: "Failed to load payment intent." },
      { status: 500 }
    )
  }
}

/**
 * POST /api/invoices/[id]/payment-intent
 * Server-authoritative route to create or retrieve a payment intent for an eligible invoice.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Resolve authenticated merchant identity exclusively through SIWE session
    const merchant = await requireCurrentMerchant()
    const { id } = await params

    if (!id || typeof id !== "string" || !ObjectId.isValid(id.trim())) {
      return NextResponse.json(
        { ok: false, message: "Invalid invoice ID format." },
        { status: 400 }
      )
    }

    const cleanId = id.trim()
    const invoice = await InvoiceRepository.findByIdForMerchant(cleanId, merchant.merchantId)

    if (!invoice) {
      return NextResponse.json(
        { ok: false, message: "Invoice not found or access denied." },
        { status: 404 }
      )
    }

    // 2. Enforce strict invoice lifecycle guards
    if (invoice.status === "draft") {
      return NextResponse.json(
        { ok: false, message: "Payment intent cannot be created for draft invoices. Please finalize the invoice first." },
        { status: 400 }
      )
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { ok: false, message: "This invoice has been cancelled and cannot accept payments." },
        { status: 400 }
      )
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { ok: false, message: "This invoice has already been paid.", isPaid: true },
        { status: 400 }
      )
    }

    // 3. Read client token preferences if present
    let requestedTokenSymbol = invoice.currency || "USDC"
    let requestedChainId = POLYGON_MAINNET_CHAIN_ID

    try {
      const body = await req.json()
      if (body.tokenSymbol && typeof body.tokenSymbol === "string") {
        requestedTokenSymbol = body.tokenSymbol.trim().toUpperCase()
      }
      if (body.chainId && typeof body.chainId === "number") {
        if (isSettlementChainSupported(body.chainId)) {
          requestedChainId = body.chainId
        }
      }
    } catch {
      // Body optional
    }

    // 4. Resolve token contract / native definition from server config
    const paymentToken =
      resolvePaymentToken(requestedTokenSymbol, requestedChainId) ||
      getDefaultPaymentTokenForInvoiceCurrency(invoice.currency, requestedChainId)

    if (!paymentToken) {
      return NextResponse.json(
        { ok: false, message: "Requested payment token or settlement network is not configured." },
        { status: 400 }
      )
    }

    // 5. Authoritatively resolve merchant settlement wallet address
    let merchantWalletAddress = merchant.walletAddress
    if (!merchantWalletAddress) {
      const db = await getDb()
      if (ObjectId.isValid(merchant.merchantId)) {
        const merchantDoc = await db
          .collection("merchants")
          .findOne({ _id: new ObjectId(merchant.merchantId) })
        if (merchantDoc && merchantDoc.walletAddress) {
          merchantWalletAddress = merchantDoc.walletAddress
        }
      }
    }

    if (!merchantWalletAddress) {
      return NextResponse.json(
        { ok: false, message: "Merchant settlement wallet is not configured." },
        { status: 400 }
      )
    }

    // 6. Check for active existing payment intent
    const existingPayment = await PaymentRepository.findPaymentByInvoiceForMerchant(
      invoice.id,
      merchant.merchantId
    )

    if (existingPayment) {
      if (existingPayment.status === "confirmed") {
        return NextResponse.json(
          { ok: false, message: "This invoice has already been paid.", isPaid: true },
          { status: 400 }
        )
      }

      // Return existing active payment intent if token and chain match
      if (
        existingPayment.token.symbol === paymentToken.symbol &&
        existingPayment.chainId === requestedChainId
      ) {
        return NextResponse.json({
          ok: true,
          paymentIntent: {
            paymentId: existingPayment.id,
            merchantId: existingPayment.merchantId,
            invoiceId: existingPayment.invoiceId,
            invoiceNumber: invoice.invoiceNumber,
            merchantWalletAddress,
            payerWalletAddress: existingPayment.payerAddress || null,
            chainId: existingPayment.chainId,
            token: existingPayment.token,
            expectedAmount: existingPayment.amount,
            currency: existingPayment.currency,
            status: existingPayment.status,
            createdAt: existingPayment.createdAt,
            updatedAt: existingPayment.updatedAt,
            expiresAt: new Date(new Date(existingPayment.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
            transactionHash: existingPayment.transactionHash || null,
            blockNumber: existingPayment.blockNumber || null,
            confirmedAt: existingPayment.confirmedAt || null,
          },
          invoiceNumber: invoice.invoiceNumber,
        })
      }
    }

    // 7. Create server-authoritative payment intent record
    const createdPayment = await PaymentRepository.createPaymentIntent({
      merchantId: merchant.merchantId,
      invoiceId: invoice.id,
      status: "pending",
      chainId: requestedChainId,
      token: paymentToken,
      amount: invoice.total, // Persisted fixed-precision string
      currency: invoice.currency,
      recipientAddress: merchantWalletAddress,
      reference: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
    })

    // 8. Link paymentId to invoice
    await InvoiceRepository.linkPaymentId(
      invoice.id,
      merchant.merchantId,
      createdPayment.id
    )

    const expiresAt = new Date(new Date(createdPayment.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString()

    return NextResponse.json({
      ok: true,
      paymentIntent: {
        paymentId: createdPayment.id,
        merchantId: createdPayment.merchantId,
        invoiceId: createdPayment.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        merchantWalletAddress,
        payerWalletAddress: null,
        chainId: requestedChainId,
        token: paymentToken,
        expectedAmount: createdPayment.amount,
        currency: createdPayment.currency,
        status: createdPayment.status,
        createdAt: createdPayment.createdAt,
        updatedAt: createdPayment.updatedAt,
        expiresAt,
        transactionHash: null,
        blockNumber: null,
        confirmedAt: null,
      },
      invoiceNumber: invoice.invoiceNumber,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    if (errorMsg === "UNAUTHORIZED") {
      return NextResponse.json(
        { ok: false, message: "Authentication required." },
        { status: 401 }
      )
    }

    console.error("[POST /api/invoices/[id]/payment-intent] Error:", errorMsg)
    return NextResponse.json(
      { ok: false, message: "Failed to initialize payment intent." },
      { status: 500 }
    )
  }
}
