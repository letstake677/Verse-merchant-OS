"use client"

import * as React from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Coins,
  FileText,
  Menu,
  Link2,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Drawer } from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import { useMerchantSession } from "@/components/providers/merchant-auth-provider"
import { getChainMetadata } from "@/lib/web3/chains"

interface MobileNavProps {
  currentSection: string
  onSelectSection: (sectionId: string) => void
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
}

export function MobileNav({
  currentSection,
  onSelectSection,
  isDrawerOpen,
  setIsDrawerOpen,
}: MobileNavProps) {
  const { signOut, currentChainId } = useMerchantSession()
  const chainMeta = getChainMetadata(currentChainId)

  const primaryMobileItems = [
    { id: "overview", label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { id: "payments", label: "Payments", href: "/dashboard/payments", icon: Coins },
    { id: "invoices", label: "Invoices", href: "/dashboard/invoices", icon: FileText },
  ]

  const secondaryItems = [
    { id: "links", label: "Payment Links", href: "/dashboard?tab=links", icon: Link2, desc: "Instant reusable URLs & QRs" },
    { id: "transactions", label: "Transactions", href: "/dashboard?tab=transactions", icon: BarChart3, desc: "Polygon settlement history" },
    { id: "receipts", label: "Receipts", href: "/dashboard?tab=receipts", icon: ShieldCheck, desc: "Shareable proof of payment" },
    { id: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings, desc: "Merchant account settings & wallet identity" },
  ]

  const [loggingOut, setLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      setIsDrawerOpen(false)
      await signOut()
    } finally {
      setLoggingOut(false)
    }
  }


  return (
    <>
      {/* Mobile Bottom Fixed Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200/90 backdrop-blur-md px-3 py-2 select-none"
      >
        <div className="flex items-center justify-around">
          {primaryMobileItems.map((item) => {
            const Icon = item.icon
            const isActive = currentSection === item.id

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onSelectSection(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[64px] min-h-[44px] transition-colors cursor-pointer",
                  isActive ? "text-slate-900 font-semibold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 mb-1 transition-transform",
                    isActive && "scale-110 text-slate-900"
                  )}
                />
                <span className="text-[11px] leading-none">{item.label}</span>
              </Link>
            )
          })}

          {/* "More" button to toggle secondary navigation drawer */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-lg min-w-[64px] min-h-[44px] transition-colors cursor-pointer",
              isDrawerOpen || ["links", "transactions", "receipts", "settings"].includes(currentSection)
                ? "text-slate-900 font-semibold"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Menu className="w-5 h-5 mb-1" />
            <span className="text-[11px] leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* Secondary Navigation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="All Navigation"
        description="Verse Merchant OS menu & shortcuts"
        side="bottom"
      >
        <div className="space-y-4 pb-4">
          {/* Network Status banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-800">{chainMeta.name}</span>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              {chainMeta.networkType}
            </Badge>
          </div>

          <div className="space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon
              const isActive = currentSection === item.id

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    onSelectSection(item.id)
                    setIsDrawerOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center",
                        isActive ? "bg-slate-800 text-white" : "bg-white border border-slate-200 text-slate-700"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{item.label}</p>
                      <p
                        className={cn(
                          "text-[11px]",
                          isActive ? "text-slate-300" : "text-slate-500"
                        )}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-white" : "text-slate-400"
                    )}
                  />
                </Link>
              )
            })}
          </div>

          {/* Quick link to design system demo */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/design-system"
              onClick={() => setIsDrawerOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-900 hover:bg-indigo-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold">View Design System Showcase</span>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-400" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-900 hover:bg-rose-100 transition-colors cursor-pointer text-left font-sans disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4 text-rose-600 animate-pulse" style={{ animationDuration: loggingOut ? '1s' : '0s' }} />
                <span className="text-xs font-semibold">{loggingOut ? "Signing Out of Session..." : "Log Out of Session"}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      </Drawer>

    </>
  )
}
