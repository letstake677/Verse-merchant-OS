"use client"

import * as React from "react"
import { createAppKit } from "@reown/appkit/react"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  polygon,
  polygonAmoy,
  mainnet,
  arbitrum,
  base,
  optimism,
  sepolia,
  type AppKitNetwork,
} from "@reown/appkit/networks"

// 1. Get Project ID from environment variable (supporting NEXT_PUBLIC_ and NEXT_ variants) or fallback
export const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  process.env.NEXT_REOWN_PROJECT_ID ||
  "3a530a37348c4e249485cd3f2441a83d"

// 2. Define supported networks
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  polygon,
  polygonAmoy,
  mainnet,
  arbitrum,
  base,
  optimism,
  sepolia,
]

// 3. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
})

// 4. Initialize Reown AppKit Modal (with Email, Socials/X, all Web3 wallets)
if (typeof window !== "undefined") {
  try {
    createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId,
      metadata: {
        name: "Verse Merchant OS",
        description: "Non-custodial crypto payment processor for modern merchants",
        url: window.location.origin || "https://verse-merchant-os.vercel.app",
        icons: ["https://avatars.githubusercontent.com/u/179229932"],
      },
      features: {
        analytics: false,
        email: true,
        socials: ["google", "x", "github", "discord", "apple"],
        emailShowWallets: true,
      },
      themeMode: "light",
      themeVariables: {
        "--w3m-accent": "#4f46e5",
        "--w3m-border-radius-master": "12px",
        "--w3m-z-index": 9999,
      },
    })
  } catch (err) {
    console.warn("[AppKit] Initialized or window check:", err)
  }
}

export const wagmiConfig = wagmiAdapter.wagmiConfig

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
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
