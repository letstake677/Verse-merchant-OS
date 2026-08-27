import { getAddress } from "viem"

export const POLYGON_MAINNET_CHAIN_ID = 137

export interface PaymentToken {
  symbol: string
  name: string
  address: `0x${string}`
  decimals: number
  isNative?: boolean
  chainId: number
  iconUrl?: string
  color: string
}

/**
 * Standard default merchant receiving address with valid EIP-55 checksum.
 */
export const DEFAULT_MERCHANT_ADDRESS: `0x${string}` =
  "0xfc5499252084F7EBdfe7B9Fb7b56a8f08EC4c8Ab"

/**
 * Safely resolves and checksums any EVM address.
 * Prevents "Address is invalid" runtime exceptions from Viem.
 */
export function toChecksumAddress(raw?: string | null): `0x${string}` {
  if (!raw) return DEFAULT_MERCHANT_ADDRESS
  const trimmed = raw.trim()
  try {
    if (trimmed.startsWith("0x") && trimmed.length === 42) {
      return getAddress(trimmed.toLowerCase())
    }
    return getAddress(trimmed)
  } catch {
    return DEFAULT_MERCHANT_ADDRESS
  }
}

export const MERCHANT_RECEIVING_ADDRESS: `0x${string}` = toChecksumAddress(
  process.env.MERCHANT_WALLET || process.env.NEXT_PUBLIC_MERCHANT_WALLET
)

export const SUPPORTED_PAYMENT_TOKENS: Record<number, PaymentToken[]> = {
  [POLYGON_MAINNET_CHAIN_ID]: [
    {
      symbol: "USDC",
      name: "USD Coin (Polygon PoS)",
      address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Native USDC on Polygon
      decimals: 6,
      chainId: POLYGON_MAINNET_CHAIN_ID,
      color: "blue",
    },
    {
      symbol: "POL",
      name: "Polygon Ecosystem Token",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      isNative: true,
      chainId: POLYGON_MAINNET_CHAIN_ID,
      color: "purple",
    },
    {
      symbol: "VERSE",
      name: "Verse Token",
      address: "0xc708D6F2153933DAA50B2D0758955Be0A93A8FEc", // Verse Token on Polygon (Checksummed)
      decimals: 18,
      chainId: POLYGON_MAINNET_CHAIN_ID,
      color: "violet",
    },
  ],
}

export function isSettlementChainSupported(chainId: number): boolean {
  return chainId === POLYGON_MAINNET_CHAIN_ID
}

export function resolvePaymentToken(
  tokenSymbolOrAddress: string,
  chainId: number = POLYGON_MAINNET_CHAIN_ID
): PaymentToken | null {
  const tokens = SUPPORTED_PAYMENT_TOKENS[chainId] || SUPPORTED_PAYMENT_TOKENS[POLYGON_MAINNET_CHAIN_ID] || []
  const query = tokenSymbolOrAddress.trim().toLowerCase()

  const found = tokens.find(
    (t) =>
      t.symbol.toLowerCase() === query ||
      t.name.toLowerCase() === query ||
      t.address.toLowerCase() === query
  )

  return found || null
}

export function getDefaultPaymentTokenForInvoiceCurrency(
  currency: string = "USD",
  chainId: number = POLYGON_MAINNET_CHAIN_ID
): PaymentToken {
  const normalized = (currency || "USD").toUpperCase().trim()
  const tokens = SUPPORTED_PAYMENT_TOKENS[chainId] || SUPPORTED_PAYMENT_TOKENS[POLYGON_MAINNET_CHAIN_ID]

  if (normalized === "POL" || normalized === "MATIC") {
    const pol = tokens.find((t) => t.isNative || t.symbol === "POL")
    if (pol) return pol
  }

  if (normalized === "VERSE") {
    const verse = tokens.find((t) => t.symbol === "VERSE")
    if (verse) return verse
  }

  // Default to USDC for fiat USD / USDC settlement
  const usdc = tokens.find((t) => t.symbol === "USDC")
  if (usdc) return usdc

  return tokens[0]
}

export const PAYMENT_CONFIRMATION_POLICY = {
  requiredConfirmations: 2,
  pollIntervalMs: 3000,
}


