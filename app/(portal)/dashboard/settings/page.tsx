"use client"

export const dynamic = "force-dynamic"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSwitchChain } from "wagmi"
import { 
  ShieldCheck, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Info,
  User,
  Wallet,
  Globe,
  Unplug,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Lock,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { useMerchantSession } from "@/components/providers/merchant-auth-provider"
import { formatWalletAddress } from "@/lib/utils/wallet"
import { CopyAddressButton } from "@/components/ui/copy-address-button"
import { 
  SUPPORTED_CHAINS, 
  PRIMARY_CHAIN_ID, 
  getChainMetadata 
} from "@/lib/web3/chains"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()

  const {
    authenticatedWallet,
    connectedWallet,
    merchant,
    isAuthenticated,
    isLoading: loadingMe,
    isWalletMismatch,
    isWrongNetwork,
    currentChainId,
    signOut,
    disconnectWallet,
    refreshSession,
  } = useMerchantSession()

  // Profile data state
  const businessName = merchant?.businessName || ""
  const displayName = merchant?.displayName || ""
  const [inputBusinessName, setInputBusinessName] = React.useState("")
  const [inputDisplayName, setInputDisplayName] = React.useState("")
  const [isEditingProfile, setIsEditingProfile] = React.useState(false)
  const [updatingProfile, setUpdatingProfile] = React.useState(false)
  const [profileErrorMsg, setProfileErrorMsg] = React.useState<string | null>(null)
  const [profileSuccessMsg, setProfileSuccessMsg] = React.useState<string | null>(null)

  // Custom Navigation Select for the DashboardShell
  const handleSectionSelect = (sectionId: string) => {
    if (sectionId !== "settings") {
      router.push(`/dashboard?tab=${sectionId}`)
    }
  }

  const handleStartEdit = () => {
    setInputBusinessName(businessName)
    setInputDisplayName(displayName)
    setProfileSuccessMsg(null)
    setProfileErrorMsg(null)
    setIsEditingProfile(true)
  }

  // Profile Edit Cancel Handler
  const handleCancelEdit = () => {
    setInputBusinessName("")
    setInputDisplayName("")
    setIsEditingProfile(false)
    setProfileErrorMsg(null)
    setProfileSuccessMsg(null)
  }

  // Profile Edit Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileErrorMsg(null)
    setProfileSuccessMsg(null)

    const trimmedBusiness = inputBusinessName.trim()
    const trimmedDisplay = inputDisplayName.trim()

    // Client side assertions matching server requirements
    if (trimmedBusiness !== "" && trimmedBusiness.length > 150) {
      setProfileErrorMsg("Business name cannot exceed 150 characters.")
      return
    }
    if (trimmedDisplay !== "" && trimmedDisplay.length > 100) {
      setProfileErrorMsg("Display name cannot exceed 100 characters.")
      return
    }

    setUpdatingProfile(true)
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: trimmedBusiness,
          displayName: trimmedDisplay,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setProfileErrorMsg(data.message || "Failed to update profile details.")
        toast({
          title: "Profile Update Failed",
          description: data.message || "Please check your inputs and try again.",
          type: "error",
        })
        return
      }

      setIsEditingProfile(false)
      setProfileSuccessMsg("Profile updated successfully.")
      await refreshSession()
      toast({
        title: "Success",
        description: "Your merchant profile details have been securely saved.",
        type: "success",
      })
    } catch (err) {
      console.error("Profile update network failure:", err)
      setProfileErrorMsg("A network error occurred. Please try again.")
    } finally {
      setUpdatingProfile(false)
    }
  }

  // Logout Handler (Server-side session invalidation)
  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Signed Out",
        description: "Your merchant session has been terminated.",
        type: "success",
      })
    } catch (err) {
      console.error("Logout failure:", err)
    }
  }

  // Disconnect Wallet Handler (Client-side wallet disconnection only)
  const handleDisconnectWallet = () => {
    disconnectWallet()
    toast({
      title: "Wallet Disconnected",
      description: "Client wallet provider disconnected. Session remains active until signed out.",
      type: "info",
    })
  }

  const chainMeta = getChainMetadata(currentChainId)
  const shortAddress = formatWalletAddress(authenticatedWallet)
  const connectedShort = formatWalletAddress(connectedWallet)

  if (loadingMe) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 text-sm font-medium antialiased font-sans">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
          <span>Verifying secure merchant connection...</span>
        </div>
      </div>
    )
  }

  return (
    <DashboardShell
      currentSection="settings"
      onSelectSection={handleSectionSelect}
      currentSectionTitle="Account Settings"
    >
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col gap-1">
          <PageHeader
            title="Account & Identity Settings"
            description="Manage your verified SIWE wallet identity, business profile parameters, and network connectivity."
          />
        </div>

        {/* Network Warning Banner */}
        {isWrongNetwork && (
          <div
            role="alert"
            className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-rose-950">Unsupported Network Connected</p>
                <p className="text-rose-800 text-[11px]">
                  Your wallet is currently connected to Chain #{currentChainId || "Unknown"}. Verse Merchant OS requires Polygon or a supported EVM chain.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isSwitchingChain}
              onClick={() => switchChain?.({ chainId: PRIMARY_CHAIN_ID })}
              className="h-8 text-xs font-semibold gap-1.5 bg-rose-700 hover:bg-rose-800 text-white shrink-0 self-end sm:self-center"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Switch to Polygon Mainnet</span>
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Primary Wallet Identity Card */}
            <Card className="shadow-xs border border-slate-200/90 rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">Wallet Identity (Authoritative)</CardTitle>
                      <CardDescription className="text-xs text-slate-400 mt-0.5">Primary cryptographic identity for your merchant account.</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono py-0.5 px-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                    SIWE Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Full Address Display with Copy Button */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 block uppercase tracking-wider">
                    Verified Payout & Identity Address
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="min-w-0 font-mono text-xs text-slate-900 font-semibold break-all select-all">
                      {authenticatedWallet || "No wallet authenticated"}
                    </div>
                    {authenticatedWallet && (
                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        <CopyAddressButton
                          address={authenticatedWallet}
                          showText={true}
                          label="Copy Address"
                          successMessage="Address copied"
                          className="h-8 px-3 text-xs bg-white border border-slate-200 shadow-2xs hover:bg-slate-50"
                        />
                        {chainMeta.blockExplorers?.default?.url && (
                          <a
                            href={`${chainMeta.blockExplorers.default.url}/address/${authenticatedWallet}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
                            title="View on Block Explorer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    This address is the sole cryptographically authoritative owner of your invoices, payments, and workspace data.
                  </p>
                </div>

                {/* Session & Connection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Browser Wallet Connection
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${connectedWallet ? "bg-emerald-500" : "bg-slate-400"}`} />
                      <span className="text-xs font-semibold text-slate-800">
                        {connectedWallet ? `Connected (${connectedShort})` : "Disconnected"}
                      </span>
                    </div>
                    {isWalletMismatch && (
                      <p className="text-[10px] text-amber-700 font-medium">
                        Mismatch: active wallet differs from verified SIWE session.
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Active Network
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isWrongNetwork ? "bg-rose-500" : "bg-emerald-500"}`} />
                      <span className="text-xs font-semibold text-slate-800">
                        {chainMeta.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Chain ID: #{chainMeta.id} ({chainMeta.networkType})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Merchant Business Profile details */}
            <Card className="shadow-xs border border-slate-200/90 rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">Merchant Business Profile</CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">Custom metadata attached to your merchant invoices and receipts.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {profileSuccessMsg && (
                  <div 
                    role="alert" 
                    className="p-4 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium rounded-xl flex items-start gap-2.5 leading-relaxed animate-in fade-in"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{profileSuccessMsg}</span>
                  </div>
                )}

                {profileErrorMsg && (
                  <div 
                    role="alert" 
                    className="p-4 mb-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium rounded-xl flex items-start gap-2.5 leading-relaxed animate-in fade-in"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{profileErrorMsg}</span>
                  </div>
                )}

                {!isEditingProfile ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
                          Business Name
                        </span>
                        <div className="h-10 px-3 flex items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium">
                          {businessName || "Verse Merchant Workspace"}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1.5">
                          Display / Contact Name
                        </span>
                        <div className="h-10 px-3 flex items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium">
                          {displayName || shortAddress}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleStartEdit}
                        className="px-5 h-10 text-xs font-semibold border-slate-200 hover:bg-slate-50"
                      >
                        Edit Profile Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-5" noValidate>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Business Name Field */}
                      <div className="space-y-1.5">
                        <label 
                          htmlFor="businessName" 
                          className="text-xs font-semibold text-slate-700 block"
                        >
                          Business Name
                        </label>
                        <Input
                          id="businessName"
                          type="text"
                          value={inputBusinessName}
                          onChange={(e) => setInputBusinessName(e.target.value)}
                          placeholder="e.g. Acme Corporation"
                          className="h-10 border-slate-200 focus-visible:border-slate-900"
                          disabled={updatingProfile}
                          aria-invalid={profileErrorMsg ? "true" : "false"}
                        />
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Max 150 characters. Displays on public checkout links and invoice summaries.
                        </p>
                      </div>

                      {/* Display Name Field */}
                      <div className="space-y-1.5">
                        <label 
                          htmlFor="displayName" 
                          className="text-xs font-semibold text-slate-700 block"
                        >
                          Display / Brand Name
                        </label>
                        <Input
                          id="displayName"
                          type="text"
                          value={inputDisplayName}
                          onChange={(e) => setInputDisplayName(e.target.value)}
                          placeholder="e.g. Merchant Storefront"
                          className="h-10 border-slate-200 focus-visible:border-slate-900"
                          disabled={updatingProfile}
                          aria-invalid={profileErrorMsg ? "true" : "false"}
                        />
                        <p className="text-[11px] text-slate-400 leading-normal">
                          Max 100 characters. Shown in the workspace navigation header.
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={updatingProfile}
                        className="px-4 h-10 text-xs font-semibold border-slate-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={updatingProfile}
                        isLoading={updatingProfile}
                        className="px-5 h-10 text-xs font-semibold"
                      >
                        {updatingProfile ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Supported Networks Reference */}
            <Card className="shadow-xs border border-slate-200/90 rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">Supported Settlement Networks</CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">Compatible EVM blockchains supported by Verse Merchant OS.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SUPPORTED_CHAINS.map((c) => {
                    const isCurrent = c.id === currentChainId
                    const isPrimary = c.id === PRIMARY_CHAIN_ID
                    return (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                          isCurrent
                            ? "bg-indigo-50/60 border-indigo-200 text-indigo-950"
                            : "bg-slate-50 border-slate-200/80 text-slate-800"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{c.name}</span>
                            {isPrimary && (
                              <Badge variant="verse" className="text-[9px] py-0 px-1.5">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Chain #{c.id} · {c.nativeCurrency?.symbol || "ETH"}
                          </p>
                        </div>
                        {isCurrent ? (
                          <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-200">
                            Active
                          </Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isSwitchingChain}
                            onClick={() => switchChain?.({ chainId: c.id })}
                            className="h-7 text-[11px] px-2 text-slate-600 hover:text-slate-900"
                          >
                            Switch
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar Column: Account Actions & Security */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Security Architecture Info */}
            <Card className="shadow-xs border border-slate-200/90 rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-5 pb-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wider">Security Architecture</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-2.5 items-start text-xs text-slate-500 leading-normal">
                  <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Lock className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Cryptographic SIWE Authority</span>
                    Identity is anchored in EIP-4361 standard signatures with single-use server-issued nonces.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start text-xs text-slate-500 leading-normal">
                  <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Strict Isolation Boundary</span>
                    Invoices, customer details, and payment histories are strictly partitioned to your verified wallet address.
                  </div>
                </div>

                <div className="flex gap-2.5 items-start text-xs text-slate-500 leading-normal">
                  <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Info className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Session Version Rotation</span>
                    Signing out invalidates all server session tokens immediately across all devices.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disconnect vs Sign Out Actions */}
            <Card className="shadow-xs border border-slate-200/90 rounded-2xl bg-white p-5 space-y-5">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">Session & Wallet Actions</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Manage your browser wallet connection or sign out of your merchant portal session.
                </p>
              </div>

              {/* Action 1: Disconnect Wallet (Client-side) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Disconnect Wallet</span>
                  <Badge variant="outline" className="text-[10px] text-slate-500">Client-Only</Badge>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Disconnects your browser extension from the page. Keeps your authenticated session cookie active.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectWallet}
                  disabled={!connectedWallet}
                  className="w-full h-9 text-xs font-semibold gap-1.5 border-slate-200 hover:bg-slate-50"
                >
                  <Unplug className="w-3.5 h-3.5 text-slate-500" />
                  <span>Disconnect Browser Wallet</span>
                </Button>
              </div>

              {/* Action 2: Sign Out (Server-side) */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-rose-900">Sign Out of Account</span>
                  <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">Server Session</Badge>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Destroys server session tokens, rotates sessionVersion, and redirects to the login screen.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full h-9 text-xs font-semibold gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Session</span>
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
