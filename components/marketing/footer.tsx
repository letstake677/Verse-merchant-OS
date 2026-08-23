"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Sparkles, ArrowUpRight } from "lucide-react"

export function MarketingFooter() {
  const footerGroups = [
    {
      title: "Product",
      links: [
        { label: "Overview", href: "/dashboard" },
        { label: "Payments", href: "/dashboard" },
        { label: "Invoices", href: "/dashboard" },
        { label: "Payment Links", href: "/dashboard" },
        { label: "Analytics", href: "/dashboard" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "How it works", href: "#how-it-works" },
        { label: "Features", href: "#features" },
        { label: "Receipt Preview", href: "#receipt-showcase" },
        { label: "Design System", href: "/design-system" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#product" },
        { label: "Verse Ecosystem", href: "#ecosystem" },
        { label: "Polygon Network", href: "https://polygon.technology" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Non-Custodial Notice", href: "#" },
      ],
    },
  ]

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Left Column: Brand & Tagline (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 select-none">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
                <span className="font-bold text-sm font-mono">V</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">
                  VERSE
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Merchant OS
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed max-w-sm">
              Simple crypto payments for modern merchants. Built for Verse on the Polygon network.
            </p>

            <div className="pt-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-mono py-0 px-2 text-slate-500">
                Polygon Mainnet
              </Badge>
              <Badge variant="verse" className="text-[10px] py-0 px-2">
                Verse Ecosystem
              </Badge>
            </div>
          </div>

          {/* Navigation Groups (4 cols) */}
          {footerGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                {group.title}
              </h4>
              <ul className="space-y-2.5 text-xs">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("http") ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3 h-3 text-slate-400" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Verse Merchant OS. Non-custodial payments on Polygon.</p>

          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/dashboard" className="hover:text-slate-600 transition-colors">
              Merchant Workspace
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
