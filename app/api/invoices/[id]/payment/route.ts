import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db/mongodb"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import {
  resolvePaymentToken,
  isSettlementChainSupported,
  PRIMARY_SETTLEMENT_CHAIN_ID,
} from "@/lib/payments/config"
import { getLiveCryptoPrices, calculateTokenAmount } from "@/lib/payments/prices"
import { checkRateLimit, createRateLimitResponse } from "@/lib/auth/rate-limiter"
import { AppLogger } from "@/lib/observability/logger"

function sanitizePublicInvoice(invoice: any, businessName?: string) {
  if (!invoice) return null
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    status: invoice.status,
    issueDate: invoice.issueDate || invoice.createdAt,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    taxRate: invoice.taxRate,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    items: invoice.items || [],
    notes: invoice.notes,
    terms: invoice.terms,
    businessName: businessName || "Verse Merchant",
  }
}

function sanitizePublicPayment(payment: any) {
  if (!payment) return null
  return {
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    chainId: payment.chainId,
    token: payment.token,
    recipientAddress: payment.recipientAddress,
    transactionHash: payment.transactionHash || null,
    confirmedAt: payment.confirmedAt || null,
    blockNumber: payment.blockNumber || null,
    payerAddress: payment.payerAddress || null,
    reference: payment.reference,
  }
}

