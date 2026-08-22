"use client"

import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { ToastProvider } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export interface AppShellProps {
  children?: React.ReactNode
  currentSection?: string
  onSelectSection?: (sectionId: string) => void
  customHeaderTitle?: string
}

export function AppShell({
  children,
  currentSection = "overview",
  onSelectSection,
  customHeaderTitle,
}: AppShellProps) {
  const [activeSection, setActiveSection] = React.useState(currentSection)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = React.useState(false)

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId)
    onSelectSection?.(sectionId)
  }

  const sectionTitles: Record<string, string> = {
    overview: "Overview",
    payments: "Payments & Transactions",
    invoices: "Invoice Management",
    links: "Payment Links & QRs",
    customers: "Customers",
    analytics: "Analytics & Verse Insights",
    settings: "Merchant Settings",
  }

  const title = customHeaderTitle || sectionTitles[activeSection] || activeSection

  return (
    <div id="app-shell-root" className="min-h-screen bg-[#f8fafc] text-slate-900 flex antialiased">
      {/* Desktop Sidebar */}
      <Sidebar
        currentSection={activeSection}
        onSelectSection={handleSectionChange}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 md:pb-0">
        {/* Top Sticky Header */}
        <Header
          currentSectionTitle={title}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Navigation & Drawer */}
      <MobileNav
        currentSection={activeSection}
        onSelectSection={handleSectionChange}
        isDrawerOpen={isMobileDrawerOpen}
        setIsDrawerOpen={setIsMobileDrawerOpen}
      />
    </div>
  )
}
