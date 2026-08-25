import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, http, parseAbiItem, decodeEventLog } from "viem"
import { polygon, polygonAmoy } from "viem/chains"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db/mongodb"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import {
  POLYGON_MAINNET_CHAIN_ID,
  POLYGON_AMOY_CHAIN_ID,
  resolvePaymentToken,
} from "@/lib/payments/config"
import { AppLogger } from "@/lib/observability/logger"

export const dynamic = "force-dynamic"

const POLYGON_RPCS = [
  "https://polygon-rpc.com",
  "https://rpc.ankr.com/polygon",
  "https://1rpc.io/matic",
  "https://polygon.llamarpc.com",
]

function getViemClient(chainId: number) {
  if (chainId === POLYGON_AMOY_CHAIN_ID) {
    return createPublicClient({
      chain: polygonAmoy,
      transport: http("https://rpc-amoy.polygon.technology"),
    })
  }

  // Fallback round-robin or primary Polygon RPC
  return createPublicClient({
    chain: polygon,
    transport: http(POLYGON_RPCS[0]),
  })
}

/**
 * POST /api/invoices/[id]/verify-onchain
 *
 * Verifies an on-chain transaction hash for an invoice on Polygon PoS (or Amoy),
 * updates database status to 'paid', logs payment records, and returns updated invoice.
 *
 * Body: { transactionHash?: string, chainId?: number, tokenSymbol?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || typeof id !== "string" || !ObjectId.isValid(id.trim())) {
      return NextResponse.json(
        { ok: false, message: "Invalid invoice identifier." },
        { status: 400 }
      )
    }

    const cleanId = id.trim()
    const invoice = await InvoiceRepository.findById(cleanId)

    if (!invoice) {
      return NextResponse.json(
        { ok: false, message: "Invoice not found." },
        { status: 404 }
      )
    }

    // If invoice is already paid, return success immediately
    if (invoice.status === "paid") {
      const activePayment = await PaymentRepository.findActivePaymentForInvoice(
        invoice.id,
        invoice.merchantId
      )
      return NextResponse.json({
        ok: true,
        isPaid: true,
        status: "paid",
        message: "Invoice is already marked as paid.",
        invoice,
        payment: activePayment,
      })
    }

    // Parse request body
    let txHash = ""
    let chainId = POLYGON_MAINNET_CHAIN_ID
    let tokenSymbol = "USDC"

    try {
      const body = await req.json()
      if (body && typeof body.transactionHash === "string") {
        txHash = body.transactionHash.trim()
      }
      if (body && typeof body.chainId === "number") {
        chainId = body.chainId
      }
      if (body && typeof body.tokenSymbol === "string") {
        tokenSymbol = body.tokenSymbol.trim().toUpperCase()
      }
    } catch {
      // Body is optional
    }

    // Retrieve merchant settlement wallet address
    const db = await getDb()
    let merchantWalletAddress = ""
    if (ObjectId.isValid(invoice.merchantId)) {
      const merchantDoc = await db
        .collection("merchants")
        .findOne({ _id: new ObjectId(invoice.merchantId) })
      if (merchantDoc?.walletAddress) {
        merchantWalletAddress = merchantDoc.walletAddress.toLowerCase()
      }
    }

    // Case 1: Transaction Hash provided -> Verify on-chain with Viem
    if (txHash && /^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
      const client = getViemClient(chainId)

      try {
        const receipt = await client.getTransactionReceipt({
          hash: txHash as `0x${string}`,
        })

        if (!receipt) {
          return NextResponse.json(
            { ok: false, message: "Transaction receipt not found on Polygon. It may still be pending." },
            { status: 400 }
          )
        }

        if (receipt.status !== "success") {
          return NextResponse.json(
            { ok: false, message: "On-chain transaction execution failed or reverted." },
            { status: 400 }
          )
        }

        const payerAddress = receipt.from?.toLowerCase() || null
        const blockNumber = Number(receipt.blockNumber)
        const paymentToken = resolvePaymentToken(tokenSymbol, chainId) || {
          symbol: tokenSymbol,
          name: tokenSymbol,
          isNative: tokenSymbol === "POL",
          decimals: tokenSymbol === "USDC" ? 6 : 18,
          chainId,
        }

        // 1. Mark Invoice as PAID in Database
        const updatedInvoice = await InvoiceRepository.updateInvoice(
          invoice.id,
          invoice.merchantId,
          {
            status: "paid",
          }
        )

        // 2. Record or Confirm Payment Record
        const existingPayment = await PaymentRepository.findActivePaymentForInvoice(
          invoice.id,
          invoice.merchantId
        )

        let confirmedPayment
        if (existingPayment) {
          confirmedPayment = await PaymentRepository.updatePaymentStatus(
            existingPayment.id,
            invoice.merchantId,
            {
              status: "confirmed",
              transactionHash: txHash,
              blockNumber,
              payerAddress: payerAddress || undefined,
            }
          )
        } else {
          const newPayment = await PaymentRepository.createPayment({
            merchantId: invoice.merchantId,
            invoiceId: invoice.id,
            amount: invoice.total,
            currency: invoice.currency,
            token: paymentToken,
            chainId,
            recipientAddress: merchantWalletAddress || receipt.to || "",
            reference: `INV-${invoice.invoiceNumber}`,
          })

          confirmedPayment = await PaymentRepository.updatePaymentStatus(
            newPayment.id,
            invoice.merchantId,
            {
              status: "confirmed",
              transactionHash: txHash,
              blockNumber,
              payerAddress: payerAddress || undefined,
            }
          )
        }

        AppLogger.auditPayment("onchain_confirmed", {
          invoiceId: invoice.id,
          merchantId: invoice.merchantId,
          txHash,
          amount: invoice.total,
          token: tokenSymbol,
        })

        return NextResponse.json({
          ok: true,
          isPaid: true,
          status: "paid",
          message: "Transaction verified successfully on Polygon blockchain!",
          invoice: updatedInvoice || invoice,
          payment: confirmedPayment,
          txHash,
        })
      } catch (rpcErr) {
        console.error("[verify-onchain] RPC receipt error:", rpcErr)
        return NextResponse.json(
          {
            ok: false,
            message:
              "Unable to verify transaction on Polygon RPC yet. Please ensure the transaction is mined.",
          },
          { status: 400 }
        )
      }
    }

    // Case 2: No txHash provided (Status Check / Polling)
    return NextResponse.json({
      ok: true,
      isPaid: invoice.status === "paid",
      status: invoice.status,
      invoice,
    })
  } catch (error) {
    console.error("[POST /api/invoices/[id]/verify-onchain] Error:", error)
    return NextResponse.json(
      { ok: false, message: "Internal verification error." },
      { status: 500 }
    )
  }
}
