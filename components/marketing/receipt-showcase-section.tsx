"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  Receipt,
  CheckCircle2,
  Share2,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react"
import { ReceiptPreview } from "@/components/marketing/receipt-preview"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ReceiptShowcaseSection() {
  const [demoStatus, setDemoStatus] = React.useState<"paid" | "verifying">("paid")

  const handleToggleDemo = () => {
    setDemoStatus("verifying")
    setTimeout(() => {
      setDemoStatus("paid")
    }, 1200)
  }

  const benefits = [
    {
      number: "01",
      title: "Clear proof of payment",
      description: "Customers can quickly confirm exactly what they paid for with itemized line items and totals.",
      icon: FileCheck,
    },
    {
      number: "02",
      title: "Shareable",
      description: "Send the receipt URL to a customer, teammate, or export it to an accounting workflow.",
      icon: Share2,
    },
    {
      number: "03",
      title: "On-chain reference",
      description: "Keep the verified transaction reference and Polygon network state available when needed.",
      icon: ShieldCheck,
    },
  ]

  return (
    <section
      id="receipt-showcase"
      className="py-16 sm:py-24 border-t border-slate-200/80 bg-white relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
          {/* Left Column (Desktop: 7 cols) / Top on Mobile: Explanatory & Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-6 space-y-8"
          >
            {/* Section Tag */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Signature Experience</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                Give every payment a better ending.
              </h2>

              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                After a verified payment, customers get a clear, professional receipt they can save, share, and use as proof of payment.
              </p>
            </div>

            {/* Mobile will show Receipt next, but on Desktop 3 Benefits are shown here */}
            <div className="hidden lg:grid grid-cols-1 gap-4 pt-2">
              {benefits.map((b) => {
                const Icon = b.icon
                return (
                  <div
                    key={b.number}
                    className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {b.number}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {b.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {b.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Micro-interaction interactive trigger */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-700 font-medium">Interactive Demo</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToggleDemo}
                className="text-xs h-7 text-indigo-600 hover:text-indigo-700 gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Simulate Verification</span>
              </Button>
            </div>
          </motion.div>

          {/* Right Column (Desktop: 5 cols) / Middle on Mobile: The Receipt Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-6 w-full flex justify-center"
          >
            <ReceiptPreview
              merchantName="ACME DESIGN"
              invoiceNumber="INV-1024"
              amount="$150.00"
              tokenAmount="1,250,000 VERSE"
              lineItems={[
                { name: "Logo Design", description: "Primary brand identity & vector assets", amount: "$150.00" },
              ]}
              subtotal="$150.00"
              total="$150.00"
              paymentMethod="Verse"
              network="Polygon"
              asset="VERSE"
              date="Aug 19, 2026"
              txHash="0x8f3C78B...91ac"
              receiptUrl="verse.os/receipt/rcpt_8f3a91ac"
              status={demoStatus}
              onToggleStatus={handleToggleDemo}
            />
          </motion.div>

          {/* Mobile Only: Benefits shown below the receipt on small screens */}
          <div className="lg:hidden col-span-1 space-y-3 pt-2">
            {benefits.map((b) => {
              const Icon = b.icon
              return (
                <div
                  key={b.number}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/80"
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {b.number}
                      </span>
                      <h3 className="text-xs font-semibold text-slate-900">
                        {b.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {b.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
