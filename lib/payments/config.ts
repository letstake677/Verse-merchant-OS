export const POLYGON_MAINNET_CHAIN_ID = 137
export const POLYGON_AMOY_CHAIN_ID = 80002

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

export const MERCHANT_RECEIVING_ADDRESS: `0x${string}` =
  (process.env.MERCHANT_WALLET as `0x${string}`) ||
  "0xFC5499252084f7EbDFe7B9fB7b56A8F08Ec4C8ab"

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
      address: "0xc708d6f2153933daa50b2d0758955be0a93a8fec", // Verse Token on Polygon
      decimals: 18,
      chainId: POLYGON_MAINNET_CHAIN_ID,
      color: "violet",
    },
  ],
  [POLYGON_AMOY_CHAIN_ID]: [
    {
      symbol: "POL",
      name: "Polygon Amoy Test POL",
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      isNative: true,
      chainId: POLYGON_AMOY_CHAIN_ID,
      color: "purple",
    },
    {
      symbol: "USDC",
      name: "Testnet USDC",
      address: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
      decimals: 6,
      chainId: POLYGON_AMOY_CHAIN_ID,
      color: "blue",
    },
  ],
}

export function isSettlementChainSupported(chainId: number): boolean {
  return chainId === POLYGON_MAINNET_CHAIN_ID || chainId === POLYGON_AMOY_CHAIN_ID
}

export function resolvePaymentToken(
  tokenSymbolOrAddress: string,
  chainId: number = POLYGON_MAINNET_CHAIN_ID
): PaymentToken | null {
  const tokens = SUPPORTED_PAYMENT_TOKENS[chainId] || []
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

