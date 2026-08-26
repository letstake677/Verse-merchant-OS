import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { polygon, polygonAmoy } from "wagmi/chains"
import { http } from "viem"

export const POLYGON_MAINNET_CHAIN_ID = 137
export const POLYGON_AMOY_CHAIN_ID = 80002

export const SUPPORTED_CHAINS = [polygon, polygonAmoy] as const

export const projectId =
  process.env.REOWN_PROJECT_ID ||
  process.env.NEXT_REOWN_PROJECT_ID ||
  "3a530a37348c4e249485cd3f2441a83d"

export const wagmiConfig = getDefaultConfig({
  appName: "Verse Merchant OS",
  projectId,
  chains: SUPPORTED_CHAINS,
  transports: {
    [polygon.id]: http("https://polygon-rpc.com"),
    [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology"),
  },
  ssr: true,
})
