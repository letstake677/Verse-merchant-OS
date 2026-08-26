"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { useAccount, useDisconnect, useSignMessage } from "wagmi"
import { useConnectModal } from "@rainbow-me/rainbowkit"
import { 
  ShieldCheck, 
  Wallet, 
  ArrowRight, 
  Lock, 
  CheckCircle,
  HelpCircle,
  Activity,
  LogOut,
  RefreshCw,
  AlertTriangle,
  FileSignature,
  Sparkles,
} from "lucide-react"
import { formatWalletAddress } from "@/lib/utils/wallet"
import { getChainMetadata, isSupportedChain } from "@/lib/web3/chains"

type AuthStep = "idle" | "connecting" | "nonce" | "signing" | "verifying"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { openConnectModal } = useConnectModal()
  
  const { address, isConnected, chain } = useAccount()
  const { disconnectAsync } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  const [authStep, setAuthStep] = React.useState<AuthStep>("idle")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Detect session expired redirect flag
  const isExpired = searchParams?.get("expired") === "true"

  // Attempt initial session check if wallet is connected
  React.useEffect(() => {
    let active = true

    if (!isConnected || !address) {
      return
    }

    const checkExistingSession = async () => {
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json()
        if (!active) return

        if (data && data.authenticated && data.walletAddress) {
          // If the authenticated session matches currently connected wallet, redirect to dashboard
          if (data.walletAddress.toLowerCase() === address.toLowerCase()) {
            toast({
              title: "Session Active",
              description: `Verified merchant session for ${formatWalletAddress(address)}`,
              type: "success",
            })
            router.prefetch("/dashboard")
            router.replace("/dashboard")
          }
        }
      } catch (err) {
        console.warn("[Auth] Session pre-check error:", err)
      }
    }

    void checkExistingSession()

    return () => {
      active = false
    }
  }, [isConnected, address, router, toast])

  // Complete EIP-4361 (SIWE) signing and verification workflow
  const handleSignIn = async () => {
    setErrorMsg(null)

    // 1. If not connected, trigger wallet connection modal
    if (!isConnected || !address) {
      try {
        setAuthStep("connecting")
        if (openConnectModal) {
          openConnectModal()
        }
      } catch (err: unknown) {
        console.error("[Auth] Wallet modal error:", err)
        setErrorMsg("Unable to open wallet connection modal. Please try again.")
      } finally {
        setAuthStep("idle")
      }
      return
    }

    try {
      const activeAddress = address

      if (!activeAddress) {
        throw new Error("Unable to retrieve connected wallet address. Please unlock your wallet.")
      }

      // 2. Fetch fresh single-use nonce from server
      setAuthStep("nonce")
      const nonceRes = await fetch("/api/auth/nonce")
      const nonceData = await nonceRes.json()
      if (!nonceData.ok || !nonceData.nonce) {
        throw new Error(nonceData.message || "Failed to retrieve secure session nonce from server.")
      }
      const nonce = nonceData.nonce

      // 3. Format standard EIP-4361 SIWE message
      setAuthStep("signing")
      const domain = window.location.host
      const origin = window.location.origin
      const chainId = chain?.id || 137
      const issuedAt = new Date().toISOString()
      
      const siweMessage = [
        `${domain} wants you to sign in with your Ethereum account:`,
        activeAddress,
        "",
        "Sign in with your secure wallet to Verse Merchant OS.",
        "",
        `URI: ${origin}`,
        `Version: 1`,
        `Chain ID: ${chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
      ].join("\n")

      // 4. Request cryptographic message signature in wallet
      let signature: string
      try {
        signature = await signMessageAsync({ message: siweMessage })
      } catch (signErr: unknown) {
        const signMsg = signErr instanceof Error ? signErr.message : String(signErr)
        if (signMsg.toLowerCase().includes("user rejected") || signMsg.toLowerCase().includes("rejected the request")) {
          throw new Error("Signature request was rejected in your wallet. Please sign the SIWE message to access your merchant workspace.")
        }
        throw new Error(`Wallet signing failed: ${signMsg}`)
      }

      // 5. Verify signature and establish server session
      setAuthStep("verifying")
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: siweMessage,
          signature,
        }),
      })

      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || !verifyData.ok) {
        throw new Error(verifyData.message || "Cryptographic signature verification failed.")
      }

      // 6. Verification successful: Notify and navigate to dashboard
      toast({
        title: "Authenticated Successfully",
        description: `Welcome! Workspace isolated for ${formatWalletAddress(activeAddress)}`,
        type: "success",
      })

      router.prefetch("/dashboard")
      router.replace("/dashboard")
    } catch (err: unknown) {
      console.error("[Auth] Wallet sign-in error:", err)
      const message = err instanceof Error ? err.message : "Authentication cancelled or failed."
      setErrorMsg(message)
    } finally {
      setAuthStep("idle")
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnectAsync()
      setErrorMsg(null)
    } catch (err) {
      console.error("[Auth] Disconnect error:", err)
    }
  }

  const isBusy = authStep !== "idle"
  const chainMeta = getChainMetadata(chain?.id)
  const isNetworkSupported = !chain?.id || isSupportedChain(chain?.id)

  const getButtonText = () => {
    switch (authStep) {
      case "connecting":
        return "Opening Reown AppKit..."
      case "nonce":
        return "Requesting Nonce..."
      case "signing":
        return "Sign Message in Wallet..."
      case "verifying":
        return "Verifying Signature..."
      default:
        return isConnected ? "Sign In & Authorize Workspace" : "Connect with Reown AppKit"
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfcfd] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-800 antialiased font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {/* Branding badge */}
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3.5 py-1.5 rounded-full mb-6 select-none shadow-xs">
          <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-600 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">Verse Merchant OS</span>
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 text-center">
          Access your Workspace
        </h1>
        <p className="mt-2 text-sm text-slate-500 text-center max-w-xs leading-relaxed">
          Secure, non-custodial Web3 payment management for modern merchants.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Card Body */}
        <div className="bg-white py-10 px-6 shadow-xs border border-slate-200/80 rounded-2xl sm:px-10 space-y-6">
          
          {/* Active alerts or feedback */}
          {errorMsg && (
            <div 
              role="alert" 
              className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium leading-relaxed flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold">Authentication Notice</p>
                <p className="text-rose-700 text-[11px] mt-0.5 break-words">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Connected wallet banner */}
          {isConnected && address && (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-800 truncate block">
                    {formatWalletAddress(address)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {chainMeta.name} {chainMeta.networkType === "testnet" ? "(Testnet)" : ""}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isBusy}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer transition-colors p-1 shrink-0"
                title="Disconnect wallet"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-1 space-y-3">
            <button
              type="button"
              onClick={() => handleSignIn()}
              disabled={isBusy}
              className="w-full flex justify-center items-center gap-2.5 py-3.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed select-none cursor-pointer"
            >
              {isBusy ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 shrink-0 animate-spin" />
                  <span>{getButtonText()}</span>
                </>
              ) : isConnected ? (
                <>
                  <FileSignature className="h-4.5 w-4.5 shrink-0" />
                  <span>Authorize & Sign In</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5 shrink-0 text-indigo-200" />
                  <span>Connect Wallet / Email / Social</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </>
              )}
            </button>

            {isConnected && !isBusy && (
              <button
                type="button"
                onClick={() => {
                  if (openConnectModal) {
                    openConnectModal()
                  }
                }}
                className="w-full py-2.5 px-3 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50/60 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>Switch Wallet / Account</span>
              </button>
            )}
          </div>

          {/* Informational Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Decentralized Identity Benefits</span>
            </h3>
            
            <ul className="space-y-3.5">
              <li className="flex gap-2.5 items-start text-xs text-slate-500 leading-normal">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-700 block font-semibold mb-0.5">Password-Free Security</strong>
                  No database passwords or emails to leak. Cryptographic wallet signatures ensure 100% server-verified authorization.
                </div>
              </li>
              
              <li className="flex gap-2.5 items-start text-xs text-slate-500 leading-normal">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-700 block font-semibold mb-0.5">Strict Tenant Isolation</strong>
                  Your merchant profile, invoices, and business parameters are cryptographically anchored to your verified wallet address.
                </div>
              </li>
            </ul>
          </div>

          {/* Footer help link */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Compatible with MetaMask, Rabby, Coinbase Wallet & all EIP-6963 wallets.</span>
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#fbfcfd] flex items-center justify-center text-slate-400 text-sm font-medium antialiased font-sans">
        Loading secure connection...
      </div>
    }>
      <LoginPageContent />
    </React.Suspense>
  )
}
