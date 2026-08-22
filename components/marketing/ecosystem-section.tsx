"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  Coins,
  Cpu,
  Wallet,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function EcosystemSection() {
  const trustPoints = [
    {
      number: "01",
      title: "Verse Payments",
      description: "Accept payments using the Verse ecosystem.",
      icon: Coins,
      tag: "Asset Standard",
    },
    {
      number: "02",
      title: "Polygon",
      description: "Payment activity is associated with the Polygon network.",
      icon: Cpu,
      tag: "Network Layer",
    },
    {
      number: "03",
      title: "Wallet-Based",
      description: "Customers can use their connected crypto wallet to make payments.",
      icon: Wallet,
      tag: "Non-Custodial",
    },
    {
      number: "04",
      title: "On-Chain Reference",
      description: "Verified payments can retain their transaction reference for transparency.",
      icon: FileCheck2,
      tag: "Verifiable",
    },
  ]

  return (
    <section
      id="ecosystem"
      className="py-16 sm:py-24 border-t border-slate-200/80 bg-[#f8fafc] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <span>Ecosystem Alignment</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            Built for the Verse ecosystem.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            A merchant-first payment experience designed around Verse payments and the Polygon network.
          </p>
        </div>

        {/* 4 Trust Points Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((point, idx) => {
            const Icon = point.icon
            return (
              <motion.div
                key={point.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="flex flex-col"
              >
                <Card className="h-full border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between">
                  <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {point.tag}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            {point.number}
                          </span>
                          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                            {point.title}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                          {point.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Transparent Architecture</span>
                    </div>
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
