"use client"

import * as React from "react"
import { Bell, Search, Menu, ShieldCheck, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/toast"

import { useRouter } from "next/navigation"

interface HeaderProps {
  currentSectionTitle: string
  onOpenMobileMenu?: () => void
}

export function Header({ currentSectionTitle, onOpenMobileMenu }: HeaderProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [email, setEmail] = React.useState<string | null>(null)

  React.useEffect(() => {
    let active = true
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.authenticated && data?.email) {
          setEmail(data.email)
        }
      })
      .catch((err) => console.warn("[Header] Failed to fetch session:", err))
    return () => {
      active = false
    }
  }, [])

  // Helper to extract email display label
  const getDisplayLabel = () => {
    if (!email) return "Merchant Workspace"
    const parts = email.split("@")
    return parts[0]
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Merchant OS</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <span className="font-semibold text-slate-900 capitalize">
            {currentSectionTitle}
          </span>
        </div>
      </div>

      {/* Right-side quick tools */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Network status pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-600 font-medium">Polygon</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-slate-500 text-[11px]">VERSE Token</span>
        </div>

        {/* Global Search placeholder button */}
        <button
          type="button"
          onClick={() =>
            toast({
              title: "Quick Search",
              description: "Search indexes across invoices, payments, and customers will activate in upcoming phases.",
              type: "info",
            })
          }
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search invoices, txs...</span>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() =>
            toast({
              title: "Payment Notifications",
              description: "All automated Polygon payment confirmation webhooks are operational.",
              type: "success",
            })
          }
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
        </button>

        {/* Account / Merchant Dropdown */}
        <DropdownMenu
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 p-1 pl-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-xs font-medium text-slate-700"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold uppercase">
                {getDisplayLabel().slice(0, 2)}
              </div>
              <span className="hidden sm:inline truncate max-w-[120px]">{getDisplayLabel()}</span>
            </button>
          }
          items={[
            {
              id: "profile",
              label: "Merchant Profile",
              onClick: () =>
                toast({
                  title: "Merchant Profile",
                  description: `Account: ${email || "Acme Design Studio (Polygon Tier 1)"}`,
                  type: "info",
                }),
            },
            {
              id: "settings",
              label: "Merchant Settings",
              onClick: () => router.push("/dashboard/settings"),
            },
            {
              id: "verse-docs",
              label: "Verse Ecosystem Docs",
              icon: <ShieldCheck className="w-3.5 h-3.5" />,
              onClick: () => window.open("https://verse.bitcoin.com", "_blank"),
              separatorAfter: true,
            },
            {
              id: "active-network",
              label: "Network: Polygon Mainnet",
              icon: <Check className="w-3.5 h-3.5 text-emerald-600" />,
              disabled: true,
            },
          ]}
        />
      </div>
    </header>
  )
}
