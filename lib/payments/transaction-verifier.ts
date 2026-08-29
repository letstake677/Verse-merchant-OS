import { createPublicClient, http, fallback, parseEventLogs, erc20Abi, parseUnits, formatUnits, type Chain } from "viem"
import { PaymentVerificationSpec, PaymentVerificationResult, ReconciliationOutcome } from "./verification-architecture"
import { PAYMENT_CONFIRMATION_POLICY, POLYGON_MAINNET_CHAIN_ID, POLYGON_AMOY_CHAIN_ID, toChecksumAddress } from "./config"

const polygonChain: Chain = {
  id: POLYGON_MAINNET_CHAIN_ID,
  name: "Polygon",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
}

const polygonAmoyChain: Chain = {
  id: POLYGON_AMOY_CHAIN_ID,
  name: "Polygon Amoy",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-amoy.polygon.technology"] } },
}

const POLYGON_VERIFIER_RPC_POOL = [
  "https://polygon-bor-rpc.publicnode.com",
  "https://polygon.llamarpc.com",
  "https://rpc.ankr.com/polygon",
  "https://1rpc.io/matic",
  "https://polygon-mainnet.public.blastapi.io",
  "https://polygon-rpc.com",
]

const AMOY_VERIFIER_RPC_POOL = [
  "https://rpc-amoy.polygon.technology",
  "https://polygon-amoy.drpc.org",
  "https://polygon-amoy-bor-rpc.publicnode.com",
]

/**
 * Server-Side Polygon / Amoy Blockchain Payment Verifier
 */
export function getResolvedPolygonRpcUrls(chainId: number = POLYGON_MAINNET_CHAIN_ID): string[] {
  const customUrls: string[] = []

  if (chainId === POLYGON_AMOY_CHAIN_ID) {
    // 1. Amoy custom RPC environment variable
    const amoyEnv = process.env.AMOY_RPC_URL?.trim() ||
      process.env.POLYGON_AMOY_RPC_URL?.trim() ||
      process.env.ALCHEMY_AMOY_URL?.trim() ||
      process.env.NEXT_PUBLIC_AMOY_RPC_URL?.trim()

    if (amoyEnv) customUrls.push(amoyEnv)

    const alchemyKey = (process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY)?.trim()
    if (alchemyKey) {
      const constructedAmoy = `https://polygon-amoy.g.alchemy.com/v2/${alchemyKey}`
      if (!customUrls.includes(constructedAmoy)) customUrls.push(constructedAmoy)
    }

    return [...customUrls, ...AMOY_VERIFIER_RPC_POOL]
  }

  // Polygon Mainnet
  const rpcUrl = process.env.POLYGON_RPC_URL?.trim()
  if (rpcUrl) customUrls.push(rpcUrl)

  const alchemyUrl = process.env.ALCHEMY_POLYGON_URL?.trim()
  if (alchemyUrl && !customUrls.includes(alchemyUrl)) customUrls.push(alchemyUrl)

  const alchemyKey = (process.env.ALCHEMY_API_KEY || process.env.NEXT_PUBLIC_ALCHEMY_API_KEY)?.trim()
  if (alchemyKey) {
    const constructedAlchemy = `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`
    if (!customUrls.includes(constructedAlchemy)) customUrls.push(constructedAlchemy)
  }

  const mainnetRpc = process.env.POLYGON_MAINNET_RPC_URL?.trim()
  if (mainnetRpc && !customUrls.includes(mainnetRpc)) customUrls.push(mainnetRpc)

  return [...customUrls, ...POLYGON_VERIFIER_RPC_POOL]
}

function getViemChain(chainId?: number) {
  if (chainId === POLYGON_AMOY_CHAIN_ID) return polygonAmoyChain
  return polygonChain
}

