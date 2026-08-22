"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Sparkles, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { InvoiceForm } from "@/components/invoices/invoice-form"
import { InvoicePreview } from "@/components/invoices/invoice-preview"
import { InvoiceReview } from "@/components/invoices/invoice-review"
import {
  InvoiceFormState,
  InvoiceFormErrors,
  InvoiceLineItemErrors,
  validateInvoiceForm,
} from "@/types/invoice"

export function InvoiceBuilder() {
  const router = useRouter()
  const { toast } = useToast()

  // Builder mode: 'editing' | 'review'
  const [builderMode, setBuilderMode] = React.useState<"editing" | "review">("editing")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Empty, honest initial form state - zero fabricated data
  const [formData, setFormData] = React.useState<InvoiceFormState>({
    customerName: "",
    customerEmail: "",
    currency: "USD",
    dueDate: "",
    items: [
      {
        id: "item-1",
        description: "",
        quantity: 1,
        unitPrice: "",
        amount: "0.00",
      },
    ],
    notes: "",
  })

  // Validation errors state
  const [errors, setErrors] = React.useState<InvoiceFormErrors>({})

  // Lightweight unsaved changes warning for browser reloads/tabs
  React.useEffect(() => {
    const isDirty = Boolean(
      formData.customerName.trim() ||
      formData.customerEmail.trim() ||
      formData.dueDate ||
      formData.notes.trim() ||
      formData.items.some((i) => i.description.trim() || i.unitPrice)
    )

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [formData])

  // Clear specific field errors when user edits
  const handleClearError = (
    field: keyof InvoiceFormErrors,
    itemIndex?: number,
    itemField?: keyof InvoiceLineItemErrors
  ) => {
    if (field === "items" && itemIndex !== undefined && itemField) {
      if (errors.items?.[itemIndex]?.[itemField]) {
        const updatedItemErrors = { ...errors.items }
        const currentLine = { ...updatedItemErrors[itemIndex] }
        delete currentLine[itemField]

        if (Object.keys(currentLine).length === 0) {
          delete updatedItemErrors[itemIndex]
        } else {
          updatedItemErrors[itemIndex] = currentLine
        }

        setErrors({
          ...errors,
          items: Object.keys(updatedItemErrors).length > 0 ? updatedItemErrors : undefined,
          general: undefined,
        })
      }
    } else if (errors[field]) {
      const updated = { ...errors }
      delete updated[field]
      setErrors(updated)
    }
  }

  // Handle Form Submission / Transition to Review
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors: validationErrors } = validateInvoiceForm(formData)

    if (!isValid) {
      setErrors(validationErrors)

      toast({
        title: "Incomplete Invoice Form",
        description: "Please correct the highlighted fields to proceed.",
        type: "error",
      })

      // Focus first error field if possible
      const firstErrorInput = document.querySelector('[aria-invalid="true"]') as HTMLElement | null
      if (firstErrorInput) {
        firstErrorInput.focus()
      }
      return
    }

    // Valid: Clear any remaining errors and transition to Review state
    setErrors({})
    setBuilderMode("review")

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Return to editing mode
  const handleBackToEdit = () => {
    setBuilderMode("editing")
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // Contextual edit from review cards
  const handleEditSection = (section: "customer" | "details" | "items" | "notes") => {
    setBuilderMode("editing")

    // Focus corresponding input field after state transition
    setTimeout(() => {
      let targetId = ""
      if (section === "customer") targetId = "customer-name-input"
      else if (section === "details") targetId = "invoice-currency-select"
      else if (section === "items") targetId = "item-desc-0"
      else if (section === "notes") targetId = "customer-notes-textarea"

      const el = document.getElementById(targetId)
      if (el) {
        el.focus()
      }
    }, 100)
  }

  // Review confirmation action: Submit to server-side POST /api/invoices
  const handleConfirmCreate = async () => {
    // Re-verify validation before creating
    const { isValid } = validateInvoiceForm(formData)
    if (!isValid) {
      setBuilderMode("editing")
      toast({
        title: "Form Incomplete",
        description: "Please review the required invoice fields before proceeding.",
        type: "error",
      })
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to create invoice.")
      }

      toast({
        title: "Invoice Created",
        description: `Invoice ${data.invoice?.invoiceNumber || ""} has been created successfully.`,
        type: "success",
      })

      // Navigate to the Invoices list workspace
      router.push("/dashboard/invoices")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create invoice."
      toast({
        title: "Invoice Creation Failed",
        description: errorMessage,
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render Review Mode
  if (builderMode === "review") {
    return (
      <InvoiceReview
        formData={formData}
        onBackToEdit={handleBackToEdit}
        onEditSection={handleEditSection}
        onCreateInvoice={handleConfirmCreate}
        isSubmitting={isSubmitting}
      />
    )
  }

  // Render Edit Mode
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Builder Header with Back Navigation */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
        <div>
          <Link
            href="/dashboard/invoices"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Invoices</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Create Invoice
                </h1>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 font-mono"
                >
                  Draft
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-normal">
                Create a payment request for your customer.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] text-slate-400 font-medium">
                Step 1: Build & Validate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Responsive 2-Column Layout (Desktop) / 1-Column (Mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Form Builder (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <InvoiceForm
            formData={formData}
            onChange={setFormData}
            errors={errors}
            onClearError={handleClearError}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Right Column: Customer Invoice Preview (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <InvoicePreview formData={formData} />
        </div>
      </div>
    </div>
  )
}
