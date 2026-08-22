"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  Copy,
  Search,
  HelpCircle,
  CheckCircle2,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  XCircle,
  FileCheck2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function ProblemSection() {
  const problems = [
    {
      number: "01",
      title: "Wallet complexity",
      description:
        "Asking customers to manually copy wallet addresses, switch network RPCs, and figure out where or how to pay creates immediate drop-off and friction.",
      icon: XCircle,
      iconColor: "text-rose-500",
      bgLight: "bg-rose-50/50",
      borderLight: "border-rose-100",
    },
    {
      number: "02",
      title: "Manual verification",
      description:
        "Merchants need instant confidence that a payment has settled, rather than constantly refreshing blockchain explorers and checking transaction hashes.",
      icon: Search,
      iconColor: "text-amber-500",
      bgLight: "bg-amber-50/50",
      borderLight: "border-amber-100",
    },
    {
      number: "03",
      title: "No business-ready receipt",
      description:
        "A successful crypto transaction should result in a clean, professional receipt for client accounting rather than a raw block explorer page.",
      icon: Receipt,
      iconColor: "text-indigo-500",
      bgLight: "bg-indigo-50/50",
      borderLight: "border-indigo-100",
    },
  ]

  return (
    <section
      id="product"
      className="py-16 sm:py-24 border-t border-slate-200/80 bg-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span>The Traditional Gap</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Crypto payments shouldn&apos;t feel complicated.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Merchants shouldn&apos;t have to understand wallet addresses, transaction hashes, blockchain explorers, and manual payment verification just to get paid.
          </p>
        </div>

        {/* Visual Contrast: Traditional vs Verse Merchant OS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4 }}
          className="mb-14 sm:mb-18"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto">
            {/* Traditional experience */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Traditional Crypto Payment
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-200 text-slate-700">
                  High Friction
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-slate-500 flex items-center justify-between">
                  <span className="truncate">0x8f3C78B...91ac</span>
                  <span className="text-[11px] text-slate-400 font-sans flex items-center gap-1 shrink-0 ml-2">
                    <Copy className="w-3 h-3" /> Copy Address
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Search className="w-3.5 h-3.5 text-slate-400" /> Check Explorer
                  </span>
                  <span className="text-[11px] font-mono text-amber-600">Pending Block...</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-100/90 border border-dashed border-slate-300 text-slate-500 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Did payment arrive?
                  </span>
                  <span className="text-[11px] italic text-slate-400">Manual Check Required</span>
                </div>
              </div>
            </div>

            {/* Verse Merchant OS experience */}
            <div className="rounded-2xl border border-indigo-200/90 bg-indigo-50/40 p-5 sm:p-6 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold font-mono">
                    V
                  </div>
                  <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    Verse Merchant OS
                  </span>
                </div>
                <Badge variant="verse" className="text-[11px] py-0">
                  Zero Friction
                </Badge>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Invoice #1024</span>
                  <span className="font-bold text-slate-900 font-tabular">$150.00</span>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Verified on Polygon
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700">Instant Settlement</span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-indigo-700">
                    <FileCheck2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    Customer Receipt Ready
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Shareable URL</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Three Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((problem, idx) => {
            const Icon = problem.icon
            return (
              <motion.div
                key={problem.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
              >
                <Card className="h-full border-slate-200/90 bg-white hover:border-slate-300 transition-colors shadow-2xs">
                  <CardContent className="p-6 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        Problem {problem.number}
                      </span>
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center border",
                          problem.bgLight,
                          problem.borderLight
                        )}
                      >
                        <Icon className={cn("w-4 h-4", problem.iconColor)} />
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                      {problem.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                      {problem.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
