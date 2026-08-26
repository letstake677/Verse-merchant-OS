"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowRight,
  CheckCircle2,
  Receipt,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface HeroProps {
  onGetStarted?: () => void
  onSeeHowItWorks?: () => void
}

export function Hero({ onGetStarted, onSeeHowItWorks }: HeroProps) {
  // Interactive / animated state for the ACME invoice payment visual
  const [paymentState, setPaymentState] = React.useState<"unpaid" | "paying" | "paid">("unpaid")

  // Optional auto-cycle every 4.5 seconds to showcase both states smoothly
  React.useEffect(() => {
    const timer = setInterval(() => {
      setPaymentState((prev) => {
        if (prev === "unpaid") return "paying"
        if (prev === "paying") return "paid"
        return "unpaid"
      })
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-20 lg:pt-18 lg:pb-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200/70">
      {/* Background subtle mesh grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Hero Content & CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6 sm:space-y-7 text-left"
          >
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-medium shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-sans">Built for Verse on Polygon</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-slate-900 leading-[1.12]">
                Simple crypto payments for modern merchants.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                Create invoices, share payment links, accept Verse payments, and give customers a beautiful payment receipt — without making blockchain complicated.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Button
                variant="primary"
                size="lg"
                onClick={onGetStarted}
                className="h-11 sm:h-12 px-7 text-sm font-semibold shadow-sm hover:shadow-md transition-all gap-2 bg-slate-900 hover:bg-slate-800 text-white"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={onSeeHowItWorks}
                className="h-11 sm:h-12 px-6 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-100/80 bg-white shadow-2xs"
              >
                See how it works
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 sm:pt-8 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Wallet Complexity</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Settlement</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Non-Custodial Polygon</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Product & Payment Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-5 w-full flex justify-center"
          >
            <div className="w-full max-w-[390px] sm:max-w-[420px] relative">
              {/* Outer Glow & Card Container */}
              <div className="relative rounded-2xl bg-white border border-slate-200 shadow-xl p-5 sm:p-6 space-y-5 transition-all">
                {/* Header: Merchant info */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-wider font-mono shadow-xs">
                      AD
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">ACME DESIGN</h4>
                      <p className="text-xs text-slate-500 font-mono">Invoice #1024</p>
                    </div>
                  </div>
                  
                  {/* Status Pill Toggle */}
                  <button
                    onClick={() =>
                      setPaymentState((curr) => (curr === "paid" ? "unpaid" : "paid"))
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border"
                    style={{
                      backgroundColor: paymentState === "paid" ? "#ecfdf5" : "#f8fafc",
                      borderColor: paymentState === "paid" ? "#a7f3d0" : "#e2e8f0",
                      color: paymentState === "paid" ? "#065f46" : "#475569",
                    }}
                    title="Click to preview payment states"
                  >
                    {paymentState === "paid" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Paid</span>
                      </>
                    ) : paymentState === "paying" ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Due</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Invoice Line Item */}
                <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-800">Brand & Logo Design</p>
                    <p className="text-[11px] text-slate-500">Milestone 1 Deliverables</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 font-mono">$150.00</p>
                    <p className="text-[10px] text-slate-500 font-mono">~350,000 VERSE</p>
                  </div>
                </div>

                {/* Animated Interactive State Area */}
                <AnimatePresence mode="wait">
                  {paymentState === "unpaid" && (
                    <motion.div
                      key="unpaid-state"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="space-y-3"
                    >
                      <button
                        onClick={() => setPaymentState("paying")}
                        className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>Pay with Verse</span>
                      </button>
                      <p className="text-center text-[11px] text-slate-400">
                        Zero gas friction • Verified in ~2s on Polygon
                      </p>
                    </motion.div>
                  )}

                  {paymentState === "paying" && (
                    <motion.div
                      key="paying-state"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        <div>
                          <p className="text-xs font-semibold">Broadcasting to Polygon</p>
                          <p className="text-[10px] text-amber-700">Verifying non-custodial receipt...</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold">$150.00</span>
                    </motion.div>
                  )}

                  {paymentState === "paid" && (
                    <motion.div
                      key="paid-state"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="space-y-3"
                    >
                      {/* Success Box */}
                      <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-950 flex items-start justify-between">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-emerald-900">Payment Received</p>
                            <p className="text-[11px] text-emerald-700">Confirmed on Polygon Block #62914</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-emerald-900 font-mono">$150.00</span>
                      </div>

                      {/* Receipt Link Trigger */}
                      <div className="flex items-center justify-between px-2 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-slate-400" />
                          Receipt #REC-1024 Generated
                        </span>
                        <span className="text-slate-400 font-mono">Tx: 0x4a9b...7e12</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sub-footer micro badge */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>NETWORK: POLYGON (137)</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    LIVE
                  </span>
                </div>
              </div>

              {/* Floating micro accent pill */}
              <div className="absolute -bottom-3 -right-2 bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-md border border-slate-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Instant Merchant Settlement</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
