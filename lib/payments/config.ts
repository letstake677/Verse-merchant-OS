import { POLYGON_MAINNET_CHAIN_ID, POLYGON_AMOY_CHAIN_ID } from "../web3/config"

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
  (process.env.NEXT_PUBLIC_MERCHANT_WALLET as `0x${string}`) ||
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

export const PAYMENT_CONFIRMATION_POLICY = {
  requiredConfirmations: 2,
  pollIntervalMs: 3000,
}
