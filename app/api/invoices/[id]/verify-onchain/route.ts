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
    if (!merchantWalletAddress || merchantWalletAddress === "0x0000000000000000000000000000000000000000") {
      merchantWalletAddress = MERCHANT_RECEIVING_ADDRESS
    }

    // Case 1: Explicit Transaction Hash provided -> Verify on-chain with Viem
    if (txHash && /^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
      let receipt: any = null

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

    // Case 2: No txHash provided -> Automated Multi-Indexer On-Chain Scan
    if (merchantWalletAddress && merchantWalletAddress.startsWith("0x") && merchantWalletAddress.length === 42) {
      try {
        const checksumRecipient = toChecksumAddress(merchantWalletAddress)
        const lowerRecipient = checksumRecipient.toLowerCase()

        let detectedTxHash: string | null = null
        let detectedPayer: string | null = null
        let detectedBlock: number | null = null
        let detectedTokenSymbol = tokenSymbol || "USDC"

        // 1. Blockscout V2 API - Token Transfers
        try {
          const bsRes = await fetch(
            `https://polygon.blockscout.com/api/v2/addresses/${checksumRecipient}/token-transfers`,
            { signal: AbortSignal.timeout(3500) }
          )
          if (bsRes.ok) {
            const bsData = await bsRes.json()
            const items = Array.isArray(bsData?.items) ? bsData.items : []
            for (const item of items) {
              const toHash = (item.to?.hash || item.to || item.to_address_hash || "").toString().toLowerCase()
              const hash = item.tx_hash || item.transaction_hash || item.hash
              if (toHash === lowerRecipient && hash) {
                detectedTxHash = hash
                detectedPayer = item.from?.hash || item.from
                detectedBlock = item.block_number || null
                if (item.token?.symbol) detectedTokenSymbol = item.token.symbol.toUpperCase()
                break
              }
            }
          }
        } catch {
          // Fallback to next source
        }

        // 2. Blockscout V2 API - Native POL/MATIC Transactions
        if (!detectedTxHash) {
          try {
            const bsTxRes = await fetch(
              `https://polygon.blockscout.com/api/v2/addresses/${checksumRecipient}/transactions`,
              { signal: AbortSignal.timeout(3500) }
            )
            if (bsTxRes.ok) {
              const bsTxData = await bsTxRes.json()
              const items = Array.isArray(bsTxData?.items) ? bsTxData.items : []
              for (const item of items) {
                const toHash = (item.to?.hash || item.to || "").toString().toLowerCase()
                const hash = item.hash || item.tx_hash
                if (toHash === lowerRecipient && hash && item.value && item.value !== "0") {
                  detectedTxHash = hash
                  detectedPayer = item.from?.hash || item.from
                  detectedBlock = item.block_number || null
                  detectedTokenSymbol = "POL"
                  break
                }
              }
            }
          } catch {
            // Fallback to next source
          }
        }

        // 3. Polygonscan Public API (Tokentx + TxList)
        if (!detectedTxHash) {
          try {
            const psRes = await fetch(
              `https://api.polygonscan.com/api?module=account&action=tokentx&address=${checksumRecipient}&sort=desc&page=1&offset=10`,
              { signal: AbortSignal.timeout(3500) }
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
            // Fallback to next source
          }
        }

        // 4. Viem RPC getLogs with Indexed Token Contracts Filter
        if (!detectedTxHash) {
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
              const fromBlock = latestBlock > 2000n ? latestBlock - 2000n : 0n

              const logs = await client.getLogs({
                address: [...KNOWN_TOKEN_CONTRACTS] as `0x${string}`[],
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

        // 5. If auto-scanner identified a transaction hash, verify and mark paid
        if (detectedTxHash) {
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
