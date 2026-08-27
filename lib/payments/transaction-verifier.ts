import { createPublicClient, http, parseEventLogs, erc20Abi, parseUnits, formatUnits, type Chain } from "viem"
import { PaymentVerificationSpec, PaymentVerificationResult, ReconciliationOutcome } from "./verification-architecture"
import { PAYMENT_CONFIRMATION_POLICY, POLYGON_MAINNET_CHAIN_ID, toChecksumAddress } from "./config"

const polygonChain: Chain = {
  id: POLYGON_MAINNET_CHAIN_ID,
  name: "Polygon",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
}

/**
 * Server-Side Polygon Blockchain Payment Verifier
 *
 * Authoritatively verifies on-chain transactions against Polygon Mainnet RPC.
 *
 * Security Invariants:
 * 1. Checks transaction receipt status === "success" (EVM status 1).
 * 2. Checks transaction block height and required block confirmation depth.
 * 3. Checks exact recipient match against merchant's settlement address.
 * 4. Checks exact decimal-safe base unit transfers (BigInt) for native POL and ERC-20 tokens.
 * 5. Decodes ERC-20 `Transfer(address,address,uint256)` event logs to prevent log spoofing.
 * 6. Fails closed if RPC is unreachable or transaction parameters do not match spec.
 */

// Centralized RPC resolution for Polygon Mainnet
function getRpcUrl(_chainId?: number): string {
  return (
    process.env.POLYGON_RPC_URL?.trim() ||
    process.env.POLYGON_MAINNET_RPC_URL?.trim() ||
    "https://polygon-rpc.com"
  )
}

function getViemChain(_chainId?: number) {
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

    // 2. Resolve RPC URL and create viem public client
    const rpcUrl = getRpcUrl(spec.chainId)
    const chain = getViemChain(spec.chainId)

    try {
      const publicClient = createPublicClient({
        chain,
        transport: http(rpcUrl, {
          timeout: 10_000,
          retryCount: 2,
        }),
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

        if (actualContract !== expectedTokenContract) {
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
                log.address.toLowerCase() === expectedTokenContract &&
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
