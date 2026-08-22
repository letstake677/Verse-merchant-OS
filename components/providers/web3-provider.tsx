"use client"

import * as React from "react"
import { createConfig, http, WagmiProvider } from "wagmi"
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors"
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
    injected({
      target() {
        return {
          id: "injected",
          name: "Injected Browser Wallet",
          provider: typeof window !== "undefined" ? (window as any).ethereum : undefined,
        }
      },
      shimDisconnect: true,
    }),
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: "Verse Merchant OS",
        description: "Non-custodial crypto payment processor for modern merchants",
        url: typeof window !== "undefined" ? window.location.origin : "https://verse-merchant-os.vercel.app",
        icons: ["https://avatars.githubusercontent.com/u/179229932"],
      },
    }),
    coinbaseWallet({
      appName: "Verse Merchant OS",
      appLogoUrl: "https://avatars.githubusercontent.com/u/179229932",
    }),
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
