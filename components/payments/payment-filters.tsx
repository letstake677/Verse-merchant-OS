"use client"

import * as React from "react"
import { Search, Filter, Calendar, Coins, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { PaymentFiltersState, PaymentStatus } from "@/types/payment"

interface PaymentFiltersProps {
  filters: PaymentFiltersState
  onFiltersChange: (filters: PaymentFiltersState) => void
  onResetFilters?: () => void
  className?: string
}

export function PaymentFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  className,
}: PaymentFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.dateRange !== "all" ||
    filters.asset !== "all"

  return (
    <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="lg:col-span-5 relative">
          <Input
            placeholder="Search payments by ID, reference, customer..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="h-9 text-xs"
          />
        </div>

        {/* Status Dropdown */}
        <div className="lg:col-span-3">
          <Select
            value={filters.status}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value as PaymentStatus | "all",
              })
            }
            className="h-9 text-xs"
          >
            <option value="all">Status: All</option>
            <option value="confirmed">Confirmed</option>
            <option value="submitted">Submitted</option>
            <option value="confirming">Confirming</option>
            <option value="pending">Pending</option>
            <option value="underpaid">Underpaid</option>
            <option value="overpaid">Overpaid</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>

        {/* Date Filter */}
        <div className="lg:col-span-2">
          <Select
            value={filters.dateRange}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                dateRange: e.target.value as PaymentFiltersState["dateRange"],
              })
            }
            className="h-9 text-xs"
          >
            <option value="all">Date: All time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </Select>
        </div>

        {/* Asset Filter */}
        <div className="lg:col-span-2">
          <Select
            value={filters.asset}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                asset: e.target.value,
              })
            }
            className="h-9 text-xs"
          >
            <option value="all">Asset: All</option>
            <option value="VERSE">VERSE</option>
            <option value="USDC">USDC</option>
            <option value="POL">POL / MATIC</option>
          </Select>
        </div>
      </div>

      {/* Active filter reset notice if filtered */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Filtering is ready for incoming payment records.</span>
          <button
            type="button"
            onClick={() => {
              if (onResetFilters) {
                onResetFilters()
              } else {
                onFiltersChange({
                  search: "",
                  status: "all",
                  dateRange: "all",
                  tokenSymbol: "all",
                  asset: "all",
                })
              }
            }}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        </div>
      )}
    </div>
  )
}
