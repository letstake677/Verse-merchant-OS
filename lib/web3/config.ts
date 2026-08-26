import { polygon, polygonAmoy } from "wagmi/chains"
import { wagmiConfig, projectId } from "@/components/providers/web3-provider"

export const POLYGON_MAINNET_CHAIN_ID = 137
export const POLYGON_AMOY_CHAIN_ID = 80002

export const SUPPORTED_CHAINS = [polygon, polygonAmoy] as const

export { wagmiConfig, projectId }