export class PolygonTransactionVerifier {
  /**
   * Authoritatively verifies an on-chain transaction against a payment specification.
   */
  static async verifyTransaction(
    spec: PaymentVerificationSpec
  ): Promise<PaymentVerificationResult> {
    const checkedAt = new Date().toISOString()
    const cleanHash = (spec.transactionHash || "").trim().toLowerCase()

    // 1. Validate hash format
    if (!cleanHash || !/^0x[0-9a-fA-F]{64}$/.test(cleanHash)) {
      return {
        isValid: false,
        state: "failed",
        reconciliationOutcome: "failed_execution",
        transactionHash: cleanHash,
        chainId: spec.chainId,
        failureReason: "Invalid transaction hash format.",
        checkedAt,
      }
    }

    // 2. Create viem public client with multi-RPC fallback
    const chain = getViemChain(spec.chainId)
    const pool = getResolvedPolygonRpcUrls()

    try {
      const publicClient = createPublicClient({
        chain,
        transport: fallback(
          pool.map((url) =>
            http(url, {
              timeout: 10_000,
              retryCount: 2,
            })
          )
        ),
      })

      // 3. Query transaction receipt and transaction body concurrently
      const [receipt, tx, currentBlock] = await Promise.all([
        publicClient.getTransactionReceipt({ hash: cleanHash as `0x${string}` }).catch(() => null),
        publicClient.getTransaction({ hash: cleanHash as `0x${string}` }).catch(() => null),
        publicClient.getBlockNumber().catch(() => null),
      ])

      // 4. Handle pending/unincluded transaction
      if (!receipt || !tx) {
        return {
          isValid: false,
          state: "unconfirmed",
          reconciliationOutcome: "pending",
          transactionHash: cleanHash,
          chainId: spec.chainId,
          failureReason: "Transaction not found on chain yet or pending inclusion.",
          checkedAt,
        }
      }

      // 5. Handle reverted transaction execution
      if (receipt.status !== "success") {
        return {
          isValid: false,
          state: "failed",
          reconciliationOutcome: "failed_execution",
          transactionHash: cleanHash,
          chainId: spec.chainId,
          blockNumber: Number(receipt.blockNumber),
          failureReason: "On-chain transaction execution failed or reverted.",
          checkedAt,
        }
      }

      // 6. Calculate confirmation depth
      const txBlock = receipt.blockNumber
      const confirmations =
        currentBlock && currentBlock >= txBlock
          ? Number(currentBlock - txBlock + BigInt(1))
          : 1

      const minConfirmations =
        spec.minBlockConfirmations || PAYMENT_CONFIRMATION_POLICY.requiredConfirmations

      // 7. Validate payment transfer details
      const expectedRecipient = spec.expectedRecipient.toLowerCase().trim()
      let payerAddress: string = tx.from.toLowerCase()
      let isTransferValid = false
      let mismatchReason: string | undefined

      // Decimal-safe BigInt conversion
      let expectedUnits: bigint
      try {
        expectedUnits = parseUnits(spec.expectedAmount, spec.token.decimals)
      } catch (err) {
        console.error("[PolygonTransactionVerifier] Error parsing units:", err)
        return {
          isValid: false,
          state: "failed",
          reconciliationOutcome: "failed_execution",
          transactionHash: cleanHash,
          chainId: spec.chainId,
          failureReason: "Invalid invoice amount format for token decimals.",
          checkedAt,
        }
      }

      let transferredUnits: bigint = BigInt(0)

      if (spec.token.isNative) {
        // Native POL payment checks
        const actualRecipient = (tx.to || "").toLowerCase()
        if (actualRecipient !== expectedRecipient) {
          mismatchReason = `Recipient mismatch: expected ${expectedRecipient}, received ${actualRecipient}`
        } else {
          transferredUnits = tx.value
          isTransferValid = true
        }
      } else {
        // ERC-20 payment checks (USDC, VERSE)
        const expectedTokenContract = (spec.token.address || "").toLowerCase()
        const actualContract = (tx.to || "").toLowerCase()
        
        const isUsdcVariant =
          spec.token.symbol.toUpperCase() === "USDC" &&
          (actualContract === "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" ||
           actualContract === "0x2791bca1f2de4661ed88a30c99a7a9449aa84174")

        if (actualContract !== expectedTokenContract && !isUsdcVariant) {
          mismatchReason = `Token contract mismatch: expected ${expectedTokenContract}, called ${actualContract}`
        } else {
          // Inspect Transfer logs
          try {
            const transferLogs = parseEventLogs({
              abi: erc20Abi,
              logs: receipt.logs,
              eventName: "Transfer",
            })

            const matchingLog = transferLogs.find(
              (log) =>
                (log.address.toLowerCase() === expectedTokenContract ||
                 (isUsdcVariant && (log.address.toLowerCase() === "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359" || log.address.toLowerCase() === "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"))) &&
                log.args.to.toLowerCase() === expectedRecipient
            )

            if (!matchingLog) {
              mismatchReason = `No matching ERC-20 Transfer log found to merchant recipient ${expectedRecipient}`
            } else {
              payerAddress = matchingLog.args.from.toLowerCase()
              transferredUnits = matchingLog.args.value
              isTransferValid = true
            }
          } catch (logErr) {
            console.error("[PolygonTransactionVerifier] Log parsing error:", logErr)
            mismatchReason = "Failed to parse ERC-20 event logs from transaction receipt."
          }
        }
      }

      if (!isTransferValid) {
        const failureOutcome: ReconciliationOutcome = mismatchReason?.includes("Recipient")
          ? "wrong_recipient"
          : mismatchReason?.includes("Token")
          ? "wrong_token"
          : "failed_execution"

        return {
          isValid: false,
          state: "failed",
          reconciliationOutcome: failureOutcome,
          transactionHash: cleanHash,
          chainId: spec.chainId,
          blockNumber: Number(txBlock),
          confirmations,
          payerAddress,
          recipientAddress: expectedRecipient,
          failureReason: mismatchReason || "Transfer details do not match payment specification.",
          checkedAt,
        }
      }

      const formattedTransferred = formatUnits(transferredUnits, spec.token.decimals)

      // Check block confirmation depth
      if (confirmations < minConfirmations) {
        return {
          isValid: false,
          state: "unconfirmed",
          reconciliationOutcome: "pending",
          transactionHash: cleanHash,
          chainId: spec.chainId,
          blockNumber: Number(txBlock),
          confirmations,
          payerAddress,
          recipientAddress: expectedRecipient,
          settledAmount: formattedTransferred,
          actualAmount: formattedTransferred,
          failureReason: `Awaiting block confirmations (${confirmations}/${minConfirmations}).`,
          checkedAt,
        }
      }

      // Check exact vs underpayment vs overpayment
      if (transferredUnits < expectedUnits) {
        return {
          isValid: false,
          state: "underpaid",
          reconciliationOutcome: "underpaid",
          transactionHash: cleanHash,
          chainId: spec.chainId,
          blockNumber: Number(txBlock),
          confirmations,
          payerAddress,
          recipientAddress: expectedRecipient,
          settledAmount: formattedTransferred,
          actualAmount: formattedTransferred,
          failureReason: `Underpayment: expected ${spec.expectedAmount} ${spec.token.symbol}, transferred ${formattedTransferred} ${spec.token.symbol}.`,
          checkedAt,
        }
      }

      if (transferredUnits > expectedUnits) {
        return {
          isValid: true,
          state: "overpaid",
          reconciliationOutcome: "overpaid",
          transactionHash: cleanHash,
          chainId: spec.chainId,
          blockNumber: Number(txBlock),
          confirmations,
          payerAddress,
          recipientAddress: expectedRecipient,
          settledAmount: formattedTransferred,
          actualAmount: formattedTransferred,
          failureReason: `Overpayment: expected ${spec.expectedAmount} ${spec.token.symbol}, transferred ${formattedTransferred} ${spec.token.symbol}.`,
          checkedAt,
        }
      }

      // Exact match - confirmed
      return {
        isValid: true,
        state: "confirmed",
        reconciliationOutcome: "exact",
        transactionHash: cleanHash,
        chainId: spec.chainId,
        blockNumber: Number(txBlock),
        confirmations,
        payerAddress,
        recipientAddress: expectedRecipient,
        settledAmount: formattedTransferred,
        actualAmount: formattedTransferred,
        checkedAt,
      }
    } catch (rpcError) {
      const errorMsg = rpcError instanceof Error ? rpcError.message : "RPC network error"
      console.error("[PolygonTransactionVerifier] RPC Error:", errorMsg)

      return {
        isValid: false,
        state: "unconfirmed",
        reconciliationOutcome: "pending",
        transactionHash: cleanHash,
        chainId: spec.chainId,
        failureReason: `Blockchain RPC connection unavailable: ${errorMsg}`,
        checkedAt,
      }
    }
  }
}
