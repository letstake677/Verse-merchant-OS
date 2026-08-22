"use client"

import * as React from "react"
import { MessageSquare } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface InvoiceDetailNotesProps {
  notes?: string
}

export function InvoiceDetailNotes({ notes }: InvoiceDetailNotesProps) {
  if (!notes || !notes.trim()) {
    return null
  }

  return (
    <Card id="invoice-detail-notes-card" className="print:shadow-none print:border-slate-300 print:bg-white print:break-inside-avoid">
      <CardHeader className="pb-3 border-b border-slate-100 print:border-slate-300">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 print:hidden" />
          <span>Customer Notes / Payment Terms</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
        {notes.trim()}
      </CardContent>
    </Card>
  )
}
