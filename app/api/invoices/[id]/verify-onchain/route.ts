import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, http, parseAbiItem } from "viem"
import { polygon } from "viem/chains"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db/mongodb"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import {
  POLYGON_MAINNET_CHAIN_ID,
  resolvePaymentToken,
  toChecksumAddress,
  MERCHANT_RECEIVING_ADDRESS,
} from "@/lib/payments/config"
import { getResolvedPolygonRpcUrls } from "@/lib/payments/transaction-verifier"
import { AppLogger } from "@/lib/observability/logger"

export const dynamic = "force-dynamic"

const POLYGON_RPCS = [
  "https://polygon-rpc.com",
  "https://rpc.ankr.com/polygon",
  "https://1rpc.io/matic",
  "https://polygon.llamarpc.com",
]

// Known token contract addresses on Polygon Mainnet
const KNOWN_TOKEN_CONTRACTS = [
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Native USDC
  "0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc", // Verse Token
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Bridged USDC.e
] as const

/**
 * POST /api/invoices/[id]/verify-onchain
 *
 * Verifies an on-chain transaction hash for an invoice on Polygon PoS,
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
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, message: "Invalid invoice identifier." },
        { status: 400 }
      )
    }

    // Parse request body early
    let txHash = ""
    let chainId = POLYGON_MAINNET_CHAIN_ID
    let tokenSymbol = "USDC"
    let bodyData: any = null

    try {
      bodyData = await req.json()
      if (bodyData && typeof bodyData.transactionHash === "string") {
        txHash = bodyData.transactionHash.trim()
      } else if (bodyData && typeof bodyData.txHash === "string") {
        txHash = bodyData.txHash.trim()
      }
      if (bodyData && typeof bodyData.chainId === "number") {
        chainId = bodyData.chainId
      }
      if (bodyData && typeof bodyData.tokenSymbol === "string") {
        tokenSymbol = bodyData.tokenSymbol.trim().toUpperCase()
      }
    } catch {
      // Body is optional
    }

    const cleanId = decodeURIComponent(id).trim()
    let invoice = await InvoiceRepository.findById(cleanId)
    if (!invoice) {
      invoice = await InvoiceRepository.findByInvoiceNumber(cleanId)
    }

    // If invoice not found in DB, auto-create/sync if snapshot passed or cleanId provided
    if (!invoice && bodyData?.invoiceData) {
      try {
        invoice = await InvoiceRepository.createInvoice({
          ...bodyData.invoiceData,
          id: cleanId,
          invoiceNumber: bodyData.invoiceData.invoiceNumber || cleanId,
          merchantId: bodyData.invoiceData.merchantId || "shared_merchant",
          paymentAddress: bodyData.invoiceData.paymentAddress || "",
          total: bodyData.invoiceData.total || "0",
          items: bodyData.invoiceData.items || [],
        })
      } catch (err) {
        console.warn("Auto-creating invoice in verify-onchain failed:", err)
      }
    }

    if (!invoice) {
      return NextResponse.json(
        { ok: false, message: "Invoice not found." },
        { status: 404 }
      )
    }

    // Retrieve merchant settlement wallet address
    const db = await getDb()
    let merchantWalletAddress = invoice.paymentAddress || ""
    if (!merchantWalletAddress && ObjectId.isValid(invoice.merchantId)) {
      const merchantDoc = await db
        .collection("merchants")
        .findOne({ _id: new ObjectId(invoice.merchantId) })
      if (merchantDoc?.walletAddress) {
        merchantWalletAddress = merchantDoc.walletAddress.toLowerCase()
      }
    }
    if (!merchantWalletAddress || merchantWalletAddress === "0x0000000000000000000000000000000000000000") {
      merchantWalletAddress = MERCHANT_RECEIVING_ADDRESS
    }

    // Case 1: Explicit Transaction Hash provided -> Verify on-chain with Viem
    if (txHash && /^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
      // Replay Protection: ensure transaction hash was not already used for another invoice
      const globalPaymentMatch = await PaymentRepository.findByTransactionHashGlobal(txHash)
      if (globalPaymentMatch) {
        const matchesCurrentInvoice =
          globalPaymentMatch.invoiceId === invoice.id ||
          globalPaymentMatch.invoiceId === invoice.invoiceNumber ||
          globalPaymentMatch.invoiceId.replace(/^inv-?/i, "") === invoice.id.replace(/^inv-?/i, "") ||
          globalPaymentMatch.invoiceId.replace(/^inv-?/i, "") === (invoice.invoiceNumber || "").replace(/^inv-?/i, "")
        if (!matchesCurrentInvoice) {
          return NextResponse.json(
            { ok: false, message: "This transaction hash has already been used for another payment." },
            { status: 400 }
          )
        }
      }

      let receipt: any = null

      const rpcPool = getResolvedPolygonRpcUrls()
      for (const rpc of rpcPool) {
        try {
          const client = createPublicClient({
            chain: polygon,
            transport: http(rpc, { timeout: 8000 }),
          })
          receipt = await client.getTransactionReceipt({
            hash: txHash as `0x${string}`,
          })
          if (receipt) break
        } catch {
          // Try next RPC
        }
      }

      if (!receipt) {
        return NextResponse.json(
          { ok: false, message: "Transaction receipt not found on Polygon yet. It may still be pending." },
          { status: 400 }
        )
      }

      if (receipt.status !== "success") {
        return NextResponse.json(
          { ok: false, message: "On-chain transaction execution failed or reverted." },
          { status: 400 }
        )
      }

      const payerAddress = receipt.from?.toLowerCase() || undefined
      const blockNumber = Number(receipt.blockNumber)

      const paymentToken = resolvePaymentToken(tokenSymbol, chainId) || {
        symbol: tokenSymbol,
        name: tokenSymbol,
        address: "0x0000000000000000000000000000000000000000",
        isNative: false,
        decimals: tokenSymbol === "USDC" ? 6 : 18,
        chainId,
        color: "purple",
      }

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
            payerAddress,
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
          recipientAddress: merchantWalletAddress,
          reference: `INV-${invoice.invoiceNumber}`,
        })
        confirmedPayment = await PaymentRepository.updatePaymentStatus(
          newPayment.id,
          invoice.merchantId,
          {
            status: "confirmed",
            transactionHash: txHash,
            blockNumber,
            payerAddress,
          }
        )
      }

      let updatedInvoice = await InvoiceRepository.markInvoicePaid(
        invoice.id,
        invoice.merchantId,
        confirmedPayment?.id
      )
      if (!updatedInvoice && invoice.invoiceNumber) {
        updatedInvoice = await InvoiceRepository.markInvoicePaid(
          invoice.invoiceNumber,
          invoice.merchantId,
          confirmedPayment?.id
        )
      }
      if (!updatedInvoice) {
        try {
          const mongoDb = await getDb()
          await mongoDb.collection("invoices").updateMany(
            {
              $or: [
                { invoiceNumber: invoice.invoiceNumber },
                { invoiceNumber: invoice.id },
                { id: invoice.id },
                { id: invoice.invoiceNumber },
              ],
            },
            {
              $set: {
                status: "paid",
                paidAt: new Date(),
                updatedAt: new Date(),
                paymentId: confirmedPayment?.id,
              },
            }
          )
        } catch {}
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
        invoice: updatedInvoice || { ...invoice, status: "paid" },
        payment: confirmedPayment,
        txHash,
      })
    }

    // Case 2: No txHash provided -> Direct status query without auto-scanning
    const currentPayment = await PaymentRepository.findActivePaymentForInvoice(
      invoice.id,
      invoice.merchantId
    )

    return NextResponse.json({
      ok: true,
      isPaid: invoice.status === "paid",
      status: invoice.status,
      invoice,
      payment: currentPayment,
    })
  } catch (error) {
    console.error("[POST /api/invoices/[id]/verify-onchain] Error:", error)
    return NextResponse.json(
      { ok: false, message: "Internal verification error." },
      { status: 500 }
    )
  }
}
