import { ObjectId } from "mongodb"
import { Invoice, InvoiceItem, InvoiceStatus } from "./invoice"

/**
 * MongoDB Persisted Invoice Document Contract
 *
 * Represents the document structure stored inside the MongoDB "invoices" collection.
 * Maintains strict merchant isolation via `merchantId`.
 *
 * Currency/Financial representation:
 * String-based fixed precision (e.g. "120.00") is preserved to prevent floating-point inaccuracy.
 */
export interface InvoiceDocumentItem {
  id: string
  description: string
  quantity: number
  unitPrice: string
  amount: string
}

export interface InvoiceDocument {
  _id: ObjectId
  merchantId: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  invoiceNumber: string
  status: InvoiceStatus
  currency: string
  items: InvoiceDocumentItem[]
  subtotal: string
  taxRate?: string
  taxAmount?: string
  total: string
  notes?: string
  dueDate?: Date
  createdAt: Date
  updatedAt?: Date
  paidAt?: Date
  paymentId?: string
}

/**
 * DTO for creating a new Invoice document in the repository
 */
export interface CreateInvoiceInput {
  merchantId: string
  customerId?: string
  customerName?: string
  customerEmail?: string
  invoiceNumber: string
  status?: InvoiceStatus
  currency: string
  items: Array<{
    id?: string
    description: string
    quantity: number
    unitPrice: string
    amount: string
  }>
  subtotal: string
  taxRate?: string
  taxAmount?: string
  total: string
  notes?: string
  dueDate?: string | Date
  paymentId?: string
}

/**
 * DTO for updating an existing Invoice document in the repository
 * Strictly contains only editable fields. Immutable fields (id, merchantId, invoiceNumber, createdAt, paymentId, paidAt) are omitted.
 */
export interface UpdateInvoiceInput {
  customerName?: string
  customerEmail?: string
  currency?: string
  items?: Array<{
    id?: string
    description: string
    quantity: number
    unitPrice: string
    amount: string
  }>
  subtotal?: string
  taxRate?: string
  taxAmount?: string
  total?: string
  notes?: string
  dueDate?: string | Date
}

/**
 * Query options for filtering and paginating merchant invoices
 */
export interface InvoiceQueryOptions {
  status?: InvoiceStatus | "all"
  search?: string
  dateRange?: "all" | "today" | "7d" | "30d" | "90d"
  page?: number
  limit?: number
  skip?: number
  sort?: Record<string, 1 | -1>
}

/**
 * Summary metrics for merchant invoice dashboard
 */
export interface InvoiceSummaryMetrics {
  totalInvoices: number
  draftCount: number
  outstandingAmount: string
  paidAmount: string
}

/**
 * Transforms a MongoDB InvoiceDocument into an application-level Invoice contract.
 * - Converts `_id` ObjectId or string to string `id`
 * - Formats Date instances or ISO strings safely
 */
export function serializeInvoiceDocument(doc: InvoiceDocument): Invoice {
  const resolvedId = doc._id
    ? typeof doc._id === "string"
      ? doc._id
      : typeof (doc._id as any).toHexString === "function"
      ? (doc._id as any).toHexString()
      : (doc._id as any).toString()
    : ""

  const safeItems = Array.isArray(doc.items)
    ? doc.items.map((item) => ({
        id: item?.id || "",
        description: item?.description || "",
        quantity: item?.quantity || 1,
        unitPrice: item?.unitPrice || "0.00",
        amount: item?.amount || "0.00",
      }))
    : []

  const formatSafeDate = (d: any): string | undefined => {
    if (!d) return undefined
    if (d instanceof Date) {
      return !isNaN(d.getTime()) ? d.toISOString() : undefined
    }
    if (typeof d === "string") return d
    return undefined
  }

  const formatDueDate = (d: any): string | undefined => {
    const iso = formatSafeDate(d)
    return iso ? iso.split("T")[0] : undefined
  }

  return {
    id: resolvedId,
    merchantId: doc.merchantId || "",
    customerId: doc.customerId,
    customerName: doc.customerName,
    customerEmail: doc.customerEmail,
    invoiceNumber: doc.invoiceNumber || "",
    status: doc.status || "draft",
    currency: doc.currency || "USD",
    items: safeItems,
    subtotal: doc.subtotal || "0.00",
    taxRate: doc.taxRate,
    taxAmount: doc.taxAmount,
    total: doc.total || "0.00",
    notes: doc.notes,
    dueDate: formatDueDate(doc.dueDate),
    createdAt: formatSafeDate(doc.createdAt) || new Date().toISOString(),
    updatedAt: formatSafeDate(doc.updatedAt),
    paidAt: formatSafeDate(doc.paidAt),
    paymentId: doc.paymentId,
  }
}
