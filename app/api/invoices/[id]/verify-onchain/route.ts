import { NextRequest, NextResponse } from "next/server"
import { createPublicClient, http, parseAbiItem, decodeEventLog } from "viem"
import { polygon } from "viem/chains"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db/mongodb"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import {
  POLYGON_MAINNET_CHAIN_ID,
  resolvePaymentToken,
  toChecksumAddress,
} from "@/lib/payments/config"
import { AppLogger } from "@/lib/observability/logger"

export const dynamic = "force-dynamic"

const POLYGON_RPCS = [
  "https://polygon-rpc.com",
  "https://rpc.ankr.com/polygon",
  "https://1rpc.io/matic",
  "https://polygon.llamarpc.com",
]

function getViemClient(_chainId?: number) {
  // Primary Polygon Mainnet RPC client
  return createPublicClient({
    chain: polygon,
    transport: http(process.env.POLYGON_RPC_URL || POLYGON_RPCS[0]),
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
    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, message: "Invalid invoice identifier." },
        { status: 400 }
      )
    }

    const cleanId = decodeURIComponent(id).trim()
    let invoice = await InvoiceRepository.findById(cleanId)
    if (!invoice) {
      invoice = await InvoiceRepository.findByInvoiceNumber(cleanId)
    }

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
      } else if (body && typeof body.txHash === "string") {
        txHash = body.txHash.trim()
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
    let merchantWalletAddress = invoice.paymentAddress || ""
    if (!merchantWalletAddress && ObjectId.isValid(invoice.merchantId)) {
      const merchantDoc = await db
        .collection("merchants")
        .findOne({ _id: new ObjectId(invoice.merchantId) })
      if (merchantDoc?.walletAddress) {
        merchantWalletAddress = merchantDoc.walletAddress.toLowerCase()
      }
    }

    // Case 1: Transaction Hash provided -> Verify on-chain with Viem
    if (txHash && /^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
      let receipt: any = null
      let lastError: any = null

      for (const rpc of POLYGON_RPCS) {
        try {
          const client = createPublicClient({
            chain: polygon,
            transport: http(process.env.POLYGON_RPC_URL || rpc, { timeout: 8000 }),
          })
          receipt = await client.getTransactionReceipt({
            hash: txHash as `0x${string}`,
          })
          if (receipt) break
        } catch (e) {
          lastError = e
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

      const payerAddress = receipt.from?.toLowerCase() || null
      const blockNumber = Number(receipt.blockNumber)
      const paymentToken = resolvePaymentToken(tokenSymbol, chainId) || {
        symbol: tokenSymbol,
        name: tokenSymbol,
        address: "0x0000000000000000000000000000000000000000",
        isNative: tokenSymbol === "POL",
        decimals: tokenSymbol === "USDC" ? 6 : 18,
        chainId,
        color: "purple",
      }

      // Record or Confirm Payment Record
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

      // 1. Mark Invoice as PAID in Database
      const updatedInvoice = await InvoiceRepository.markInvoicePaid(
        invoice.id,
        invoice.merchantId,
        confirmedPayment?.id
      )

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

    // Case 2: No txHash provided (Automated On-Chain Blockchain Log Scanning)
    if (merchantWalletAddress && merchantWalletAddress.startsWith("0x") && merchantWalletAddress.length === 42) {
      try {
        const checksumRecipient = toChecksumAddress(merchantWalletAddress)
        const transferEvent = parseAbiItem(
          "event Transfer(address indexed from, address indexed to, uint256 value)"
        )

        for (const rpc of POLYGON_RPCS) {
          try {
            const client = createPublicClient({
              chain: polygon,
              transport: http(process.env.POLYGON_RPC_URL || rpc, { timeout: 6000 }),
            })

            const latestBlock = await client.getBlockNumber()
            const fromBlock = latestBlock > 2000n ? latestBlock - 2000n : 0n

            const logs = await client.getLogs({
              event: transferEvent,
              args: {
                to: checksumRecipient as `0x${string}`,
              },
              fromBlock,
            })

            if (logs && logs.length > 0) {
              const sortedLogs = [...logs].reverse()

              for (const log of sortedLogs) {
                if (log.transactionHash) {
                  const receipt = await client.getTransactionReceipt({ hash: log.transactionHash })
                  if (receipt && receipt.status === "success") {
                    const payerAddress = receipt.from?.toLowerCase() || undefined
                    const blockNumber = Number(receipt.blockNumber)

                    let detectedSymbol = "USDC"
                    const tokenContract = log.address.toLowerCase()
                    if (tokenContract === "0xc708d6f2153933daa50b2d0758955be0a93a8fec") {
                      detectedSymbol = "VERSE"
                    } else if (tokenContract === "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359") {
                      detectedSymbol = "USDC"
                    }

                    const paymentToken = resolvePaymentToken(detectedSymbol, chainId) || {
                      symbol: detectedSymbol,
                      name: detectedSymbol,
                      address: log.address,
                      isNative: false,
                      decimals: detectedSymbol === "USDC" ? 6 : 18,
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
                          transactionHash: log.transactionHash,
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
                          transactionHash: log.transactionHash,
                          blockNumber,
                          payerAddress,
                        }
                      )
                    }

                    const updatedInvoice = await InvoiceRepository.markInvoicePaid(
                      invoice.id,
                      invoice.merchantId,
                      confirmedPayment?.id
                    )

                    AppLogger.auditPayment("onchain_autoscan_confirmed", {
                      invoiceId: invoice.id,
                      merchantId: invoice.merchantId,
                      txHash: log.transactionHash,
                      amount: invoice.total,
                      token: detectedSymbol,
                    })

                    return NextResponse.json({
                      ok: true,
                      isPaid: true,
                      status: "paid",
                      message: "Auto-detected incoming payment on Polygon!",
                      invoice: updatedInvoice || { ...invoice, status: "paid" },
                      payment: confirmedPayment,
                      txHash: log.transactionHash,
                    })
                  }
                }
              }
            }
            break
          } catch {
            // Try next RPC
          }
        }
      } catch (scanErr) {
        console.error("[verify-onchain] Auto-scan error:", scanErr)
      }
    }

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
