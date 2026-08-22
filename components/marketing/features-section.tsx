"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  FileText,
  Link2,
  QrCode,
  ShieldCheck,
  Receipt,
  LayoutDashboard,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function FeaturesSection() {
  const [copiedLink, setCopiedLink] = React.useState(false)

  const handleCopyLink = () => {
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <section
      id="features"
      className="py-16 sm:py-24 border-t border-slate-200/80 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span>Core Capabilities</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Everything you need to get paid.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            From the first payment request to the final receipt, Verse Merchant OS gives merchants a simple workflow for accepting Verse payments.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* FEATURE 01: Invoices */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <Card className="h-full border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                      Invoices
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-1">
                      Create professional payment requests with customer details, line items, amounts, and due dates.
                    </p>
                  </div>
                </div>

                {/* Mini Invoice Preview */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2 select-none">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>INV-2026-084</span>
                    <span className="font-semibold text-slate-900 font-tabular">$240.00</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-100 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-medium text-slate-800 truncate">Brand Identity Scope</span>
                      <span className="text-slate-400 font-mono text-[10px]">Due Aug 30</span>
                    </div>
                    <p className="text-[10px] text-slate-400">client@novacorp.io</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FEATURE 02: Payment Links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <Card className="h-full border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Link2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                      Payment Links
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-1">
                      Create a shareable payment page and send it directly to your customer.
                    </p>
                  </div>
                </div>

                {/* Mini Link Card with Copy Action */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 select-none">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                    <span className="font-mono text-slate-600 text-[11px] truncate mr-2">
                      verse.os/pay/acme-design
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                      aria-label="Copy payment link"
                    >
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">
                    Share via email, chat, or social
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FEATURE 03: QR Payments */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <Card className="h-full border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                    <QrCode className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                      QR Payments
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-1">
                      Let customers scan a QR code to open the payment experience instantly.
                    </p>
                  </div>
                </div>

                {/* Clean QR Visual Representation */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 select-none">
                  {/* Stylized QR Box Grid */}
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg p-1.5 grid grid-cols-4 gap-0.5 shrink-0">
                    <div className="bg-slate-900 rounded-xs col-span-2 row-span-2" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-300 rounded-xs" />
                    <div className="bg-slate-300 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                    <div className="bg-slate-300 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs col-span-2 row-span-2" />
                    <div className="bg-slate-300 rounded-xs" />
                    <div className="bg-slate-900 rounded-xs" />
                  </div>

                  <div className="text-left space-y-0.5 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800">Scan & Pay</p>
                    <p className="text-[10px] text-slate-400">Compatible with Web3 mobile wallets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FEATURE 04: Verified Payments */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <Card className="h-full border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                      Verified Payments
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-1">
                      Track payment status through transaction verification instead of relying on manual confirmation.
                    </p>
                  </div>
                </div>

                {/* Payment Status Progression: Pending -> Verifying -> Paid */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 select-none">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                      Pending
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Verifying
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Paid
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center font-mono">
                    Tracked on Polygon ledger
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FEATURE 05: Beautiful Receipts (Signature emphasis) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: 0.25 }}
          >
            <Card className="h-full border-indigo-200 bg-gradient-to-b from-indigo-50/30 to-white hover:border-indigo-300 transition-all flex flex-col justify-between shadow-xs relative">
              {/* Signature badge */}
              <div className="absolute top-4 right-4">
                <Badge variant="verse" className="text-[10px] py-0 px-2">
                  Signature Feature
                </Badge>
              </div>

              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Receipt className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                      Beautiful Receipts
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-1">
                      Give every customer a professional, shareable receipt after a verified payment.
                    </p>
                  </div>
                </div>

                {/* Mini Receipt Preview */}
                <div className="p-3 rounded-xl bg-white border border-indigo-100 shadow-2xs text-xs space-y-1.5 select-none font-mono">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100 font-sans">
                    <span className="font-semibold text-slate-900 text-[11px]">PAYMENT RECEIPT</span>
                    <span className="text-emerald-600 font-bold text-[10px]">PAID</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Total Settled</span>
                    <span className="text-slate-900 font-bold font-tabular">$150.00</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Asset</span>
                    <span className="text-indigo-600 font-semibold">VERSE</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* FEATURE 06: Merchant Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: 0.3 }}
          >
            <Card className="h-full border-slate-200/90 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs">
              <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <LayoutDashboard className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                      Merchant Dashboard
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-1">
                      Manage payments, invoices, customers, and business activity from one clean workspace.
                    </p>
                  </div>
                </div>

                {/* Mini Dashboard Workspace Preview */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 select-none">
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                      <p className="text-[9px] text-slate-400 font-medium">Revenue</p>
                      <p className="text-[11px] font-bold text-slate-900 font-tabular">$4.2K</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                      <p className="text-[9px] text-slate-400 font-medium">Payments</p>
                      <p className="text-[11px] font-bold text-slate-900 font-tabular">48</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white border border-slate-100">
                      <p className="text-[9px] text-slate-400 font-medium">Invoices</p>
                      <p className="text-[11px] font-bold text-slate-900 font-tabular">12</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
