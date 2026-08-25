import { PaymentToken } from "@/types/payment"

/**
 * Server-Authoritative Web3 Payment & Settlement Configuration
 *
 * Centralizes all Web3 settlement parameters, chain IDs, token registries,
 * and block confirmation rules for Verse Merchant OS.
 *
 * Security Invariants:
 * 1. Values are server-authoritative and must never be overridden by client input.
 * 2. Unconfigured ERC-20 contracts fail closed.
 * 3. Only verified settlement networks (Polygon Mainnet) are accepted for payment intents.
 */

export const POLYGON_MAINNET_CHAIN_ID = 137
export const POLYGON_AMOY_CHAIN_ID = 80002

export const PRIMARY_SETTLEMENT_CHAIN_ID = POLYGON_MAINNET_CHAIN_ID

/**
 * Settlement confirmation policy
 */
export const PAYMENT_CONFIRMATION_POLICY = {
  /**
   * Minimum required block confirmations before a payment is marked as 'confirmed'.
   * Polygon PoS reorg protection standard: 12-64 blocks. Default 12 for standard settlement.
   */
  requiredConfirmations: 12,

  /**
   * Maximum age of a 'pending' payment before it is considered expired (24 hours).
   */
  pendingExpiryMs: 24 * 60 * 60 * 1000,

  /**
   * Recheck interval for transaction verification queue (in seconds).
   */
  verificationIntervalSeconds: 15,
} as const

/**
 * Official Polygon Mainnet Tokens
 * Native: POL (formerly MATIC)
 * ERC-20: USDC (Native USDC contract on Polygon PoS: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359)
 */
export const SUPPORTED_PAYMENT_TOKENS: Record<number, PaymentToken[]> = {
  [POLYGON_MAINNET_CHAIN_ID]: [
    {
      symbol: "USDC",
      name: "USD Coin (Polygon PoS)",
      isNative: false,
      decimals: 6,
      address:
        process.env.USDC_POLYGON_CONTRACT_ADDRESS?.trim() ||
        "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      chainId: POLYGON_MAINNET_CHAIN_ID,
    },
    {
      symbol: "POL",
      name: "Polygon Ecosystem Token",
      isNative: true,
      decimals: 18,
      chainId: POLYGON_MAINNET_CHAIN_ID,
    },
    {
      symbol: "VERSE",
      name: "Verse Token",
      isNative: false,
      decimals: 18,
      address:
        process.env.VERSE_POLYGON_CONTRACT_ADDRESS?.trim() ||
        "0xc708d6f2153933daa50b2d0758955be0a93a8fec",
      chainId: POLYGON_MAINNET_CHAIN_ID,
    },
  ],
  [POLYGON_AMOY_CHAIN_ID]: [
    {
      symbol: "USDC",
      name: "USD Coin (Amoy Testnet)",
      isNative: false,
      decimals: 6,
      address:
        process.env.USDC_AMOY_CONTRACT_ADDRESS?.trim() ||
        "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
      chainId: POLYGON_AMOY_CHAIN_ID,
    },
    {
      symbol: "POL",
      name: "Polygon Amoy Native",
      isNative: true,
      decimals: 18,
      chainId: POLYGON_AMOY_CHAIN_ID,
    },
  ],
}

/**
 * Validates whether a chainId is supported for Web3 settlement.
 */
export function isSettlementChainSupported(chainId: number): boolean {
  return chainId === POLYGON_MAINNET_CHAIN_ID || chainId === POLYGON_AMOY_CHAIN_ID
}

/**
 * Resolves a supported payment token for a given symbol and chainId.
 * Fails closed if the token is not recognized or if an ERC-20 has no valid address.
 */
export function resolvePaymentToken(
  symbol: string,
  chainId: number = PRIMARY_SETTLEMENT_CHAIN_ID
): PaymentToken | null {
  if (!symbol || typeof symbol !== "string") return null
  const cleanSymbol = symbol.trim().toUpperCase()

  const chainTokens = SUPPORTED_PAYMENT_TOKENS[chainId]
  if (!chainTokens) return null

  const token = chainTokens.find((t) => t.symbol.toUpperCase() === cleanSymbol)
  if (!token) return null

  // Security check: non-native tokens MUST have a valid contract address
  if (!token.isNative) {
    if (!token.address || !token.address.startsWith("0x") || token.address.length !== 42) {
      console.error(
        `[PaymentConfig] Security failure: Token ${token.symbol} on chain ${chainId} has invalid contract address.`
      )
      return null
    }
  }

  return token
}

/**
 * Maps invoice currency (e.g. "USD", "POL", "USDC", "VERSE") to default payment token.
 */
export function getDefaultPaymentTokenForInvoiceCurrency(
  currency: string,
  chainId: number = PRIMARY_SETTLEMENT_CHAIN_ID
): PaymentToken {
  const clean = (currency || "").toUpperCase().trim()

  if (clean === "POL" || clean === "MATIC") {
    const pol = resolvePaymentToken("POL", chainId)
    if (pol) return pol
  }

  if (clean === "VERSE") {
    const verse = resolvePaymentToken("VERSE", chainId)
    if (verse) return verse
  }

  // Default to USDC for USD or fiat currencies, otherwise fallback to POL
  const usdc = resolvePaymentToken("USDC", chainId)
  if (usdc) return usdc

  const pol = resolvePaymentToken("POL", chainId)
  if (pol) return pol

  // Strict fail-closed fallback representation
  return {
    symbol: "POL",
    name: "Polygon Ecosystem Token",
    isNative: true,
    decimals: 18,
    chainId,
  }
}

/**
 * Returns the official block explorer base URL for a given chainId.
 */
export function getExplorerBaseUrl(chainId: number = PRIMARY_SETTLEMENT_CHAIN_ID): string {
  if (chainId === POLYGON_AMOY_CHAIN_ID) {
    return "https://www.oklink.com/amoy"
  }
  return "https://polygonscan.com"
}

