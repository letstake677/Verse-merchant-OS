"use client"

import * as React from "react"
import Link from "next/link"
import {
  Globe,
  Wallet,
} from "lucide-react"
import { useMerchantSession } from "@/components/providers/merchant-auth-provider"
import { formatWalletAddress } from "@/lib/utils/wallet"
import { getChainMetadata } from "@/lib/web3/chains"

interface DashboardHeaderProps {
  currentSectionTitle?: string
  businessName?: string
  className?: string
}

export function DashboardHeader({
  currentSectionTitle = "Overview",
  businessName,
  className,
}: DashboardHeaderProps) {
  const { merchant, authenticatedWallet, currentChainId } = useMerchantSession()
  const chainMeta = getChainMetadata(currentChainId)

  const activeBusinessName = businessName || merchant?.businessName || merchant?.displayName || "Merchant Workspace"
  const shortAddress = formatWalletAddress(authenticatedWallet)
  const avatarInitials = (merchant?.businessName?.slice(0, 2) || merchant?.displayName?.slice(0, 2) || "VM").toUpperCase()

  return (
    <header className="h-16 border-b border-slate-200/90 bg-white px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Section Title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
          {currentSectionTitle}
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <span>/</span>
          <span className="font-medium text-slate-600 truncate">{activeBusinessName}</span>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Network status pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-700 font-medium text-[11px]">{chainMeta.name}</span>
        </div>

        {/* View Public Marketing Site */}
        <Link
          href="/"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors px-2 py-1 rounded-md hover:bg-slate-100"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Marketing Site</span>
        </Link>

        {/* Workspace Avatar */}
        <Link href="/dashboard/settings" className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono">
            {avatarInitials}
          </div>
          <div className="hidden lg:block text-left text-xs">
            <p className="font-semibold text-slate-900 leading-tight truncate max-w-[120px]">{activeBusinessName}</p>
            <p className="text-[10px] text-slate-400 font-mono" title={authenticatedWallet || ""}>{shortAddress}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}
