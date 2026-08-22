"use client"

import * as React from "react"
import Link from "next/link"
import {
  Coins,
  FileText,
  ExternalLink,
  Eye,
  ArrowRight,
  Filter,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { StatusBadge, PaymentOrInvoiceStatus } from "@/components/ui/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Badge } from "@/components/ui/badge"

export interface PaymentItem {
  id: string
  reference: string
  customerName: string
  customerEmail?: string
  amount: string
  asset: string
  status: PaymentOrInvoiceStatus
  date: string
  txHash?: string
}

interface RecentPaymentsProps {
  payments?: PaymentItem[]
  onCreatePayment?: () => void
  onViewPayment?: (payment: PaymentItem) => void
  onSelectSection?: (sectionId: string) => void
  className?: string
}

export function RecentPayments({
  payments = [],
  onCreatePayment,
  onViewPayment,
  onSelectSection,
  className,
}: RecentPaymentsProps) {
  const hasPayments = payments.length > 0

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4">
        <div>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            On-chain Verse payments settled directly to your receiving Polygon address
          </CardDescription>
        </div>

        {hasPayments && (
          <div className="flex items-center gap-2">
            <Link href="/dashboard/payments">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-indigo-600 hover:text-indigo-700 h-8"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {!hasPayments ? (
          <div className="p-6 sm:p-10">
            <EmptyState
              icon={Coins}
              title="No payments received yet"
              description="When a customer pays an invoice or completes a payment link, the verified transaction will automatically appear here."
              actionLabel="Create Payment"
              onAction={onCreatePayment}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Payment ID</TableHead>
                  <TableHead>Customer / Ref</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-slate-50/70">
                    <TableCell className="font-mono text-xs font-semibold text-slate-900">
                      {payment.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar fallback={payment.customerName} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {payment.customerName}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            {payment.reference}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 font-tabular text-xs">
                      {payment.amount}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        {payment.asset}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {payment.date}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewPayment?.(payment)}
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        <span>View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
