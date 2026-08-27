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

// 1. Get Project ID from client-accessible environment variable or fallback
export const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  process.env.NEXT_PUBLIC_PROJECT_ID ||
  process.env.NEXT_PUBLIC_WC_PROJECT_ID ||
  process.env.NEXT_REOWN_PROJECT_ID ||
  process.env.REOWN_PROJECT_ID ||
  "b56e18d47c72ab683b10814fe9495694"

// Top EVM wallet IDs for Reown AppKit Explorer
export const FEATURED_WALLET_IDS = [
  "c573741b06d52db4083ba452b23401907c744c3e754502440637d0b3f239b2a1", // MetaMask
  "fd205886d32ba4cbc3265986e81170d6f0b8633db96f23a8e00fbe388f2145b3", // Coinbase Wallet
  "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
  "1ae92b2608ede77415638d6c7354e4bd1b900d8476f0cb2601a25fc49944053b", // Rainbow
  "a797e492a05d263d232bc3714ed0a6b2eeb3bab56d55e24b2a02dad3033e2d53", // Phantom
  "22522622442c323046be2826569735dce4d28329b128bb9015b7d41775a3f78f", // Rabby
  "191770b94d2d0db7649171e81150f22d3c94a62176435f3d4d3d42875b1192e2", // Ledger
  "2245b35705e0939be56270082d9042bd6ad3840e66b728005d687d310d51d950", // Safe
]

// Fallback wallet definitions for immediate modal population
export const customWallets = [
  {
    id: "metamask",
    name: "MetaMask",
    homepage: "https://metamask.io",
    image_url: "https://avatars.githubusercontent.com/u/11744586",
    mobile_link: "metamask://",
    desktop_link: "https://metamask.io",
    webapp_link: "https://metamask.io",
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    homepage: "https://www.coinbase.com/wallet",
    image_url: "https://avatars.githubusercontent.com/u/18060234",
    mobile_link: "cbwallet://",
    desktop_link: "https://www.coinbase.com/wallet",
    webapp_link: "https://www.coinbase.com/wallet",
  },
  {
    id: "trust",
    name: "Trust Wallet",
    homepage: "https://trustwallet.com",
    image_url: "https://avatars.githubusercontent.com/u/32889396",
    mobile_link: "trust://",
    desktop_link: "https://trustwallet.com",
    webapp_link: "https://trustwallet.com",
  },
  {
    id: "rainbow",
    name: "Rainbow",
    homepage: "https://rainbow.me",
    image_url: "https://avatars.githubusercontent.com/u/48327834",
    mobile_link: "rainbow://",
    desktop_link: "https://rainbow.me",
    webapp_link: "https://rainbow.me",
  },
  {
    id: "phantom",
    name: "Phantom",
    homepage: "https://phantom.app",
    image_url: "https://avatars.githubusercontent.com/u/78929029",
    mobile_link: "phantom://",
    desktop_link: "https://phantom.app",
    webapp_link: "https://phantom.app",
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    homepage: "https://rabby.io",
    image_url: "https://avatars.githubusercontent.com/u/82548813",
    mobile_link: "rabby://",
    desktop_link: "https://rabby.io",
    webapp_link: "https://rabby.io",
  },
]

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

// 4. Initialize Reown AppKit Modal (safely on client)
export const modal = typeof window !== "undefined"
  ? createAppKit({
      adapters: [wagmiAdapter],
      networks,
      projectId,
      featuredWalletIds: FEATURED_WALLET_IDS,
      customWallets,
      allWallets: "SHOW",
      enableWalletConnect: true,
      enableInjected: true,
      enableEIP6963: true,
      enableCoinbase: true,
      metadata: {
        name: "Verse Merchant OS",
        description: "Non-custodial crypto payment processor for modern merchants",
        url: typeof window !== "undefined" ? window.location.origin : "https://verse-merchant-os.vercel.app",
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
  : null

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
