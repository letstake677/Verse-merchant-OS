"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { Invoice } from "@/types/invoice"
import { StatusBadge } from "@/components/ui/status-badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { InvoiceEmptyState } from "@/components/invoices/invoice-empty-state"
import { Skeleton } from "@/components/ui/skeleton"

interface InvoiceTableProps {
  invoices: Invoice[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onViewInvoice?: (invoice: Invoice) => void
  onCreateInvoice?: () => void
  onLearnMore?: () => void
  className?: string
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "—"
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function InvoiceTable({
  invoices,
  isLoading = false,
  error = null,
  onRetry,
  pagination,
  onPageChange,
  onViewInvoice,
  onCreateInvoice,
  onLearnMore,
  className,
}: InvoiceTableProps) {
  // Error state
  if (error) {
    const isAuthError =
      error.toLowerCase().includes("auth") ||
      error.toLowerCase().includes("unauthorized") ||
      error.toLowerCase().includes("session")

    return (
      <Card className={className} id="invoices-error-card">
        <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {isAuthError ? "Sign In Required to View Invoices" : "Unable to load invoices"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            {isAuthError
              ? "Please authenticate with your Web3 wallet to access and manage your invoices."
              : error}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isAuthError ? (
              <Link href="/login">
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs font-medium h-9 px-5"
                  id="go-to-login-button"
                >
                  <span>Sign In with Wallet</span>
                </Button>
              </Link>
            ) : (
              onRetry && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onRetry}
                  className="gap-2 text-xs font-semibold h-9 px-4 text-slate-700"
                  id="retry-fetch-invoices-button"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className={className} id="invoices-loading-card">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
        </CardHeader>

        {/* Desktop Skeleton */}
        <div className="hidden md:block p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-50">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Mobile Skeleton */}
        <div className="md:hidden p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  // Empty state
  if (invoices.length === 0) {
    return (
      <Card className={className} id="invoices-empty-card">
        <CardContent className="p-6">
          <InvoiceEmptyState
            onCreateInvoice={onCreateInvoice}
            onLearnMore={onLearnMore}
          />
        </CardContent>
      </Card>
    )
  }

  const hasPagination = pagination && pagination.totalPages > 1

  return (
    <Card className={className} id="invoices-table-card">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">Invoices</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            {pagination
              ? `Showing ${invoices.length} of ${pagination.total} invoice${pagination.total === 1 ? "" : "s"}`
              : `Showing ${invoices.length} issued invoices`}
          </CardDescription>
        </div>
      </CardHeader>

      {/* Desktop Invoices Table (md and up) */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                {/* Invoice Number */}
                <TableCell className="font-mono text-xs font-semibold text-slate-800">
                  {inv.invoiceNumber}
                </TableCell>

                {/* Customer */}
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-900">
                      {inv.customerName || "Unnamed Customer"}
                    </p>
                    {inv.customerEmail ? (
                      <p className="text-[11px] text-slate-400 font-mono">
                        {inv.customerEmail}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Not provided
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell className="font-semibold text-slate-900 font-tabular text-xs">
                  {inv.total} {inv.currency}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={inv.status} size="sm" />
                </TableCell>

                {/* Due Date */}
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {inv.dueDate || "Due on receipt"}
                </TableCell>

                {/* Created Date */}
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {formatDisplayDate(inv.createdAt)}
                </TableCell>

                {/* Action */}
                <TableCell className="text-right">
                  <Link href={`/dashboard/invoices/${inv.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewInvoice?.(inv)}
                      className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 gap-1.5"
                      title={`View invoice ${inv.invoiceNumber}`}
                    >
                      <span>View</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden divide-y divide-slate-100">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-semibold text-slate-700 block">
                  {inv.invoiceNumber}
                </span>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">
                  {inv.customerName || "Unnamed Customer"}
                </p>
                {inv.customerEmail && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    {inv.customerEmail}
                  </p>
                )}
              </div>
              <StatusBadge status={inv.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Amount</span>
                <span className="font-semibold text-slate-900 font-tabular">
                  {inv.total} {inv.currency}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Due Date</span>
                <span className="text-slate-600 font-medium">
                  {inv.dueDate || "Due on receipt"}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link href={`/dashboard/invoices/${inv.id}`} className="w-full">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewInvoice?.(inv)}
                  className="w-full h-8 text-xs font-medium gap-1.5 justify-center"
                >
                  <span>View Invoice</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      {hasPagination && (
        <div className="p-3 sm:p-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
