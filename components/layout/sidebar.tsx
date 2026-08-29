"use client"

import * as React from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Coins,
  FileText,
  Link2,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Wallet,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { VerseLogo } from "@/components/ui/verse-logo"
import { useMerchantSession } from "@/components/providers/merchant-auth-provider"
import { formatWalletAddress } from "@/lib/utils/wallet"
import { getChainMetadata } from "@/lib/web3/chains"

export interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export const navigationItems: NavItem[] = [
  { id: "overview", label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { id: "payments", label: "Payments", href: "/dashboard/payments", icon: Coins },
  { id: "invoices", label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  { id: "links", label: "Payment Links", href: "/dashboard?tab=links", icon: Link2 },
  { id: "transactions", label: "Transactions", href: "/dashboard?tab=transactions", icon: BarChart3 },
  { id: "receipts", label: "Receipts", href: "/dashboard?tab=receipts", icon: ShieldCheck },
]

export const bottomNavItems: NavItem[] = [
  { id: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface SidebarProps {
  currentSection?: string
  onSelectSection?: (sectionId: string) => void
  className?: string
}

export function Sidebar({
  currentSection = "overview",
  onSelectSection,
  className,
}: SidebarProps) {
  const { merchant, authenticatedWallet, signOut, currentChainId } = useMerchantSession()
  const [loggingOut, setLoggingOut] = React.useState(false)

  const chainMeta = getChainMetadata(currentChainId)

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await signOut()
    } finally {
      setLoggingOut(false)
    }
  }

  const shortAddress = formatWalletAddress(authenticatedWallet)
  const merchantName = merchant?.displayName || merchant?.businessName || (authenticatedWallet ? `Merchant ${shortAddress}` : "Merchant Workspace")

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200/90 bg-white min-h-screen select-none",
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center">
          <VerseLogo size="md" subtitle="Merchant Portal" priority />
        </Link>
      </div>

      {/* Network Status Pill */}
      <div className="px-4 py-3 border-b border-slate-100/80 bg-slate-50/50">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700">{chainMeta.shortName}</span>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono text-slate-500 uppercase">
            {chainMeta.networkType}
          </Badge>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Menu
        </div>
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = currentSection === item.id

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onSelectSection?.(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer group",
                isActive
                  ? "bg-slate-900 text-white font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] font-medium rounded-full",
                    isActive
                      ? "bg-slate-800 text-slate-200"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Bottom Section: Settings & Tools */}
      <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/40">
        <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          System
        </div>
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const isActive = currentSection === item.id
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => onSelectSection?.(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-slate-900 text-white font-semibold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Merchant Profile Footer */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{merchantName}</p>
              <p className="text-[10px] text-slate-400 font-mono font-medium truncate">{shortAddress}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title={loggingOut ? "Signing out..." : "Log Out"}
            aria-label="Log out of session"
          >
            <LogOut className="w-4 h-4 animate-pulse" style={{ animationDuration: loggingOut ? '1s' : '0s' }} />
          </button>
        </div>
      </div>
    </aside>
  )
}
