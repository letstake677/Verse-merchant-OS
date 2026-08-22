"use client"

import * as React from "react"
import { Search, X, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { InvoiceFiltersState, InvoiceStatus } from "@/types/invoice"

interface InvoiceFiltersProps {
  filters: InvoiceFiltersState
  onFiltersChange: (filters: InvoiceFiltersState) => void
  onResetFilters?: () => void
  className?: string
}

export function InvoiceFilters({
  filters,
  onFiltersChange,
  onResetFilters,
  className,
}: InvoiceFiltersProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.status !== "all" ||
    filters.dateRange !== "all" ||
    filters.customer !== ""

  return (
    <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="lg:col-span-5 relative">
          <Input
            placeholder="Search by invoice number, description..."
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
                status: e.target.value as InvoiceStatus | "all",
              })
            }
            className="h-9 text-xs"
          >
            <option value="all">Status: All</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
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
                dateRange: e.target.value as InvoiceFiltersState["dateRange"],
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

        {/* Customer Search / Filter */}
        <div className="lg:col-span-2">
          <Input
            placeholder="Filter by customer..."
            value={filters.customer}
            onChange={(e) =>
              onFiltersChange({ ...filters, customer: e.target.value })
            }
            startIcon={<Users className="w-3.5 h-3.5 text-slate-400" />}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Active filter reset notice if filtered */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Filtering is ready for your invoice records.</span>
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
                  customer: "",
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
