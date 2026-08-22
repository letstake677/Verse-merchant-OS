"use client"

import * as React from "react"
import { AlertTriangle, RefreshCw, LogOut, ArrowRight } from "lucide-react"
import { useMerchantSession } from "@/components/providers/merchant-auth-provider"
import { formatWalletAddress } from "@/lib/utils/wallet"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function WalletMismatchBanner() {
  const router = useRouter()
  const {
    isWalletMismatch,
    authenticatedWallet,
    connectedWallet,
    signOut,
  } = useMerchantSession()

  if (!isWalletMismatch) return null

  const authShort = formatWalletAddress(authenticatedWallet)
  const connectedShort = formatWalletAddress(connectedWallet)

  const handleReauthenticate = () => {
    // Navigate to login with current connected address to trigger fresh SIWE
    router.push("/login")
  }

  return (
    <div
      role="alert"
      className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200"
    >
      <div className="flex items-start sm:items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5 sm:mt-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <p className="font-bold text-amber-950">
            Active Wallet Changed in Browser
          </p>
          <p className="text-amber-800 leading-normal text-[11px]">
            Your session is authenticated for <span className="font-mono font-semibold">{authShort}</span>, but your wallet extension is connected to <span className="font-mono font-semibold">{connectedShort}</span>. To protect your merchant records, please sign in with <span className="font-mono">{connectedShort}</span> or switch accounts in your wallet.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={signOut}
          className="h-8 text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleReauthenticate}
          className="h-8 text-xs font-semibold gap-1.5 bg-amber-700 hover:bg-amber-800 text-white border-transparent"
        >
          <span>Sign In as {connectedShort}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
