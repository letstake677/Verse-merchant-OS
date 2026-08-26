"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InvoiceBuilder } from "@/components/invoices/invoice-builder"

export default function NewInvoicePage() {
  const router = useRouter()

  return (
    <DashboardShell
      currentSection="invoices"
      onSelectSection={() => {}}
      currentSectionTitle="Create Invoice"
    >
      <InvoiceBuilder
        isOpen={true}
        onClose={() => router.push("/dashboard/invoices")}
        onCreated={(inv) => router.push(`/pay/${inv.id}`)}
      />
    </DashboardShell>
  )
}
