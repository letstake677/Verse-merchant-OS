"use client"

import * as React from "react"
import { Invoice } from "@/lib/invoices/types"
import { ExternalLink, CreditCard, QrCode, ArrowUpRight, CheckCircle2, Clock } from "lucide-react"

interface InvoiceTableProps {
  invoices: Invoice[]
  onSelectInvoice: (invoice: Invoice) => void
  onPayInvoice: (invoice: Invoice) => void
  onQrInvoice: (invoice: Invoice) => void
}

export function InvoiceTable({
  invoices,
  onSelectInvoice,
  onPayInvoice,
  onQrInvoice,
}: InvoiceTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-5">Invoice</th>
              <th className="py-3.5 px-5">Customer</th>
              <th className="py-3.5 px-5">Due Date</th>
              <th className="py-3.5 px-5">Total</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {invoices.map((invoice) => {
              const isPaid = invoice.status === "paid"
              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectInvoice(invoice)}
                >
                  <td className="py-4 px-5 font-semibold text-slate-900 flex items-center gap-2">
                    <span>{invoice.invoiceNumber}</span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-medium text-slate-900">{invoice.customerName}</div>
                    <div className="text-xs text-slate-400">{invoice.customerEmail}</div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 font-mono text-xs">{invoice.dueDate}</td>
                  <td className="py-4 px-5">
                    <div className="font-bold text-slate-900 font-mono">
                      ${invoice.total} <span className="text-xs font-normal text-slate-400">{invoice.currency}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        isPaid
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-amber-50 text-amber-700 border border-amber-200/60"
                      }`}
                    >
                      {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {isPaid ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onQrInvoice(invoice)}
                        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors title='QR Code'"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onPayInvoice(invoice)}
                        disabled={isPaid}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isPaid
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {isPaid ? "Settled" : "Pay Crypto"}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
