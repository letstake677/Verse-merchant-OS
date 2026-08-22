"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMerchantSession } from "@/components/providers/merchant-auth-provider"
import { formatWalletAddress } from "@/lib/utils/wallet"
import { CopyAddressButton } from "@/components/ui/copy-address-button"
import { getChainMetadata } from "@/lib/web3/chains"

interface MerchantIdentityProps {
  businessName?: string
  merchantAddress?: string | null
  network?: string
  className?: string
}

export function MerchantIdentity({
  businessName,
  merchantAddress,
  network,
  className,
}: MerchantIdentityProps) {
  const { merchant, authenticatedWallet, currentChainId } = useMerchantSession()
  const chainMeta = getChainMetadata(currentChainId)

  const activeAddress = merchantAddress !== undefined ? merchantAddress : authenticatedWallet
  const activeBusinessName = businessName || merchant?.businessName || merchant?.displayName || "Verse Merchant Workspace"
  const activeNetwork = network || chainMeta.name
  const shortAddress = formatWalletAddress(activeAddress)

  return (
    <div
      className={cn(
        "p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        className
      )}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm font-mono shadow-xs shrink-0">
          V
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">
              {activeBusinessName}
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono py-0 px-2 text-slate-600 bg-slate-50 border-slate-200">
              {activeNetwork}
            </Badge>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono flex-wrap">
            <span>Receiving Address:</span>
            {activeAddress ? (
              <div className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                <span title={activeAddress} aria-label={`Full address: ${activeAddress}`}>
                  {shortAddress}
                </span>
                <CopyAddressButton
                  address={activeAddress}
                  iconSize={12}
                  label="Copy receiving address"
                  successMessage="Receiving address copied"
                  className="p-1"
                />
              </div>
            ) : (
              <span className="text-slate-400 italic font-sans text-xs">
                Wallet not connected (Configure in Settings)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs self-start sm:self-auto shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-xs">SIWE Verified</span>
        </div>
      </div>
    </div>
  )
}
