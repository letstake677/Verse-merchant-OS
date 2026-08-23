"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Coins,
  CreditCard,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroProps {
  onGetStarted?: () => void
  onSeeHowItWorks?: () => void
}

export function Hero({ onGetStarted, onSeeHowItWorks }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-28">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Top pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/80 text-xs font-medium text-indigo-700 mx-auto shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Built for Verse on Polygon</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
              Simple crypto payments for modern merchants.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Create invoices, share payment links, accept Verse payments, and give customers a verified payment receipt — without making blockchain complicated.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onGetStarted}
              className="h-11 sm:h-12 px-7 text-sm font-semibold shadow-sm hover:shadow-md transition-all gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onSeeHowItWorks}
              className="h-11 sm:h-12 px-6 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              See how it works
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero Wallet Complexity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instant Polygon Confirmation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct Non-Custodial Settlement</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
