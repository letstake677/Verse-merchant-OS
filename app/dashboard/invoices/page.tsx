"use client"

export const dynamic = "force-dynamic"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InvoiceHeader } from "@/components/invoices/invoice-header"
import { InvoiceSummary } from "@/components/invoices/invoice-summary"
import { InvoiceFilters } from "@/components/invoices/invoice-filters"
import { InvoiceTable } from "@/components/invoices/invoice-table"
import { Invoice, InvoiceFiltersState } from "@/types/invoice"
import { InvoiceSummaryMetrics } from "@/types/invoice-document"
import { useToast } from "@/components/ui/toast"

export default function InvoicesPage() {
  const { toast } = useToast()

  // Real invoices state from MongoDB
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const [summary, setSummary] = React.useState<InvoiceSummaryMetrics>({
    totalInvoices: 0,
    draftCount: 0,
    outstandingAmount: "$0.00",
    paidAmount: "$0.00",
  })

  const [filters, setFilters] = React.useState<InvoiceFiltersState>({
    search: "",
    status: "all",
    dateRange: "all",
    customer: "",
  })

  const [currentPage, setCurrentPage] = React.useState(1)

  const [refreshIndex, setRefreshIndex] = React.useState(0)

  // Trigger query on page, filter, or retry change
  React.useEffect(() => {
    let isMounted = true

    async function loadInvoices() {
      setIsLoading(true)
      setError(null)

      try {
        const searchTerms = [filters.search, filters.customer].filter(Boolean).join(" ").trim()
        const params = new URLSearchParams()
        params.set("page", currentPage.toString())
        params.set("limit", "20")

        if (searchTerms) {
          params.set("search", searchTerms)
        }
        if (filters.status && filters.status !== "all") {
          params.set("status", filters.status)
        }
        if (filters.dateRange && filters.dateRange !== "all") {
          params.set("dateRange", filters.dateRange)
        }

        const res = await fetch(`/api/invoices?${params.toString()}`)
        const data = await res.json()

        if (!isMounted) return

        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Failed to load invoices from database.")
        }

        setInvoices(data.invoices || [])
        if (data.pagination) {
          setPagination(data.pagination)
        }
        if (data.summary) {
          setSummary(data.summary)
        }
      } catch (err) {
        if (!isMounted) return
        const msg = err instanceof Error ? err.message : "Failed to load invoices."
        setError(msg)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInvoices()

    return () => {
      isMounted = false
    }
  }, [filters, currentPage, refreshIndex])

  // Handle filter changes (resets page to 1)
  const handleFiltersChange = (newFilters: InvoiceFiltersState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "all",
      dateRange: "all",
      customer: "",
    })
    setCurrentPage(1)
  }

  const handleRetry = () => {
    setRefreshIndex((prev) => prev + 1)
  }

  const handleLearnMore = () => {
    toast({
      title: "How Verse Invoices Work",
      description:
        "Create an invoice with itemized services or goods. Send the link to your customer to accept Polygon Verse payment and receive an instant cryptographic receipt.",
      type: "info",
    })
  }

  const handleViewInvoice = (invoice: Invoice) => {
    toast({
      title: `Invoice ${invoice.invoiceNumber}`,
      description: `Customer: ${invoice.customerName || "Not provided"} • Total: ${invoice.total} ${invoice.currency}`,
      type: "info",
    })
  }

  return (
    <DashboardShell
      currentSection="invoices"
      onSelectSection={() => {}}
      currentSectionTitle="Invoices"
    >
      {/* Invoices Header */}
      <InvoiceHeader />

      {/* 3. Summary Cards (Calculated deterministically from real MongoDB data) */}
      <InvoiceSummary
        totalInvoices={summary.totalInvoices}
        draftCount={summary.draftCount}
        outstandingAmount={summary.outstandingAmount}
        paidAmount={summary.paidAmount}
      />

      {/* 4. Filter Toolbar */}
      <InvoiceFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Invoices Table / Empty State / Loading / Error */}
      <InvoiceTable
        invoices={invoices}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
        pagination={pagination}
        onPageChange={(page) => setCurrentPage(page)}
        onLearnMore={handleLearnMore}
        onViewInvoice={handleViewInvoice}
      />
    </DashboardShell>
  )
}
