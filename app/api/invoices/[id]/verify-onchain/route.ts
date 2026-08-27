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
        const lowerRecipient = checksumRecipient.toLowerCase()

        // 1. First attempt: Blockscout / Polygonscan API for instant zero-RPC-limit lookup
        let detectedTxHash: string | null = null
        let detectedPayer: string | null = null
        let detectedBlock: number | null = null
        let detectedTokenSymbol = tokenSymbol || "USDC"

        try {
          // Polygonscan tokentx
          const psRes = await fetch(
            `https://api.polygonscan.com/api?module=account&action=tokentx&address=${checksumRecipient}&sort=desc&page=1&offset=5`,
            { signal: AbortSignal.timeout(3000) }
          )
          if (psRes.ok) {
            const psData = await psRes.json()
            if (psData && psData.status === "1" && Array.isArray(psData.result)) {
              for (const tx of psData.result) {
                if (tx.to && tx.to.toLowerCase() === lowerRecipient && tx.hash) {
                  detectedTxHash = tx.hash
                  detectedPayer = tx.from
                  detectedBlock = parseInt(tx.blockNumber, 10) || null
                  if (tx.tokenSymbol) detectedTokenSymbol = tx.tokenSymbol.toUpperCase()
                  break
                }
              }
            }
          }
        } catch {
          // Fallback to RPC log scanning
        }

        // If Polygonscan didn't find recent tokentx, check Blockscout V2
        if (!detectedTxHash) {
          try {
            const bsRes = await fetch(
              `https://polygon.blockscout.com/api/v2/addresses/${checksumRecipient}/token-transfers`,
              { signal: AbortSignal.timeout(3000) }
            )
            if (bsRes.ok) {
              const bsData = await bsRes.json()
              if (bsData && Array.isArray(bsData.items)) {
                for (const item of bsData.items) {
                  if (item.to?.hash?.toLowerCase() === lowerRecipient && item.tx_hash) {
                    detectedTxHash = item.tx_hash
                    detectedPayer = item.from?.hash
                    detectedBlock = item.block_number || null
                    if (item.token?.symbol) detectedTokenSymbol = item.token.symbol.toUpperCase()
                    break
                  }
                }
              }
            }
          } catch {
            // Continue to RPC logs
          }
        }

        // If APIs returned a txHash, confirm receipt and finish
        if (detectedTxHash) {
          txHash = detectedTxHash
        } else {
          // 2. Viem getLogs with safe 200-block range (prevents RPC block range limit errors)
          const transferEvent = parseAbiItem(
            "event Transfer(address indexed from, address indexed to, uint256 value)"
          )

          for (const rpc of POLYGON_RPCS) {
            try {
              const client = createPublicClient({
                chain: polygon,
                transport: http(process.env.POLYGON_RPC_URL || rpc, { timeout: 4000 }),
              })

              const latestBlock = await client.getBlockNumber()
              // Use safe small 200 block window (~6 minutes on Polygon) to prevent 429/range errors
              const fromBlock = latestBlock > 200n ? latestBlock - 200n : 0n

              const logs = await client.getLogs({
                event: transferEvent,
                args: {
                  to: checksumRecipient as `0x${string}`,
                },
                fromBlock,
              })

              if (logs && logs.length > 0) {
                const latestLog = logs[logs.length - 1]
                if (latestLog.transactionHash) {
                  detectedTxHash = latestLog.transactionHash
                  break
                }
              }
            } catch {
              // Try next RPC
            }
          }
        }

        // If auto-scanner identified a transaction hash
        if (detectedTxHash) {
          // Verify with Viem client
          for (const rpc of POLYGON_RPCS) {
            try {
              const client = createPublicClient({
                chain: polygon,
                transport: http(process.env.POLYGON_RPC_URL || rpc, { timeout: 5000 }),
              })

              const receipt = await client.getTransactionReceipt({
                hash: detectedTxHash as `0x${string}`,
              })

              if (receipt && receipt.status === "success") {
                const payerAddress = detectedPayer || receipt.from?.toLowerCase() || undefined
                const blockNumber = detectedBlock || Number(receipt.blockNumber)

                const paymentToken = resolvePaymentToken(detectedTokenSymbol, chainId) || {
                  symbol: detectedTokenSymbol,
                  name: detectedTokenSymbol,
                  address: "0x0000000000000000000000000000000000000000",
                  isNative: false,
                  decimals: detectedTokenSymbol === "USDC" ? 6 : 18,
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
                      transactionHash: detectedTxHash,
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
                      transactionHash: detectedTxHash,
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
                  txHash: detectedTxHash,
                  amount: invoice.total,
                  token: detectedTokenSymbol,
                })

                return NextResponse.json({
                  ok: true,
                  isPaid: true,
                  status: "paid",
                  message: "Auto-detected incoming payment on Polygon!",
                  invoice: updatedInvoice || { ...invoice, status: "paid" },
                  payment: confirmedPayment,
                  txHash: detectedTxHash,
                })
              }
            } catch {
              // Try next RPC
            }
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
