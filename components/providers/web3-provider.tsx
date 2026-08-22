"use client"

import * as React from "react"
import { createConfig, http, WagmiProvider } from "wagmi"
import { injected } from "wagmi/connectors"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  SUPPORTED_CHAINS,
  polygon,
  polygonAmoy,
  mainnet,
  sepolia,
  arbitrum,
  base,
  optimism,
} from "@/lib/web3/chains"

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "3a530a37348c4e249485cd3f2441a83d"

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [
    injected(),
  ],
  transports: {
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
  ssr: true,
})

// Lightweight, stable singleton query client
let clientQueryInstance: QueryClient | null = null

function getQueryClient() {
  if (typeof window === "undefined") {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    })
  }
  if (!clientQueryInstance) {
    clientQueryInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    })
  }
  return clientQueryInstance
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => getQueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
