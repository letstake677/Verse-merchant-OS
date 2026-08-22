"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  FileText,
  QrCode,
  Link2,
  Coins,
  Receipt,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Create",
      description: "Create an invoice or payment request with the amount and customer details.",
      visual: (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-left space-y-2 select-none">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Invoice #1024</span>
            <span className="text-slate-600 font-bold font-tabular">$150.00</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-100 space-y-1">
            <p className="text-[11px] font-semibold text-slate-900 truncate">Logo Design Package</p>
            <p className="text-[10px] text-slate-400">client@acme.corp</p>
          </div>
        </div>
      ),
    },
    {
      number: "02",
      title: "Share",
      description: "Send a payment link or let your customer scan a QR code.",
      visual: (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-left space-y-2 select-none">
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-100 text-[10px] text-slate-600 truncate font-mono">
            <Link2 className="w-3 h-3 text-indigo-600 shrink-0" />
            <span className="truncate">verse.os/pay/1024</span>
          </div>
          <div className="flex items-center justify-between px-2 pt-0.5">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <QrCode className="w-3 h-3 text-slate-600" /> Instant QR
            </span>
            <span className="text-[10px] text-indigo-600 font-medium font-sans">Shareable</span>
          </div>
        </div>
      ),
    },
    {
      number: "03",
      title: "Get Paid",
      description: "Your customer pays with Verse through their connected wallet.",
      visual: (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-left space-y-2 select-none">
          <div className="p-2 rounded-lg bg-indigo-600 text-white flex items-center justify-between text-[11px] font-semibold">
            <span className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Pay with Verse
            </span>
            <span className="font-mono text-[10px] text-indigo-200">1.25M</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 px-1">
            <span>Polygon Gas</span>
            <span className="text-emerald-600 font-medium">&lt; $0.01</span>
          </div>
        </div>
      ),
    },
    {
      number: "04",
      title: "Confirm & Receipt",
      description: "The payment is verified and a professional receipt becomes available.",
      visual: (
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-left space-y-1.5 select-none">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID
            </span>
            <span className="font-bold text-slate-900 font-tabular">$150.00</span>
          </div>
          <div className="p-1.5 rounded-md bg-white border border-emerald-100 text-[10px] text-slate-500 font-mono flex justify-between">
            <span>Tx Hash</span>
            <span className="text-slate-800">0x8f3...91ac</span>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-24 border-t border-slate-200/80 bg-[#f8fafc] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
            <span>The Workflow</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            From payment request to receipt in four simple steps.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
            Verse Merchant OS handles the payment workflow while keeping blockchain complexity in the background.
          </p>
        </div>

        {/* Step Flow (4-Column Grid on Desktop with subtle connectors / Vertical Timeline on Mobile) */}
        <div className="relative">
          {/* Desktop connecting line behind steps */}
          <div className="hidden lg:block absolute top-12 left-8 right-8 h-0.5 bg-slate-200 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                className="flex flex-col"
              >
                <Card className="h-full border-slate-200/90 bg-white hover:border-slate-300 transition-all duration-150 flex flex-col justify-between shadow-2xs">
                  <CardContent className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Step Badge */}
                      <div className="flex items-center justify-between">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shadow-xs">
                          {step.number}
                        </div>
                        {idx < steps.length - 1 && (
                          <span className="hidden lg:inline text-slate-300 text-xs">
                            <ChevronRight className="w-4 h-4" />
                          </span>
                        )}
                      </div>

                      {/* Step Title & Description */}
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                          {step.title}
                        </h3>
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Step Visual Micro-Card */}
                    <div className="pt-2">
                      {step.visual}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
