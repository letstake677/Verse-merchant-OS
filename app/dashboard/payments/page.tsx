"use client"

export const dynamic = "force-dynamic"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PaymentsHeader } from "@/components/payments/payments-header"
import { PaymentSummary } from "@/components/payments/payment-summary"
import { PaymentFilters } from "@/components/payments/payment-filters"
import { PaymentsTable } from "@/components/payments/payments-table"
import { PaymentDetailModal } from "@/components/payments/payment-detail-modal"
import { Payment, PaymentFiltersState, PaymentSummaryMetrics } from "@/types/payment"
import { useToast } from "@/components/ui/toast"

export default function PaymentsPage() {
  const { toast } = useToast()

  const [payments, setPayments] = React.useState<Payment[]>([])
  const [summary, setSummary] = React.useState<PaymentSummaryMetrics>({
    totalVolume: "$0.00",
    totalCount: 0,
    confirmedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    underpaidCount: 0,
    overpaidCount: 0,
  })
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [reloadTrigger, setReloadTrigger] = React.useState<number>(0)

  // Selected payment for detail modal
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState<boolean>(false)

  const [filters, setFilters] = React.useState<PaymentFiltersState>({
    search: "",
    status: "all",
    dateRange: "all",
    asset: "all",
  })

  // Load real payments from server
  React.useEffect(() => {
    let isMounted = true
    const fetchPayments = async () => {
      try {
        const params = new URLSearchParams()
        if (filters.status && filters.status !== "all") params.set("status", filters.status)
        if (filters.asset && filters.asset !== "all") params.set("token", filters.asset)
        if (filters.search) params.set("search", filters.search)
        if (filters.dateRange && filters.dateRange !== "all") params.set("dateRange", filters.dateRange)

        const res = await fetch(`/api/payments?${params.toString()}`)
        const data = await res.json()

        if (isMounted && res.ok && data.ok) {
          setPayments(data.payments || [])
          if (data.summary) {
            setSummary(data.summary)
          }
        }
      } catch (err) {
        console.error("[PaymentsPage] Failed to fetch payments:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchPayments()
    return () => {
      isMounted = false
    }
  }, [filters, reloadTrigger])

  const handleCreatePayment = () => {
    toast({
      title: "Create Payment Intent",
      description: "Payment intents are created when generating an invoice or sharing a payment checkout link.",
      type: "info",
    })
  }

  const handleLearnMore = () => {
    toast({
      title: "Verse Merchant Settlement Engine",
      description:
        "Payments are executed directly on-chain via Polygon Web3 transfers. All transactions are authoritatively verified against Polygon RPC before settling.",
      type: "info",
    })
  }

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailModalOpen(true)
  }

  const handleRefresh = () => {
    setReloadTrigger((prev) => prev + 1)
    toast({
      title: "Ledger Refreshed",
      description: "Latest merchant payment records fetched from server.",
      type: "info",
    })
  }

  return (
    <DashboardShell
      currentSection="payments"
      onSelectSection={() => {}}
      currentSectionTitle="Payments"
    >
      {/* Payments Header */}
      <PaymentsHeader onCreatePayment={handleCreatePayment} />

      {/* 3. Summary Cards */}
      <PaymentSummary
        totalAmount={summary.totalVolume}
        totalCount={summary.totalCount}
        successfulCount={summary.confirmedCount}
        pendingCount={summary.pendingCount}
        failedCount={summary.failedCount}
        underpaidCount={summary.underpaidCount}
        overpaidCount={summary.overpaidCount}
      />

      {/* 4. Filter Toolbar */}
      <PaymentFilters
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* 5. Payments Table / Empty State */}
      <PaymentsTable
        payments={payments}
        onCreatePayment={handleCreatePayment}
        onLearnMore={handleLearnMore}
        onViewPayment={handleViewPayment}
      />

      {/* 6. Payment Detail Experience Modal */}
      <PaymentDetailModal
        paymentId={selectedPayment?.id || null}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedPayment(null)
        }}
        onReconciled={() => {
          setReloadTrigger((prev) => prev + 1)
        }}
      />
    </DashboardShell>
  )
}
