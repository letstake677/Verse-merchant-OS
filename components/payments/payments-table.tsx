"use client"

import * as React from "react"
import Link from "next/link"
import { ExternalLink, Eye, MoreHorizontal, ArrowUpRight, ShieldCheck } from "lucide-react"
import { Payment } from "@/types/payment"
import { StatusBadge } from "@/components/ui/status-badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { PaymentsEmptyState } from "@/components/payments/payments-empty-state"

interface PaymentsTableProps {
  payments: Payment[]
  onViewPayment?: (payment: Payment) => void
  onCreatePayment?: () => void
  onLearnMore?: () => void
  className?: string
}

export function PaymentsTable({
  payments,
  onViewPayment,
  onCreatePayment,
  onLearnMore,
  className,
}: PaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <PaymentsEmptyState
            onCreatePayment={onCreatePayment}
            onLearnMore={onLearnMore}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold">Payments Ledger</CardTitle>
          <CardDescription className="text-xs">
            Showing {payments.length} recorded payments
          </CardDescription>
        </div>
      </CardHeader>

      {/* Desktop Ledger Table (md and up) */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Payment</TableHead>
              <TableHead>Customer / Reference</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50/70 transition-colors">
                {/* Payment ID */}
                <TableCell className="font-mono text-xs font-semibold text-slate-800">
                  {p.id}
                </TableCell>

                {/* Customer / Reference */}
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-900">
                      {p.customerName || p.reference || "Direct Payment"}
                    </p>
                    {p.customerEmail && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        {p.customerEmail}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell className="font-semibold text-slate-900 font-tabular text-xs">
                  {p.amount} {p.currency}
                  {p.fiatAmount && (
                    <span className="block text-[10px] text-slate-400 font-normal font-sans">
                      ≈ {p.fiatAmount}
                    </span>
                  )}
                </TableCell>

                {/* Asset & PolygonScan Link */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[11px] font-mono py-0 px-2 text-slate-700 bg-slate-50">
                      {p.token?.symbol || p.asset || "POL"}
                    </Badge>
                    {p.transactionHash && (
                      <a
                        href={`https://polygonscan.com/tx/${p.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                        title="View transaction on PolygonScan"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={p.status} size="sm" />
                </TableCell>

                {/* Created Date */}
                <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                  {p.createdAt}
                </TableCell>

                {/* Action */}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewPayment?.(p)}
                    className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 gap-1.5"
                    title={`View payment ${p.id}`}
                  >
                    <span>View</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden divide-y divide-slate-100">
        {payments.map((p) => (
          <div
            key={p.id}
            className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-semibold text-slate-700 block">
                  {p.id}
                </span>
                <p className="text-xs font-semibold text-slate-900 mt-0.5">
                  {p.customerName || p.reference || "Direct Payment"}
                </p>
              </div>
              <StatusBadge status={p.status} size="sm" />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Amount</span>
                <span className="font-semibold text-slate-900 font-tabular">
                  {p.amount} {p.currency}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Asset</span>
                <span className="font-mono text-slate-700 font-medium">{p.asset}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Created</span>
                <span className="text-slate-500">{p.createdAt}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onViewPayment?.(p)}
                className="w-full h-8 text-xs font-medium gap-1.5 justify-center"
              >
                <span>View Details</span>
                <ArrowUpRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
