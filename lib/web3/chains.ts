import type { Chain } from "viem"

export const polygon: Chain = {
  id: 137,
  name: "Polygon",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["https://polygon-rpc.com"] } },
  blockExplorers: { default: { name: "PolygonScan", url: "https://polygonscan.com" } },
}

export const polygonAmoy: Chain = {
  id: 80002,
  name: "Polygon Amoy",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc-amoy.polygon.technology"] } },
  blockExplorers: { default: { name: "OKLink", url: "https://www.oklink.com/amoy" } },
  testnet: true,
}

export const mainnet: Chain = {
  id: 1,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://cloudflare-eth.com"] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://etherscan.io" } },
}

export const sepolia: Chain = {
  id: 11155111,
  name: "Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.sepolia.org"] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://sepolia.etherscan.io" } },
  testnet: true,
}

export const arbitrum: Chain = {
  id: 42161,
  name: "Arbitrum One",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://arb1.arbitrum.io/rpc"] } },
  blockExplorers: { default: { name: "Arbiscan", url: "https://arbiscan.io" } },
}

export const base: Chain = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
  blockExplorers: { default: { name: "Basescan", url: "https://basescan.org" } },
}

export const optimism: Chain = {
  id: 10,
  name: "OP Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.optimism.io"] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://optimistic.etherscan.io" } },
}

export interface SupportedChainMeta {
  id: number
  name: string
  shortName: string
  networkType: "mainnet" | "testnet"
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  blockExplorers?: {
    default: {
      name: string
      url: string
    }
  }
  isPrimary?: boolean
}

/**
 * Server-authoritative supported EVM chains for Verse Merchant OS.
 * Primary settlement network is Polygon (Chain ID 137).
 */
export const SUPPORTED_CHAINS: readonly [Chain, ...Chain[]] = [
  polygon,
  polygonAmoy,
  mainnet,
  sepolia,
  arbitrum,
  base,
  optimism,
]

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((c) => c.id)

export const PRIMARY_CHAIN_ID = polygon.id // 137

/**
 * Returns metadata for a given chainId or fallback for unknown chains.
 */
export function getChainMetadata(chainId?: number): SupportedChainMeta {
  if (!chainId) {
    return {
      id: polygon.id,
      name: "Polygon",
      shortName: "Polygon",
      networkType: "mainnet",
      nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
      blockExplorers: { default: { name: "PolygonScan", url: "https://polygonscan.com" } },
      isPrimary: true,
    }
  }

  const matched = SUPPORTED_CHAINS.find((c) => c.id === chainId)
  if (matched) {
    return {
      id: matched.id,
      name: matched.name,
      shortName: matched.name.replace(/ Mainnet| Testnet/i, ""),
      networkType: matched.testnet ? "testnet" : "mainnet",
      nativeCurrency: matched.nativeCurrency,
      blockExplorers: matched.blockExplorers,
      isPrimary: matched.id === polygon.id,
    }
  }

  return {
    id: chainId,
    name: `EVM Chain #${chainId}`,
    shortName: `Chain #${chainId}`,
    networkType: "mainnet",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    isPrimary: false,
  }
}

/**
 * Checks if a given chain ID is officially supported for SIWE merchant authentication.
 */
export function isSupportedChain(chainId?: number | null): boolean {
  if (!chainId) return false
  return SUPPORTED_CHAIN_IDS.includes(chainId)
}
