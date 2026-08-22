"use client"

import * as React from "react"
import { motion } from "motion/react"
import Link from "next/link"
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface FinalCtaSectionProps {
  onGetStarted?: () => void
  onExploreProduct?: () => void
}

export function FinalCtaSection({
  onGetStarted,
  onExploreProduct,
}: FinalCtaSectionProps) {
  return (
    <section className="py-16 sm:py-24 border-t border-slate-200/80 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-slate-200/90 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 text-center space-y-8 relative overflow-hidden shadow-lg"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-indigo-500/10 blur-3xl pointer-events-none -z-0" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            {/* Top pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-medium text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Get Started with Verse Merchant OS</span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              Ready to make crypto payments feel normal?
            </h2>

            {/* Supporting copy */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
              Give your customers a simpler way to pay and give your business a cleaner way to manage payments.
            </p>
          </div>

          {/* Action buttons */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            <Button
              variant="verse"
              size="lg"
              onClick={onGetStarted}
              className="h-11 sm:h-12 px-6 text-sm font-semibold gap-2 shadow-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onExploreProduct}
              className="h-11 sm:h-12 px-6 text-sm font-medium bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
            >
              Explore the Product
            </Button>
          </div>

          {/* Trust bullets */}
          <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No Wallet Complexity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Polygon Network Settlement</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Professional Receipts</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
