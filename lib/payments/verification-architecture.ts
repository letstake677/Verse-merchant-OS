import { PaymentToken } from "@/types/payment"

/**
 * Server-Side Blockchain Verification Architecture Contract (Phase 6I)
 *
 * Defines the strict verification requirements and contracts for future
 * on-chain settlement confirmation without executing simulated or premature RPC calls.
 *
 * Future Verifier Pipeline Mandate:
 * 1. Transaction Hash Verification:
 *    - Query official JSON-RPC archive nodes on the designated chain.
 *    - Verify receipt status === 1 (Success) and not reverted.
 *
 * 2. Recipient & Merchant Verification:
 *    - Native Transfers: `to` matches merchant's authoritative payout address.
 *    - ERC-20 Transfers: `Transfer(from, to, value)` event recipient matches merchant address.
 *
 * 3. Token Contract Verification:
 *    - non-native transfers must originate from the server-configured ERC-20 contract.
 *
 * 4. Amount Verification:
 *    - Transferred value must equal or exceed invoice amount converted with token decimals.
 *
 * 5. Reorg & Finality Depth:
 *    - Current block number - transaction block number >= requiredConfirmations (12).
 *
 * 6. Non-Replay Invariant:
 *    - A transactionHash can only settle a single invoice in the entire system.
 */

export interface PaymentVerificationSpec {
  transactionHash: string
  chainId: number
  expectedRecipient: string
  expectedAmount: string
  currency: string
  token: PaymentToken
  minBlockConfirmations: number
}

export type VerificationState = "pending" | "confirmed" | "failed" | "unconfirmed" | "underpaid" | "overpaid"

export type ReconciliationOutcome =
  | "exact"
  | "underpaid"
  | "overpaid"
  | "wrong_recipient"
  | "wrong_token"
  | "wrong_chain"
  | "failed_execution"
  | "pending"

export interface PaymentVerificationResult {
  isValid: boolean
  state: VerificationState
  reconciliationOutcome: ReconciliationOutcome
  transactionHash: string
  chainId: number
  blockNumber?: number
  confirmations?: number
  payerAddress?: string
  recipientAddress?: string
  settledAmount?: string
  actualAmount?: string
  failureReason?: string
  checkedAt: string
}

/**
 * Specification interface for future RPC settlement verifiers
 */
export interface IBlockchainPaymentVerifier {
  verifyTransaction(
    spec: PaymentVerificationSpec
  ): Promise<PaymentVerificationResult>
}
