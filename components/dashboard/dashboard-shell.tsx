"use client"

import * as React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { WalletMismatchBanner } from "@/components/auth/wallet-mismatch-banner"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  currentSection: string
  onSelectSection: (sectionId: string) => void
  currentSectionTitle?: string
  children: React.ReactNode
}

export function DashboardShell({
  currentSection,
  onSelectSection,
  currentSectionTitle = "Overview",
  children,
}: DashboardShellProps) {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col md:flex-row antialiased print:bg-white print:block">
      {/* 1. Persistent Desktop Sidebar */}
      <div className="print:hidden">
        <Sidebar
          currentSection={currentSection}
          onSelectSection={onSelectSection}
        />
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 print:pb-0 print:block">
        {/* Workspace Top Header */}
        <div className="print:hidden">
          <DashboardHeader
            currentSectionTitle={currentSectionTitle}
          />
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-4">
          <div className="print:hidden">
            <WalletMismatchBanner />
          </div>
          {children}
        </main>
      </div>

      {/* 3. Mobile Navigation */}
      <div className="print:hidden">
        <MobileNav
          currentSection={currentSection}
          onSelectSection={onSelectSection}
          isDrawerOpen={isDrawerOpen}
          setIsDrawerOpen={setIsDrawerOpen}
        />
      </div>
    </div>
  )
}
