"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Share2,
  RefreshCw,
  QrCode,
  Coins,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface HeroProps {
  onGetStarted?: () => void
  onSeeHowItWorks?: () => void
}

export function Hero({ onGetStarted, onSeeHowItWorks }: HeroProps) {
  // Interactive mock payment state to demonstrate the core user flow visually
  const [paymentStep, setPaymentStep] = React.useState<"invoice" | "verifying" | "receipt">("invoice")

  const handleSimulatePayment = () => {
    setPaymentStep("verifying")
    setTimeout(() => {
      setPaymentStep("receipt")
    }, 1200)
  }

  const handleReset = () => {
    setPaymentStep("invoice")
  }

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-50/60 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Typography & CTAs (col-span-7) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6 sm:space-y-8 text-left"
          >
            {/* Top pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-medium text-indigo-700">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
              <span>Built for Verse on Polygon</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Simple crypto payments for modern merchants.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
                Create invoices, share payment links, accept Verse payments, and give customers a beautiful payment receipt — without making blockchain complicated.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
              <Button
                variant="primary"
                size="lg"
                onClick={onGetStarted}
                className="h-11 sm:h-12 px-6 text-sm font-semibold shadow-sm hover:shadow-md transition-all gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={onSeeHowItWorks}
                className="h-11 sm:h-12 px-5 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                See how it works
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-4 border-t border-slate-200/60 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
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
                <span>Shareable Smart Receipts</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive Hero Product Card (col-span-5) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-5 w-full flex flex-col items-center justify-center"
          >
            <div className="w-full max-w-sm sm:max-w-md mx-auto">
              {/* Card Container */}
              <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.06),0_4px_12px_-2px_rgba(0,0,0,0.03)] overflow-hidden transition-all">
                {/* Decorative header strip */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-bold font-mono">
                      V
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 tracking-tight">ACME DESIGN</p>
                      <p className="text-[10px] text-slate-400 font-mono">Invoice #1024</p>
                    </div>
                  </div>
                  <Badge variant="verse" className="text-[10px] py-0 px-2">
                    Verse Settlement
                  </Badge>
                </div>

                <AnimatePresence mode="wait">
                  {/* STEP 1: INVOICE PAYMENT VIEW */}
                  {paymentStep === "invoice" && (
                    <motion.div
                      key="invoice-step"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      {/* Item Details */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-slate-900">Logo & Brand Identity</p>
                            <p className="text-xs text-slate-400">Deliverable package 1</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900 font-tabular">$150.00</p>
                            <p className="text-[10px] text-slate-400 font-mono">1,250,000 VERSE</p>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Network Fee</span>
                            <span className="font-mono text-emerald-600 font-medium">&lt; $0.01 (Polygon)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Settlement</span>
                            <span className="font-medium text-slate-700">Instant to Merchant Wallet</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Action */}
                      <div className="space-y-2 pt-1">
                        <Button
                          variant="verse"
                          size="lg"
                          onClick={handleSimulatePayment}
                          className="w-full justify-center h-11 text-xs font-semibold gap-2 shadow-xs cursor-pointer"
                        >
                          <Coins className="w-4 h-4" />
                          <span>Pay $150.00 with Verse</span>
                        </Button>
                        <p className="text-[11px] text-center text-slate-400">
                          Click to preview instant payment confirmation flow
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: VERIFYING TRANSITION */}
                  {paymentStep === "verifying" && (
                    <motion.div
                      key="verifying-step"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="py-8 text-center space-y-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto animate-spin">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">Verifying on Polygon...</p>
                        <p className="text-xs text-slate-500 font-mono">Tx 0x8f3...91ac in mempool</p>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: THE SIGNATURE PAYMENT RECEIPT */}
                  {paymentStep === "receipt" && (
                    <motion.div
                      key="receipt-step"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      {/* Receipt Header */}
                      <div className="text-center space-y-1 pb-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PAYMENT RECEIVED</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 font-tabular tracking-tight">
                          $150.00
                        </div>
                        <p className="text-xs text-slate-500">ACME DESIGN • Invoice #1024</p>
                      </div>

                      {/* Receipt Table Spec */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs space-y-2 font-mono">
                        <div className="flex justify-between text-slate-500 pb-1.5 border-b border-slate-200/60 font-sans">
                          <span>Logo Design</span>
                          <span className="font-semibold text-slate-900 font-tabular">$150.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status</span>
                          <span className="text-emerald-700 font-bold">Paid</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Network</span>
                          <span className="text-slate-800">Polygon</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Asset</span>
                          <span className="text-indigo-700 font-semibold">Verse</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Date</span>
                          <span className="text-slate-700">Aug 19, 2026</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Transaction</span>
                          <span className="text-slate-900 font-semibold underline decoration-dotted">
                            0x8f3...91ac
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleReset}
                          className="text-xs gap-1.5"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset Demo</span>
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard?.writeText?.("https://versemerchant.os/receipt/inv_1024")
                          }}
                          className="text-xs gap-1.5"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Share Receipt</span>
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Caption beneath preview card */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  Non-custodial merchant receipt
                </span>
                <span className="font-mono text-slate-400">Live Simulation</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
