"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"
import { InvoiceDetailSkeleton } from "@/components/invoices/invoice-detail-skeleton"
import { InvoiceDetailError } from "@/components/invoices/invoice-detail-error"
import { Invoice } from "@/types/invoice"

export default function InvoiceDetailPage() {
  const params = useParams()
  const rawId = params?.id
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : ""

  const [invoice, setInvoice] = React.useState<Invoice | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [errorStatus, setErrorStatus] = React.useState<number | undefined>(undefined)
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined)
  const [refreshKey, setRefreshKey] = React.useState(0)

  React.useEffect(() => {
    let isMounted = true

    async function loadInvoice() {
      if (!id) {
        setIsLoading(false)
        setErrorStatus(400)
        setErrorMessage("Invalid invoice ID.")
        return
      }

      setIsLoading(true)
      setErrorStatus(undefined)
      setErrorMessage(undefined)

      try {
        const res = await fetch(`/api/invoices/${encodeURIComponent(id)}`)
        const data = await res.json()

        if (!isMounted) return

        if (!res.ok || !data.ok) {
          setErrorStatus(res.status)
          setErrorMessage(data.message || "Failed to load invoice.")
          setInvoice(null)
          return
        }

        setInvoice(data.invoice || null)
      } catch (err) {
        if (!isMounted) return
        setErrorStatus(500)
        setErrorMessage(err instanceof Error ? err.message : "Unable to retrieve invoice.")
        setInvoice(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInvoice()

    return () => {
      isMounted = false
    }
  }, [id, refreshKey])

  return (
    <DashboardShell
      currentSection="invoices"
      onSelectSection={() => {}}
      currentSectionTitle={invoice ? `Invoice ${invoice.invoiceNumber}` : "Invoice Detail"}
    >
      {isLoading ? (
        <InvoiceDetailSkeleton />
      ) : errorStatus || !invoice ? (
        <InvoiceDetailError
          status={errorStatus || 404}
          message={errorMessage}
          onRetry={() => setRefreshKey((k) => k + 1)}
        />
      ) : (
        <InvoiceDetail
          invoice={invoice}
          onInvoiceUpdated={(updated) => setInvoice(updated)}
        />
      )}
    </DashboardShell>
  )
}
