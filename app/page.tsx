"use client"

import * as React from "react"
import { Invoice } from "@/lib/invoices/types"
import { INITIAL_INVOICES } from "@/lib/invoices/data"
import { InvoiceTable } from "@/components/invoices/invoice-table"
import { InvoiceSummary } from "@/components/invoices/invoice-summary"
import { InvoiceBuilder } from "@/components/invoices/invoice-builder"
import { InvoiceDetail } from "@/components/invoices/invoice-detail"
import { InvoicePaymentModal } from "@/components/invoices/invoice-payment-modal"
import { PaymentQrModal } from "@/components/payments/payment-qr-modal"
import { useCryptoPrices } from "@/lib/payments/use-crypto-prices"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import {
  Plus,
  RefreshCw,
  Zap,
  TrendingUp,
  Receipt,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react"

export default function DashboardPage() {
  const [invoices, setInvoices] = React.useState<Invoice[]>(INITIAL_INVOICES)
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isBuilderOpen, setIsBuilderOpen] = React.useState(false)
  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = React.useState(false)
  const [activePayingInvoice, setActivePayingInvoice] = React.useState<Invoice | null>(null)

  const { prices, refreshPrices, isLoading: pricesLoading } = useCryptoPrices()

  const fetchInvoices = React.useCallback(async () => {
    try {
      const res = await fetch("/api/invoices")
      if (res.ok) {
        const data = await res.json()
        if (data.invoices) setInvoices(data.invoices)
      }
    } catch (e) {
      console.warn("Failed to fetch invoices:", e)
    }
  }, [])

  React.useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleOpenDetail = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setIsDetailOpen(true)
  }

  const handleOpenPay = (inv: Invoice) => {
    setActivePayingInvoice(inv)
    setIsPayModalOpen(true)
  }

  const handleOpenQr = (inv: Invoice) => {
    setActivePayingInvoice(inv)
    setIsQrModalOpen(true)
  }

  const handleInvoiceCreated = (newInv: Invoice) => {
    setInvoices((prev) => [newInv, ...prev])
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-sm">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">VersePay</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                Polygon Merchant
              </span>
            </div>
          </div>

          {/* Live Price Ticker Pill */}
          <div className="hidden lg:flex items-center gap-4 px-3.5 py-1.5 bg-slate-100/80 rounded-full border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700">POL:</span>
              <span className="font-mono text-purple-700 font-bold">${prices.POL.toFixed(4)}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">VERSE:</span>
              <span className="font-mono text-violet-700 font-bold">${prices.VERSE.toFixed(6)}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">USDC:</span>
              <span className="font-mono text-blue-700 font-bold">$1.00</span>
            </div>
            <button
              onClick={() => refreshPrices()}
              title="Refresh Market Prices"
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${pricesLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Connect Wallet */}
          <div className="flex items-center gap-3">
            <ConnectButton showBalance={false} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Merchant Invoicing & POS</h1>
            <p className="text-sm text-slate-500 mt-1">
              Issue invoices and receive on-chain settlements in POL, VERSE, or USDC with live conversion.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Create Invoice
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <InvoiceSummary invoices={invoices} />

        {/* Invoices List Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Issued Invoices</h2>
            <span className="text-xs text-slate-500 font-medium">{invoices.length} total records</span>
          </div>

          <InvoiceTable
            invoices={invoices}
            onSelectInvoice={handleOpenDetail}
            onPayInvoice={handleOpenPay}
            onQrInvoice={handleOpenQr}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          VersePay Settlement Engine • Real-time Polygon price feeds via Binance & DexScreener • Powered by Web3
        </div>
      </footer>

      {/* Modals */}
      <InvoiceBuilder
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onCreated={handleInvoiceCreated}
      />

      {selectedInvoice && (
        <InvoiceDetail
          invoice={selectedInvoice}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onPay={() => {
            setIsDetailOpen(false)
            handleOpenPay(selectedInvoice)
          }}
          onQr={() => {
            setIsDetailOpen(false)
            handleOpenQr(selectedInvoice)
          }}
        />
      )}

      {activePayingInvoice && (
        <>
          <InvoicePaymentModal
            invoice={activePayingInvoice}
            isOpen={isPayModalOpen}
            onClose={() => setIsPayModalOpen(false)}
            onSuccess={() => fetchInvoices()}
          />
          <PaymentQrModal
            invoice={activePayingInvoice}
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
          />
        </>
      )}
    </div>
  )
}
