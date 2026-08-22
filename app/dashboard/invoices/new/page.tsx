"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { InvoiceBuilder } from "@/components/invoices/invoice-builder"

export default function NewInvoicePage() {
  return (
    <DashboardShell
      currentSection="invoices"
      onSelectSection={() => {}}
      currentSectionTitle="Create Invoice"
    >
      <InvoiceBuilder />
    </DashboardShell>
  )
}
