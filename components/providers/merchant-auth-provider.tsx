"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAccount, useDisconnect } from "wagmi"
import { isSupportedChain, PRIMARY_CHAIN_ID } from "@/lib/web3/chains"
import { useToast } from "@/components/ui/toast"

export interface MerchantInfo {
  walletAddress: string
  businessName?: string
  displayName?: string
}

interface MerchantAuthContextValue {
  merchant: MerchantInfo | null
  authenticatedWallet: string | null
  connectedWallet: `0x${string}` | undefined
  isAuthenticated: boolean
  isLoading: boolean
  isWalletMismatch: boolean
  isWrongNetwork: boolean
  currentChainId: number | undefined
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
  disconnectWallet: () => Promise<void>
}

const MerchantAuthContext = React.createContext<MerchantAuthContextValue | null>(null)

export function MerchantAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  
  const { address: connectedWallet, chain, isConnected } = useAccount()
  const { disconnectAsync } = useDisconnect()

  const [merchant, setMerchant] = React.useState<MerchantInfo | null>(null)
  const [authenticatedWallet, setAuthenticatedWallet] = React.useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)

  const isProtectedPath = pathname?.startsWith("/dashboard")

  const fetchSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.status === 401) {
        setIsAuthenticated(false)
        setMerchant(null)
        setAuthenticatedWallet(null)
        if (isProtectedPath) {
          router.replace("/login")
        }
        return
      }

      if (!res.ok) {
        throw new Error("Failed to fetch session")
      }

      const data = await res.json()
      if (data && data.authenticated && data.merchant) {
        setIsAuthenticated(true)
        setMerchant(data.merchant)
        setAuthenticatedWallet(data.merchant.walletAddress)
      } else {
        setIsAuthenticated(false)
        setMerchant(null)
        setAuthenticatedWallet(null)
        if (isProtectedPath) {
          router.replace("/login")
        }
      }
    } catch (err) {
      console.warn("[Auth] Failed checking session:", err)
      setIsAuthenticated(false)
      setMerchant(null)
      setAuthenticatedWallet(null)
      if (isProtectedPath) {
        router.replace("/login")
      }
    } finally {
      setIsLoading(false)
    }
  }, [isProtectedPath, router])

  React.useEffect(() => {
    void fetchSession()
  }, [fetchSession])

  // Check if wallet in provider differs from authenticated session wallet
  const isWalletMismatch = Boolean(
    isAuthenticated &&
    authenticatedWallet &&
    isConnected &&
    connectedWallet &&
    authenticatedWallet.toLowerCase() !== connectedWallet.toLowerCase()
  )

  // Check if currently connected to an unsupported network
  const currentChainId = chain?.id
  const isWrongNetwork = Boolean(isConnected && currentChainId && !isSupportedChain(currentChainId))

  // Sign out (Server Session Invalidation + Cookie Destruction)
  const signOut = React.useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setIsAuthenticated(false)
      setMerchant(null)
      setAuthenticatedWallet(null)
      toast({
        title: "Signed Out",
        description: "Your merchant session has been safely closed.",
        type: "success",
      })
      router.replace("/login")
    } catch (err) {
      console.error("[Auth] Logout error:", err)
      toast({
        title: "Logout Error",
        description: "Unable to reach server to sign out. Clearing local session.",
        type: "error",
      })
      router.replace("/login")
    }
  }, [router, toast])

  // Disconnect client wallet only (does not revoke server session)
  const disconnectWallet = React.useCallback(async () => {
    try {
      await disconnectAsync()
      toast({
        title: "Wallet Disconnected",
        description: "Browser wallet extension disconnected from client.",
        type: "info",
      })
    } catch (err) {
      console.error("[Auth] Disconnect error:", err)
    }
  }, [disconnectAsync, toast])

  const value = React.useMemo<MerchantAuthContextValue>(
    () => ({
      merchant,
      authenticatedWallet,
      connectedWallet,
      isAuthenticated,
      isLoading,
      isWalletMismatch,
      isWrongNetwork,
      currentChainId,
      refreshSession: fetchSession,
      signOut,
      disconnectWallet,
    }),
    [
      merchant,
      authenticatedWallet,
      connectedWallet,
      isAuthenticated,
      isLoading,
      isWalletMismatch,
      isWrongNetwork,
      currentChainId,
      fetchSession,
      signOut,
      disconnectWallet,
    ]
  )

  return (
    <MerchantAuthContext.Provider value={value}>
      {children}
    </MerchantAuthContext.Provider>
  )
}

const defaultMerchantAuthContext: MerchantAuthContextValue = {
  merchant: null,
  authenticatedWallet: null,
  connectedWallet: undefined,
  isAuthenticated: false,
  isLoading: true,
  isWalletMismatch: false,
  isWrongNetwork: false,
  currentChainId: undefined,
  refreshSession: async () => {},
  signOut: async () => {},
  disconnectWallet: async () => {},
}

export function useMerchantSession() {
  const context = React.useContext(MerchantAuthContext)
  if (!context) {
    return defaultMerchantAuthContext
  }
  return context
}
