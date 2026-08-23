"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  TrendingUp,
  Coins,
  FileText,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Link2,
  BarChart3,
  Settings,
  ArrowUpRight,
} from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, PaymentOrInvoiceStatus } from "@/components/ui/status-badge"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function ProductPreviewSection() {
  const samplePayments = [
    {
      id: "p1",
      customer: "ACME Design Co.",
      invoice: "INV-1024",
      amount: "$150.00",
      status: "paid" as PaymentOrInvoiceStatus,
      date: "Aug 19",
      asset: "Verse",
    },
    {
      id: "p2",
      customer: "Studio North",
      invoice: "INV-1025",
      amount: "$320.00",
      status: "paid" as PaymentOrInvoiceStatus,
      date: "Aug 19",
      asset: "Verse",
    },
    {
      id: "p3",
      customer: "Nova Creative",
      invoice: "INV-1026",
      amount: "$85.00",
      status: "pending" as PaymentOrInvoiceStatus,
      date: "Aug 18",
      asset: "Verse",
    },
  ]

  const chartBars = [
    { label: "Mon", height: "45%" },
    { label: "Tue", height: "65%" },
    { label: "Wed", height: "50%" },
    { label: "Thu", height: "85%" },
    { label: "Fri", height: "70%" },
    { label: "Sat", height: "90%" },
    { label: "Sun", height: "60%" },
  ]

  return (
    <section className="py-16 sm:py-24 border-t border-slate-200/80 bg-[#f8fafc] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
            <span>Unified Workspace</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Your payment business, in one place.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            From invoices to completed payments, see what is happening across your business without digging through blockchain explorers.
          </p>
        </div>

        {/* Large Application Window Frame */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="max-w-6xl mx-auto"
        >
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08),0_4px_16px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Top Browser Window Header */}
            <div className="h-10 bg-slate-100/90 border-b border-slate-200 px-4 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>

              {/* URL bar */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200/80 text-[11px] font-mono text-slate-500 max-w-xs w-full justify-center">
                <span className="text-slate-400">https://</span>
                <span className="text-slate-700 font-medium">app.versemerchant.os</span>
                <span className="text-slate-400">/overview</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-emerald-700 bg-emerald-50 border-emerald-200">
                  Polygon Connected
                </Badge>
              </div>
            </div>

            {/* Application Mockup Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
              {/* Left Sidebar (Desktop Only) */}
              <div className="hidden md:block md:col-span-3 lg:col-span-2.5 border-r border-slate-100 bg-[#fbfcfd] p-4 space-y-6">
                <div className="flex items-center gap-2 px-2 py-1">
                  <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                    V
                  </div>
                  <span className="font-bold text-xs tracking-tight text-slate-900">
                    VERSE OS
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="px-2.5 py-1.5 rounded-lg bg-indigo-50 font-semibold text-indigo-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span>Overview</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payments</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Invoices</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payment Links</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customers</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Analytics</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Settings</span>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="md:col-span-9 lg:col-span-9.5 p-4 sm:p-6 lg:p-7 space-y-6 bg-white">
                {/* Greeting Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      Good morning, Alex
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live Verse merchant settlement summary on Polygon
                    </p>
                  </div>
                  <Badge variant="verse" className="self-start sm:self-auto text-xs py-0.5 px-2.5">
                    Live Settlement
                  </Badge>
                </div>

                {/* Stat Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-1">
                    <p className="text-[11px] font-medium text-slate-500">Total Revenue</p>
                    <p className="text-base sm:text-xl font-bold text-slate-900 font-tabular">$4,280.00</p>
                    <p className="text-[10px] text-emerald-600 font-medium">+18.4% this mo.</p>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-1">
                    <p className="text-[11px] font-medium text-slate-500">Payments</p>
                    <p className="text-base sm:text-xl font-bold text-slate-900 font-tabular">48</p>
                    <p className="text-[10px] text-emerald-600 font-medium">All settled</p>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-1">
                    <p className="text-[11px] font-medium text-slate-500">Pending</p>
                    <p className="text-base sm:text-xl font-bold text-slate-900 font-tabular">6</p>
                    <p className="text-[10px] text-slate-400">Awaiting payer</p>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-1">
                    <p className="text-[11px] font-medium text-slate-500">Customers</p>
                    <p className="text-base sm:text-xl font-bold text-slate-900 font-tabular">32</p>
                    <p className="text-[10px] text-indigo-600 font-medium">Active accounts</p>
                  </div>
                </div>

                {/* Mini Revenue Chart Placeholder */}
                <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Weekly Payment Volume</span>
                    <span className="font-mono text-slate-500 text-[11px]">7-Day Trend</span>
                  </div>

                  {/* Visual Chart Bars */}
                  <div className="h-24 flex items-end justify-between gap-2 sm:gap-4 pt-2">
                    {chartBars.map((bar, i) => (
                      <div key={bar.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div
                          className={cn(
                            "w-full rounded-t-sm transition-all",
                            i === 5 ? "bg-indigo-600" : "bg-indigo-200"
                          )}
                          style={{ height: bar.height }}
                        />
                        <span className="text-[10px] text-slate-400 font-mono">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Payments Table Mockup */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Recent Transactions</span>
                    <span className="text-[11px] text-slate-400 font-mono">Live Polygon Verification</span>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Invoice</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {samplePayments.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-2">
                              <Avatar fallback={row.customer} size="sm" />
                              <span className="truncate">{row.customer}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                              {row.invoice}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900 font-tabular">
                              {row.amount}
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge status={row.status} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                              {row.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
