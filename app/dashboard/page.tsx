"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Coins,
  FileText,
  Link2,
  TrendingUp,
  CreditCard,
  Search,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  QrCode,
  ArrowUpRight,
  ArrowLeft,
  XCircle,
  BarChart3,
  Receipt,
  Settings,
  Plus,
  Loader2,
} from "lucide-react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { MerchantIdentity } from "@/components/dashboard/merchant-identity"
import { OverviewCard } from "@/components/dashboard/overview-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentPayments, PaymentItem } from "@/components/dashboard/recent-payments"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/components/ui/toast"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function MerchantDashboardPageContent() {
  const searchParams = useSearchParams()
  const initialTab = searchParams?.get("tab")
  const defaultTab = initialTab && ["overview", "payments", "invoices", "links", "transactions", "receipts", "settings"].includes(initialTab)
    ? initialTab
    : "overview"

  const [currentSection, setCurrentSection] = React.useState<string>(defaultTab)
  const { toast } = useToast()
  const router = useRouter()

  // Real data state from MongoDB
  const [payments, setPayments] = React.useState<PaymentItem[]>([])
  const [summary, setSummary] = React.useState({
    totalVolumeUsd: "0.00",
    confirmedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalCount: 0,
  })
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let isMounted = true

    async function loadDashboardData() {
      try {
        const res = await fetch("/api/payments?limit=5")
        if (res.ok) {
          const data = await res.json()
          if (isMounted && data.ok) {
            if (data.payments && Array.isArray(data.payments)) {
              const formatted: PaymentItem[] = data.payments.map((p: any) => ({
                id: p.id,
                reference: p.reference || `PAY-${p.id.slice(-6)}`,
                customerName: p.customerName || (p.payerAddress ? `${p.payerAddress.slice(0, 6)}...${p.payerAddress.slice(-4)}` : "Customer"),
                customerEmail: p.customerEmail,
                amount: p.amount,
                asset: p.token?.symbol || p.currency || "USDC",
                status: p.status,
                date: new Date(p.createdAt).toLocaleDateString(),
                txHash: p.transactionHash,
              }))
              setPayments(formatted)
            }
            if (data.summary) {
              setSummary({
                totalVolumeUsd: data.summary.totalVolumeUsd || "0.00",
                confirmedCount: data.summary.confirmedCount || 0,
                pendingCount: data.summary.pendingCount || 0,
                failedCount: data.summary.failedCount || 0,
                totalCount: (data.summary.confirmedCount || 0) + (data.summary.pendingCount || 0) + (data.summary.failedCount || 0),
              })
            }
          }
        }
      } catch (err) {
        console.error("[Dashboard] Error loading dashboard data:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleCreatePayment = () => {
    router.push("/dashboard/invoices/new")
  }

  const handleCreateInvoice = () => {
    router.push("/dashboard/invoices/new")
  }

  const handleCreateLink = () => {
    router.push("/dashboard/invoices/new")
  }

  const handleViewPayment = (payment: PaymentItem) => {
    router.push(`/payments/${payment.id}/receipt`)
  }

  const getSectionTitle = () => {
    switch (currentSection) {
      case "payments":
        return "Payments"
      case "invoices":
        return "Invoices"
      case "links":
        return "Payment Links"
      case "transactions":
        return "Transactions"
      case "receipts":
        return "Receipts"
      case "settings":
        return "Settings"
      default:
        return "Workspace Overview"
    }
  }

  return (
    <DashboardShell
      currentSection={currentSection}
      onSelectSection={setCurrentSection}
      currentSectionTitle={getSectionTitle()}
    >
      {/* 1. Environment Preview Banner */}
      <div
        id="workspace-preview-banner"
        className="p-3 sm:p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-800 text-indigo-400 flex items-center justify-center shrink-0 border border-slate-700">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-white">
              Verse Merchant OS Workspace
            </span>
            <span className="text-slate-400 sm:ml-2 text-[11px] block sm:inline">
              Polygon settlement layer active • Ready for payments
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/">
            <Button
              variant="secondary"
              size="sm"
              className="h-7 text-xs gap-1.5 bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Landing Page</span>
            </Button>
          </Link>
          <Link href="/design-system">
            <Button variant="verse" size="sm" className="h-7 text-xs gap-1.5">
              <span>Design System</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Current Business / Workspace Identity Area */}
      <MerchantIdentity />

      {/* 3. Section Routing */}

      {/* 3A. OVERVIEW SECTION */}
      {currentSection === "overview" && (
        <div className="space-y-6">
          {/* Header & Quick Action CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Workspace Overview
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Real-time snapshot of your incoming payments, invoices, and Polygon settlement status.
              </p>
            </div>

            <QuickActions
              onCreatePayment={handleCreatePayment}
              onCreateInvoice={handleCreateInvoice}
              onCreateLink={handleCreateLink}
            />
          </div>

          {/* 4 Professional Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverviewCard
              title="Total Volume"
              value={`$${summary.totalVolumeUsd}`}
              subtext="Aggregate settled volume"
              icon={Coins}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50 border-indigo-100"
              trend={{
                value: `${summary.confirmedCount} settled`,
                isPositive: summary.confirmedCount > 0,
                label: "settled volume",
              }}
            />

            <OverviewCard
              title="Successful Payments"
              value={summary.confirmedCount.toString()}
              subtext="Settled on Polygon"
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-50 border-emerald-100"
              trend={{
                value: `${summary.confirmedCount} confirmed`,
                isPositive: true,
                label: "settled payments",
              }}
            />

            <OverviewCard
              title="Pending Payments"
              value={summary.pendingCount.toString()}
              subtext="Awaiting payer completion"
              icon={Clock}
              iconColor="text-amber-600"
              iconBg="bg-amber-50 border-amber-100"
              trend={{
                value: `${summary.pendingCount} pending`,
                isNeutral: true,
              }}
            />

            <OverviewCard
              title="Failed Payments"
              value={summary.failedCount.toString()}
              subtext="Rejected or expired"
              icon={XCircle}
              iconColor="text-rose-600"
              iconBg="bg-rose-50 border-rose-100"
              trend={{
                value: `${summary.failedCount} failed`,
                isNeutral: true,
                label: "failed rate",
              }}
            />
          </div>

          {/* Recent Payments Section with Professional Empty State */}
          <RecentPayments
            payments={payments}
            onCreatePayment={handleCreatePayment}
            onViewPayment={handleViewPayment}
            onSelectSection={setCurrentSection}
          />
        </div>
      )}

      {/* 3B. PAYMENTS SECTION */}
      {currentSection === "payments" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <PageHeader
              title="Payments Ledger"
              description="Complete history of customer payments settled to your Polygon address."
            />
            <Link href="/dashboard/payments">
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
              >
                <span>Open Full Ledger</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <RecentPayments
            payments={payments}
            onCreatePayment={handleCreatePayment}
            onViewPayment={handleViewPayment}
            onSelectSection={setCurrentSection}
          />
        </div>
      )}

      {/* 3C. INVOICES SECTION */}
      {currentSection === "invoices" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <PageHeader
              title="Invoices"
              description="Create itemized payment requests with customer information and due dates."
            />
            <Link href="/dashboard/invoices/new">
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Invoice</span>
              </Button>
            </Link>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center space-y-3">
            <FileText className="w-10 h-10 text-indigo-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Manage Your Invoices</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Track invoices, generate Web3 checkout links, and view real-time settlement status.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/dashboard/invoices">
                <Button variant="outline" size="sm" className="text-xs font-semibold">
                  View All Invoices
                </Button>
              </Link>
              <Link href="/dashboard/invoices/new">
                <Button variant="primary" size="sm" className="text-xs font-semibold">
                  Create New Invoice
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3D. PAYMENT LINKS SECTION */}
      {currentSection === "links" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <PageHeader
              title="Payment Links & Invoices"
              description="Shareable Web3 checkout links and QR codes for seamless Polygon settlements."
            />
            <Link href="/dashboard/invoices/new">
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs font-semibold self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Payment Invoice</span>
              </Button>
            </Link>
          </div>

          <EmptyState
            icon={Link2}
            title="Create your first payment checkout"
            description="Every invoice automatically generates a secure public Web3 payment link with QR code and Polygon token settlement."
            actionLabel="Create Invoice Checkout"
            onAction={handleCreateInvoice}
          />
        </div>
      )}

      {/* 3E. TRANSACTIONS SECTION */}
      {currentSection === "transactions" && (
        <div className="space-y-6">
          <PageHeader
            title="Polygon Transactions"
            description="Direct on-chain transaction records associated with your receiving address."
          />

          <RecentPayments
            payments={payments}
            onCreatePayment={handleCreatePayment}
            onViewPayment={handleViewPayment}
            onSelectSection={setCurrentSection}
          />
        </div>
      )}

      {/* 3F. RECEIPTS SECTION */}
      {currentSection === "receipts" && (
        <div className="space-y-6">
          <PageHeader
            title="Payment Receipts"
            description="Search, view, and share customer receipts with verified Polygon settlement references."
          />

          <EmptyState
            icon={ShieldCheck}
            title="No receipts generated yet"
            description="Every completed payment automatically creates a permanent, itemized receipt URL that can be shared with payers."
          />
        </div>
      )}

      {/* 3G. SETTINGS SECTION */}
      {currentSection === "settings" && (
        <div className="space-y-6 max-w-3xl">
          <PageHeader
            title="Merchant Settings"
            description="Configure your payout wallet, business profile, and settlement preferences."
          />

          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center space-y-3">
            <Settings className="w-10 h-10 text-indigo-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Merchant Settings & Profile</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Manage your business profile name, Polygon receiving address, webhook preferences, and payout notifications.
            </p>
            <div className="pt-2">
              <Link href="/dashboard/settings">
                <Button variant="primary" size="sm" className="text-xs font-semibold">
                  Open Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}

export default function MerchantDashboardPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 text-sm font-medium antialiased font-sans">
        Loading workspace dashboard...
      </div>
    }>
      <MerchantDashboardPageContent />
    </React.Suspense>
  )
}
