"use client"

import * as React from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft, RefreshCw, FileQuestion } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface InvoiceDetailErrorProps {
  status?: number
  message?: string
  onRetry?: () => void
}

export function InvoiceDetailError({
  status,
  message,
  onRetry,
}: InvoiceDetailErrorProps) {
  const isNotFound = status === 404
  const isInvalid = status === 400

  const title = isNotFound
    ? "Invoice not found"
    : isInvalid
    ? "Invalid invoice ID"
    : "Unable to load this invoice"

  const description = isNotFound
    ? "The invoice may have been removed or you may not have access to it."
    : isInvalid
    ? "The requested invoice identifier format is invalid."
    : message || "A network or server error occurred while retrieving this invoice."

  return (
    <Card className="max-w-xl mx-auto my-12" id="invoice-detail-error-card">
      <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          isNotFound || isInvalid
            ? "bg-slate-100 border border-slate-200 text-slate-600"
            : "bg-rose-50 border border-rose-100 text-rose-600"
        }`}>
          {isNotFound ? (
            <FileQuestion className="w-6 h-6" />
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-1.5">
          {title}
        </h2>
        <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard/invoices">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 text-xs font-semibold h-9 px-4 text-slate-700"
              id="back-to-invoices-error-button"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Invoices</span>
            </Button>
          </Link>

          {!isNotFound && !isInvalid && onRetry && (
            <Button
              variant="primary"
              size="sm"
              onClick={onRetry}
              className="gap-2 text-xs font-semibold h-9 px-4"
              id="retry-invoice-detail-button"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
