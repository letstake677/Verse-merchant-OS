"use client"

import * as React from "react"
import { ArrowLeft, Edit3, ShieldAlert, Sparkles, CheckCircle2, XCircle } from "lucide-react"
import {
  Invoice,
  InvoiceFormState,
  InvoiceFormErrors,
  InvoiceLineItemErrors,
  validateInvoiceForm,
} from "@/types/invoice"
import { InvoiceDetailHeader } from "@/components/invoices/invoice-detail-header"
import { InvoiceDetailCustomer } from "@/components/invoices/invoice-detail-customer"
import { InvoiceDetailSummary } from "@/components/invoices/invoice-detail-summary"
import { InvoiceDetailItems } from "@/components/invoices/invoice-detail-items"
import { InvoiceDetailNotes } from "@/components/invoices/invoice-detail-notes"
import { InvoicePaymentModal } from "@/components/invoices/invoice-payment-modal"
import { PaymentPreparationModal } from "@/components/payments/payment-preparation-modal"
import { PaymentQRModal } from "@/components/payments/payment-qr-modal"
import { InvoiceForm } from "@/components/invoices/invoice-form"

import { InvoicePreview } from "@/components/invoices/invoice-preview"
import { InvoiceReview } from "@/components/invoices/invoice-review"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/toast"
import { Dialog } from "@/components/ui/dialog"

interface InvoiceDetailProps {
  invoice: Invoice
  onInvoiceUpdated?: (updated: Invoice) => void
}

function getInitialFormData(inv: Invoice): InvoiceFormState {
  return {
    customerName: inv.customerName || "",
    customerEmail: inv.customerEmail || "",
    currency: inv.currency || "USD",
    dueDate: inv.dueDate || "",
    items:
      inv.items && inv.items.length > 0
        ? inv.items.map((item, idx) => ({
            id: item.id || `item-${idx + 1}`,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
          }))
        : [
            {
              id: "item-1",
              description: "",
              quantity: 1,
              unitPrice: "",
              amount: "0.00",
            },
          ],
    notes: inv.notes || "",
  }
}