/**
 * GET /api/invoices/[id]/payment
 * Public/Customer endpoint to retrieve an invoice and its current payment intent state.
 * Strictly prevents leaking merchant internal identifiers or non-public fields.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit public lookups
  const rateLimit = checkRateLimit(req, "public_checkout")
  if (rateLimit.limited) {
    return createRateLimitResponse(rateLimit.retryAfterSec)
  }

  try {
    const { id } = await params

    if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      return NextResponse.json(
        { ok: false, message: "Invoice unavailable." },
        { status: 404 }
      )
    }

    const cleanId = id.trim()
    const invoice = await InvoiceRepository.findById(cleanId)

    // Draft invoices or non-existent invoices are hidden from public lookup
    if (!invoice || invoice.status === "draft") {
      return NextResponse.json(
        { ok: false, message: "Invoice unavailable." },
        { status: 404 }
      )
    }

    // Load merchant settlement address and business display name from MongoDB
    const db = await getDb()
    let merchantWalletAddress = ""
    let merchantBusinessName = "Verse Merchant"
    try {
      if (ObjectId.isValid(invoice.merchantId)) {
        const merchantDoc = await db
          .collection("merchants")
          .findOne({ _id: new ObjectId(invoice.merchantId) })
        if (merchantDoc) {
          if (merchantDoc.walletAddress) {
            merchantWalletAddress = merchantDoc.walletAddress
          }
          if (merchantDoc.businessName) {
            merchantBusinessName = merchantDoc.businessName
          } else if (merchantDoc.name) {
            merchantBusinessName = merchantDoc.name
          }
        }
      }
    } catch (mErr) {
      AppLogger.warn("[GET /api/invoices/[id]/payment] Merchant lookup notice:", { error: mErr })
    }

    // Fetch active payment intent if one exists
    const activePayment = await PaymentRepository.findActivePaymentForInvoice(
      invoice.id,
      invoice.merchantId
    )

    return NextResponse.json({
      ok: true,
      invoice: sanitizePublicInvoice(invoice, merchantBusinessName),
      payment: sanitizePublicPayment(activePayment),
      merchantWalletAddress: merchantWalletAddress || undefined,
    })
  } catch (error) {
    AppLogger.error("[GET /api/invoices/[id]/payment] Error:", error)
    return NextResponse.json(
      { ok: false, message: "Failed to load invoice payment details." },
      { status: 500 }
    )
  }
}

/**
 * POST /api/invoices/[id]/payment
 * Authoritative endpoint to create or retrieve a payment intent for an open/overdue invoice.
 * Body: { tokenSymbol?: string, chainId?: number }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit payment intent creations
  const rateLimit = checkRateLimit(req, "payment_intent")
  if (rateLimit.limited) {
    return createRateLimitResponse(rateLimit.retryAfterSec)
  }

  try {
    const { id } = await params

    if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
      return NextResponse.json(
        { ok: false, message: "Invoice unavailable." },
        { status: 404 }
      )
    }

    const cleanId = id.trim()
    const invoice = await InvoiceRepository.findById(cleanId)

    if (!invoice || invoice.status === "draft") {
      return NextResponse.json(
        { ok: false, message: "Invoice unavailable." },
        { status: 404 }
      )
    }

    // Load merchant settlement address and business display name from MongoDB
    const db = await getDb()
    let merchantWalletAddress = ""
    let merchantBusinessName = "Verse Merchant"
    if (ObjectId.isValid(invoice.merchantId)) {
      const merchantDoc = await db
        .collection("merchants")
        .findOne({ _id: new ObjectId(invoice.merchantId) })
      if (merchantDoc) {
        if (merchantDoc.walletAddress) {
          merchantWalletAddress = merchantDoc.walletAddress
        }
        if (merchantDoc.businessName) {
          merchantBusinessName = merchantDoc.businessName
        } else if (merchantDoc.name) {
          merchantBusinessName = merchantDoc.name
        }
      }
    }

    // Check active payment intent first
    const existingActive = await PaymentRepository.findActivePaymentForInvoice(
      invoice.id,
      invoice.merchantId
    )

    // 1. Verify invoice lifecycle status
    if (invoice.status === "cancelled") {
      return NextResponse.json(
        {
          ok: false,
          isCancelled: true,
          status: "cancelled",
          message: "This invoice was cancelled and cannot accept payments.",
        },
        { status: 400 }
      )
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        {
          ok: false,
          isPaid: true,
          status: "paid",
          message: "This invoice has already been paid.",
          invoice: sanitizePublicInvoice(invoice, merchantBusinessName),
          payment: sanitizePublicPayment(existingActive),
        },
        { status: 400 }
      )
    }

    // 2. Parse request body for token and chain preferences
    let tokenSymbol = invoice.currency || "USDC"
    let chainId = PRIMARY_SETTLEMENT_CHAIN_ID

    try {
      const body = await req.json()
      if (body && typeof body.tokenSymbol === "string" && body.tokenSymbol.trim()) {
        tokenSymbol = body.tokenSymbol.trim().toUpperCase()
      }
      if (body && typeof body.chainId === "number" && isSettlementChainSupported(body.chainId)) {
        chainId = body.chainId
      }
    } catch {
      // Body optional
    }

    if (!merchantWalletAddress) {
      return NextResponse.json(
        { ok: false, message: "Merchant settlement recipient address is not configured." },
        { status: 400 }
      )
    }

    // 3. Resolve payment token registry entry
    const paymentToken = resolvePaymentToken(tokenSymbol, chainId)
    if (!paymentToken) {
      return NextResponse.json(
        { ok: false, message: "Requested payment token or settlement network is not configured." },
        { status: 400 }
      )
    }

    // Calculate exact crypto token amount using live price conversion feed
    let tokenPaymentAmount = invoice.total
    try {
      const prices = await getLiveCryptoPrices()
      const numericTotal = parseFloat(invoice.total || "0")
      if (numericTotal > 0) {
        const calc = calculateTokenAmount(numericTotal, invoice.currency || "USD", paymentToken.symbol, prices)
        if (calc && calc.tokenAmount) {
          tokenPaymentAmount = calc.tokenAmount
        }
      }
    } catch (priceErr) {
      console.warn("[payment/route] Live price calc fallback:", priceErr)
    }

    // 4. If active intent exists with identical currency and token, reuse it to avoid duplicate intents
    if (
      existingActive &&
      existingActive.status === "pending" &&
      existingActive.token.symbol === paymentToken.symbol &&
      existingActive.chainId === chainId
    ) {
      return NextResponse.json({
        ok: true,
        payment: sanitizePublicPayment(existingActive),
        invoice: sanitizePublicInvoice(invoice, merchantBusinessName),
        calculatedAmount: tokenPaymentAmount,
      })
    }

    // 5. Create new payment record atomically
    const newPayment = await PaymentRepository.createPayment({
      merchantId: invoice.merchantId,
      invoiceId: invoice.id,
      amount: tokenPaymentAmount,
      currency: invoice.currency,
      token: paymentToken,
      chainId,
      recipientAddress: merchantWalletAddress,
      reference: `INV-${invoice.invoiceNumber}`,
    })

    AppLogger.auditPayment("intent_created", {
      paymentId: newPayment.id,
      invoiceId: invoice.id,
      merchantId: invoice.merchantId,
      amount: invoice.total,
      token: paymentToken.symbol,
    })

    return NextResponse.json({
      ok: true,
      payment: sanitizePublicPayment(newPayment),
      invoice: sanitizePublicInvoice(invoice, merchantBusinessName),
    })
  } catch (error) {
    AppLogger.error("[POST /api/invoices/[id]/payment] Error:", error)
    return NextResponse.json(
      { ok: false, message: "Failed to initialize payment." },
      { status: 500 }
    )
  }
}
