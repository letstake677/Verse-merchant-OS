import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { polygon, polygonAmoy } from "wagmi/chains"
import { http } from "viem"

export const POLYGON_MAINNET_CHAIN_ID = 137
export const POLYGON_AMOY_CHAIN_ID = 80002

export const SUPPORTED_CHAINS = [polygon, polygonAmoy] as const

export const wagmiConfig = getDefaultConfig({
  appName: "VersePay Merchant Invoicing",
  projectId: "991e204cbf9161a0d33e9ec49b068307", // Public Demo Project ID
  chains: SUPPORTED_CHAINS,
  transports: {
    [polygon.id]: http("https://polygon-rpc.com"),
    [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology"),
  },
  ssr: true,
})