export function InvoiceDetail({ invoice, onInvoiceUpdated }: InvoiceDetailProps) {
  const { toast } = useToast()

  // Workspace Mode: "view" (read-only) | "edit" (form) | "review" (confirm changes)
  const [mode, setMode] = React.useState<"view" | "edit" | "review">("view")
  const [formData, setFormData] = React.useState<InvoiceFormState>(() =>
    getInitialFormData(invoice)
  )
  const [errors, setErrors] = React.useState<InvoiceFormErrors>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false)
  const [isPaymentPrepModalOpen, setIsPaymentPrepModalOpen] = React.useState(false)
  const [isQRModalOpen, setIsQRModalOpen] = React.useState(false)


  const handleCancelInvoiceConfirm = async () => {
    setIsCancelling(true)

    try {
      const response = await fetch(`/api/invoices/${encodeURIComponent(invoice.id)}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.status === 400) {
        toast({
          title: "Invalid invoice ID",
          description: "Invalid invoice ID.",
          type: "error",
        })
        return
      }

      if (response.status === 404) {
        toast({
          title: "Invoice not found",
          description: "Invoice not found.",
          type: "error",
        })
        return
      }

      if (response.status === 409) {
        toast({
          title: "Invoice state changed",
          description: "The invoice was updated elsewhere. Refresh the invoice and try again.",
          type: "error",
        })
        return
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Unable to cancel this invoice.")
      }

      // Success
      toast({
        title: "Invoice cancelled",
        description: "This invoice has been cancelled successfully.",
        type: "success",
      })

      setIsCancelDialogOpen(false)

      if (data.invoice && onInvoiceUpdated) {
        onInvoiceUpdated(data.invoice)
      }
    } catch (error) {
      console.error("[InvoiceDetail.handleCancelInvoiceConfirm] Error:", error)
      toast({
        title: "Cancellation failed",
        description: "Unable to cancel this invoice. Please try again.",
        type: "error",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  // Detect unsaved changes for beforeunload protection
  const isDirty = React.useMemo(() => {
    if (mode === "view") return false
    const initial = getInitialFormData(invoice)
    return JSON.stringify(formData) !== JSON.stringify(initial)
  }, [mode, formData, invoice])

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    if (isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload)
    }
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [isDirty])

  // Clear specific error field
  const handleClearError = (
    field: keyof InvoiceFormErrors,
    itemIndex?: number,
    itemField?: keyof InvoiceLineItemErrors
  ) => {
    if (field === "items" && itemIndex !== undefined && itemField) {
      if (errors.items && errors.items[itemIndex]) {
        const updatedItemsErrors = { ...errors.items }
        const itemErrors = { ...updatedItemsErrors[itemIndex] }
        delete itemErrors[itemField]
        if (Object.keys(itemErrors).length === 0) {
          delete updatedItemsErrors[itemIndex]
        } else {
          updatedItemsErrors[itemIndex] = itemErrors
        }
        setErrors((prev) => ({
          ...prev,
          items:
            Object.keys(updatedItemsErrors).length > 0 ? updatedItemsErrors : undefined,
        }))
      }
    } else {
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next[field]
          return next
        })
      }
    }
  }

  // Action: Start Editing
  const handleStartEdit = () => {
    if (invoice.status === "paid") {
      toast({
        title: "Cannot edit paid invoice",
        description: "Paid invoices are locked and cannot be edited.",
        type: "error",
      })
      return
    }

    if (invoice.status === "cancelled") {
      toast({
        title: "Cannot edit cancelled invoice",
        description: "Cancelled invoices cannot be edited.",
        type: "error",
      })
      return
    }

    setFormData(getInitialFormData(invoice))
    setErrors({})
    setMode("edit")

    // Accessibility: focus first form input after render
    setTimeout(() => {
      const customerInput = document.getElementById("customer-name-input")
      if (customerInput) {
        customerInput.focus()
      }
    }, 50)
  }

  // Action: Cancel Editing (revert to pristine view)
  const handleCancelEdit = () => {
    setFormData(getInitialFormData(invoice))
    setErrors({})
    setMode("view")

    // Accessibility: refocus the edit invoice button
    setTimeout(() => {
      const editBtn = document.getElementById("edit-invoice-button")
      if (editBtn) {
        editBtn.focus()
      }
    }, 50)
  }

  // Action: Form Submission (Edit -> Review)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors: validationErrors } = validateInvoiceForm(formData)
    if (!isValid) {
      setErrors(validationErrors)

      // Focus first error field for accessibility
      if (validationErrors.customerName) {
        document.getElementById("customer-name-input")?.focus()
      } else if (validationErrors.currency) {
        document.getElementById("invoice-currency-select")?.focus()
      } else if (validationErrors.items) {
        const firstErrorIndex = Object.keys(validationErrors.items)[0]
        document.getElementById(`item-desc-${firstErrorIndex}`)?.focus()
      }

      toast({
        title: "Validation error",
        description: "Please correct the highlighted fields before proceeding.",
        type: "error",
      })
      return
    }

    setErrors({})
    setMode("review")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Action: Back to Edit from Review
  const handleBackToEdit = () => {
    setMode("edit")
  }

  // Action: Edit Specific Section from Review
  const handleEditSection = (section: "customer" | "details" | "items" | "notes") => {
    setMode("edit")
    setTimeout(() => {
      if (section === "customer") {
        document.getElementById("customer-name-input")?.focus()
      } else if (section === "details") {
        document.getElementById("invoice-currency-select")?.focus()
      } else if (section === "items") {
        document.getElementById("item-desc-0")?.focus()
      } else if (section === "notes") {
        document.getElementById("customer-notes-textarea")?.focus()
      }
    }, 50)
  }

  // Action: Persist Changes to MongoDB (Review -> Save)
  const handleSaveInvoiceChanges = async () => {
    // Final client-side sanity check
    const { isValid, errors: validationErrors } = validateInvoiceForm(formData)
    if (!isValid) {
      setErrors(validationErrors)
      setMode("edit")
      toast({
        title: "Validation error",
        description: "Please fix form errors before saving.",
        type: "error",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/invoices/${encodeURIComponent(invoice.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          currency: formData.currency,
          dueDate: formData.dueDate,
          items: formData.items,
          notes: formData.notes,
        }),
      })

      const data = await response.json()

      if (response.status === 409) {
        toast({
          title: "Invoice state changed",
          description: "The invoice was updated elsewhere. Refresh the invoice and try again.",
          type: "error",
        })
        return
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Failed to update invoice.")
      }

      // Success notification
      toast({
        title: "Invoice updated",
        description: "Invoice changes have been saved successfully.",
        type: "success",
      })

      // Notify parent page of updated invoice
      if (data.invoice && onInvoiceUpdated) {
        onInvoiceUpdated(data.invoice)
      }

      // Transition back to read-only view
      setMode("view")
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to update invoice. Please try again."
      console.error("[InvoiceDetail.handleSaveInvoiceChanges] Error:", errorMsg)

      toast({
        title: "Save failed",
        description: errorMsg,
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // =========================================================================
  // VIEW MODE: Read-Only Document Presentation
  // =========================================================================
  if (mode === "view") {
    return (
      <div className="space-y-6 print:space-y-4" id="invoice-detail-root">
        {/* Print-Only Official Invoice Header */}
        <div className="hidden print:flex items-center justify-between pb-4 mb-2 border-b-2 border-slate-900">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-500 block">
              Verse Merchant OS
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              OFFICIAL INVOICE
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm font-bold text-slate-900 block">
              {invoice.invoiceNumber}
            </span>
            <span className="text-xs text-slate-600 uppercase tracking-wider font-semibold">
              Status: {invoice.status}
            </span>
          </div>
        </div>

        {/* 1. Header with back navigation, invoice number, status badge, and UX actions (including Pay, Edit & Cancel) */}
        <InvoiceDetailHeader
          invoiceNumber={invoice.invoiceNumber}
          status={invoice.status}
          onEdit={handleStartEdit}
          onCancelInvoice={() => setIsCancelDialogOpen(true)}
          onPayInvoice={() => setIsPaymentModalOpen(true)}
          onShowQR={() => setIsQRModalOpen(true)}
        />


        {/* 2. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:grid print:grid-cols-12 print:gap-4">
          {/* Left Column (8 cols on desktop / 7 cols on print): Line Items & Customer Notes */}
          <div className="lg:col-span-8 print:col-span-7 space-y-6 print:space-y-4 order-2 lg:order-1 print:order-1">
            <InvoiceDetailItems
              items={invoice.items || []}
              subtotal={invoice.subtotal}
              taxAmount={invoice.taxAmount}
              total={invoice.total}
              currency={invoice.currency}
            />

            <InvoiceDetailNotes notes={invoice.notes} />
          </div>

          {/* Right Column (4 cols on desktop / 5 cols on print): Customer Info & Invoice Metadata */}
          <div className="lg:col-span-4 print:col-span-5 space-y-6 print:space-y-4 order-1 lg:order-2 print:order-2">
            <InvoiceDetailCustomer
              customerName={invoice.customerName}
              customerEmail={invoice.customerEmail}
            />

            <InvoiceDetailSummary
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              status={invoice.status}
              currency={invoice.currency}
              createdAt={invoice.createdAt}
              dueDate={invoice.dueDate}
              paymentId={invoice.paymentId}
            />
          </div>
        </div>

        {/* Invoice Payment Modal */}
        <InvoicePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoice={invoice}
          onPaymentSuccess={() => {
            setIsPaymentModalOpen(false)
            // Reload page or trigger onInvoiceUpdated if provided
            if (onInvoiceUpdated) {
              fetch(`/api/invoices/${encodeURIComponent(invoice.id)}`)
                .then((res) => res.json())
                .then((data) => {
                  if (data.ok && data.invoice) {
                    onInvoiceUpdated(data.invoice)
                  }
                })
                .catch(() => {})
            }
          }}
        />

        {/* Payment Preparation Modal (Phase 6I Payment Intent Preparation) */}
        <PaymentPreparationModal
          isOpen={isPaymentPrepModalOpen}
          onClose={() => setIsPaymentPrepModalOpen(false)}
          invoice={invoice}
        />

        {/* Payment QR Modal (Phase 8.2 QR-Based Wallet-Independent Checkout) */}
        <PaymentQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          invoice={invoice}
        />


        {/* Cancellation Confirmation Dialog */}
        <Dialog
          isOpen={isCancelDialogOpen}
          onClose={() => !isCancelling && setIsCancelDialogOpen(false)}
          title="Cancel this invoice?"
          description="This invoice will remain in your records, but its status will change to Cancelled."
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCancelDialogOpen(false)}
                disabled={isCancelling}
                id="cancel-dialog-keep-button"
              >
                Keep Invoice
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancelInvoiceConfirm}
                isLoading={isCancelling}
                loadingText="Cancelling..."
                disabled={isCancelling}
                id="cancel-dialog-confirm-button"
              >
                Cancel Invoice
              </Button>
            </>
          }
        >
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              Cancelled invoices cannot be restored from this workspace. All financial history and details of this document will be preserved for audits, but editing and settling this invoice will be disabled permanently.
            </p>
          </div>
        </Dialog>
      </div>
    )
  }

  // =========================================================================
  // REVIEW MODE: Review Modified Changes Before Persisting to MongoDB
  // =========================================================================
  if (mode === "review") {
    return (
      <div className="space-y-6" id="invoice-edit-review-root">
        <InvoiceReview
          formData={formData}
          onBackToEdit={handleBackToEdit}
          onEditSection={handleEditSection}
          onCreateInvoice={handleSaveInvoiceChanges}
          isSubmitting={isSubmitting}
          title="Review Invoice Changes"
          subtitle="Check the modified details below before saving changes to MongoDB."
          badgeText="Ready to Save"
          confirmButtonText="Save Changes"
          submittingButtonText="Saving Changes..."
          invoiceNumber={invoice.invoiceNumber}
        />
      </div>
    )
  }

  // =========================================================================
  // EDIT MODE: Interactive Edit Form & Live Preview
  // =========================================================================
  return (
    <div className="space-y-6" id="invoice-edit-form-root">
      {/* Edit Header */}
      <div className="space-y-4 pb-3 border-b border-slate-200">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelEdit}
            className="h-8 -ml-2.5 px-2.5 text-xs text-slate-600 hover:text-slate-900 gap-1.5 font-medium"
            id="cancel-edit-top-button"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel & Return to View</span>
          </Button>

          <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
            Step 1: Edit & Validate
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Edit Invoice
              </h1>
              <span className="font-mono text-sm sm:text-base font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {invoice.invoiceNumber}
              </span>
              <StatusBadge status={invoice.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              Modify invoice fields and review deterministic financial totals before saving changes.
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Edit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Controls (7 cols on lg) */}
        <div className="lg:col-span-7">
          <InvoiceForm
            formData={formData}
            onChange={setFormData}
            errors={errors}
            onClearError={handleClearError}
            onSubmit={handleFormSubmit}
            onCancel={handleCancelEdit}
            submitButtonText="Review Changes"
            cancelButtonText="Cancel"
          />
        </div>

        {/* Right Column: Live Invoice Preview (5 cols on lg) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <InvoicePreview
            formData={formData}
            invoiceNumber={invoice.invoiceNumber}
          />
        </div>
      </div>
    </div>
  )
}
