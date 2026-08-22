"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-6" id="invoice-detail-skeleton">
      {/* Header Skeleton */}
      <div className="space-y-3 pb-2 border-b border-slate-200">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-64" />
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Items & Notes) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between py-2 border-b border-slate-50">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
              <div className="pt-4 flex justify-end">
                <div className="w-48 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Customer & Summary) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
