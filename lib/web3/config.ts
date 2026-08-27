import { polygon } from "wagmi/chains"
import { wagmiConfig, projectId } from "@/components/providers/web3-provider"

export const POLYGON_MAINNET_CHAIN_ID = 137

export const SUPPORTED_CHAINS = [polygon] as const

export { wagmiConfig, projectId }


