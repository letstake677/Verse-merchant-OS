"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface MarketingNavbarProps {
  onNavigateToDashboard?: () => void
}

export function MarketingNavbar({ onNavigateToDashboard }: MarketingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const navLinks = [
    { label: "Product", href: "#product" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 select-none group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
              <span className="font-bold text-sm tracking-wider font-mono">V</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900">
                VERSE
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Merchant OS
              </span>
            </div>
          </Link>

          <Badge variant="outline" className="hidden lg:inline-flex text-[10px] py-0 px-2 text-slate-500 font-mono">
            Polygon Mainnet
          </Badge>
        </div>

        {/* Center / Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-slate-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToDashboard}
            className="text-xs text-slate-700 hover:text-slate-900"
          >
            Sign In
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToDashboard}
            className="text-xs gap-1.5 shadow-xs"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={onNavigateToDashboard}
            className="text-xs h-8 px-2.5"
          >
            Get Started
          </Button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setMobileMenuOpen(false)
                onNavigateToDashboard?.()
              }}
              className="w-full justify-center text-xs"
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="default"
              onClick={() => {
                setMobileMenuOpen(false)
                onNavigateToDashboard?.()
              }}
              className="w-full justify-center text-xs"
            >
              Launch Merchant OS
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
