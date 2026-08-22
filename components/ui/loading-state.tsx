import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-slate-200/80">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3.5 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
            {Array.from({ length: cols }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-4",
                  colIndex === 0 ? "w-28" : colIndex === cols - 1 ? "w-16 ml-auto" : "w-20"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function InvoiceDetailSkeleton() {
  return (
    <Card className="max-w-2xl mx-auto border-slate-200/80">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex justify-end pt-4">
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}
