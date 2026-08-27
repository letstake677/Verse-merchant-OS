import { ObjectId, Filter } from "mongodb"
import { getDb } from "@/lib/db/mongodb"
import { Invoice, InvoiceStatus } from "@/types/invoice"
import {
  InvoiceDocument,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceQueryOptions,
  InvoiceSummaryMetrics,
  serializeInvoiceDocument,
} from "@/types/invoice-document"
import { parseToCents, formatCents } from "@/lib/financial"

const COLLECTION_NAME = "invoices"

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Server-Side Invoice Repository for Verse Merchant OS
 *
 * Enforces strict merchant isolation (`merchantId`) across all queries and operations.
 * Operates purely with MongoDB driver primitives and the application data contract.
 */
export class InvoiceRepository {
  /**
   * Helper to retrieve the typed MongoDB collection.
   */
  private static async getCollection() {
    const db = await getDb()
    return db.collection<InvoiceDocument>(COLLECTION_NAME)
  }

  /**
   * Finds a single invoice by its ID or invoiceNumber without merchant scoping (for public payment checkout).
   */
  static async findById(invoiceId: string): Promise<Invoice | null> {
    if (!invoiceId) return null

    try {
      const collection = await this.getCollection()
      let doc = null

      if (ObjectId.isValid(invoiceId)) {
        doc = await collection.findOne({
          _id: new ObjectId(invoiceId),
        })
      }

      if (!doc) {
        doc = await collection.findOne({
          invoiceNumber: invoiceId.trim(),
        })
      }

      if (!doc) return null
      return serializeInvoiceDocument(doc)
    } catch (error) {
      console.error("[InvoiceRepository.findById] Error:", error)
      throw new Error("Failed to query invoice record.")
    }
  }

  /**
   * Finds an invoice by invoiceNumber without merchant scoping.
   */
  static async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice | null> {
    if (!invoiceNumber) return null

    try {
      const collection = await this.getCollection()
      const doc = await collection.findOne({
        invoiceNumber: invoiceNumber.trim(),
      })

      if (!doc) return null
      return serializeInvoiceDocument(doc)
    } catch (error) {
      console.error("[InvoiceRepository.findByInvoiceNumber] Error:", error)
      throw new Error("Failed to query invoice by invoice number.")
    }
  }

  /**
   * Finds a single invoice by its ID or invoiceNumber, strictly isolated to the specified merchant.
   *
   * @param invoiceId - Hexadecimal MongoDB ObjectId string or invoice number
   * @param merchantId - Authenticated merchant identifier
   */
  static async findByIdForMerchant(
    invoiceId: string,
    merchantId: string
  ): Promise<Invoice | null> {
    if (!invoiceId || !merchantId) return null

    try {
      const collection = await this.getCollection()
      let doc = null

      if (ObjectId.isValid(invoiceId)) {
        doc = await collection.findOne({
          _id: new ObjectId(invoiceId),
          merchantId,
        })
      }

      if (!doc) {
        doc = await collection.findOne({
          invoiceNumber: invoiceId.trim(),
          merchantId,
        })
      }

      if (!doc) return null
      return serializeInvoiceDocument(doc)
    } catch (error) {
      console.error("[InvoiceRepository.findByIdForMerchant] Error:", error)
      throw new Error("Failed to query invoice record.")
    }
  }

  /**
   * Finds all invoices belonging to a specific merchant with optional filtering and pagination.
   *
   * @param merchantId - Authenticated merchant identifier
   * @param options - Filter, sort, and pagination parameters
   */
  static async findByMerchantId(
    merchantId: string,
    options: InvoiceQueryOptions = {}
  ): Promise<Invoice[]> {
    if (!merchantId) return []

    try {
      const collection = await this.getCollection()
      const filter: Filter<InvoiceDocument> = { merchantId }

      if (options.status && options.status !== "all") {
        filter.status = options.status
      }

      if (options.search && options.search.trim()) {
        const cleanSearch = escapeRegex(options.search.trim())
        filter.$or = [
          { invoiceNumber: { $regex: cleanSearch, $options: "i" } },
          { customerName: { $regex: cleanSearch, $options: "i" } },
          { customerEmail: { $regex: cleanSearch, $options: "i" } },
        ]
      }

      if (options.dateRange && options.dateRange !== "all") {
        const now = new Date()
        let startDate: Date | undefined

        if (options.dateRange === "today") {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (options.dateRange === "7d") {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (options.dateRange === "30d") {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        } else if (options.dateRange === "90d") {
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        }

        if (startDate) {
          filter.createdAt = { $gte: startDate }
        }
      }

      const sort = options.sort || { createdAt: -1 }
      const limit = Math.min(Math.max(1, options.limit || 50), 100)
      const skip = Math.max(0, options.skip || 0)

      const cursor = collection.find(filter).sort(sort).skip(skip).limit(limit)
      const documents = await cursor.toArray()

      return documents.map(serializeInvoiceDocument)
    } catch (error) {
      console.error("[InvoiceRepository.findByMerchantId] Error:", error)
      throw new Error("Failed to query merchant invoices.")
    }
  }

  /**
   * Finds invoices with structured pagination metadata, search, and date filters.
   */
  static async findInvoicesWithPagination(
    merchantId: string,
    options: InvoiceQueryOptions = {}
  ): Promise<{
    invoices: Invoice[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    if (!merchantId) {
      return {
        invoices: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
    }

    try {
      const collection = await this.getCollection()
      const filter: Filter<InvoiceDocument> = { merchantId }

      if (options.status && options.status !== "all") {
        filter.status = options.status
      }

      if (options.search && options.search.trim()) {
        const cleanSearch = escapeRegex(options.search.trim())
        filter.$or = [
          { invoiceNumber: { $regex: cleanSearch, $options: "i" } },
          { customerName: { $regex: cleanSearch, $options: "i" } },
          { customerEmail: { $regex: cleanSearch, $options: "i" } },
        ]
      }

      if (options.dateRange && options.dateRange !== "all") {
        const now = new Date()
        let startDate: Date | undefined

        if (options.dateRange === "today") {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (options.dateRange === "7d") {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else if (options.dateRange === "30d") {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        } else if (options.dateRange === "90d") {
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        }

        if (startDate) {
          filter.createdAt = { $gte: startDate }
        }
      }

      const page = Math.max(1, options.page || 1)
      const limit = Math.min(Math.max(1, options.limit || 20), 50)
      const skip = (page - 1) * limit

      const total = await collection.countDocuments(filter)
      const totalPages = Math.ceil(total / limit) || 0

      const cursor = collection
        .find(filter)
        .sort(options.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)

      const documents = await cursor.toArray()
      const invoices = documents.map(serializeInvoiceDocument)

      return {
        invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      }
    } catch (error) {
      console.error("[InvoiceRepository.findInvoicesWithPagination] Error:", error)
      throw new Error("Failed to query paginated invoices.")
    }
  }

  /**
   * Aggregates real invoice metrics for merchant summary cards.
   */
  static async getMerchantInvoiceSummary(
    merchantId: string
  ): Promise<InvoiceSummaryMetrics> {
    if (!merchantId) {
      return {
        totalInvoices: 0,
        draftCount: 0,
        outstandingAmount: "$0.00",
        paidAmount: "$0.00",
      }
    }

    try {
      const collection = await this.getCollection()
      const docs = await collection
        .find({ merchantId })
        .project<{ status: InvoiceStatus; total: string }>({ status: 1, total: 1 })
        .toArray()

      let draftCount = 0
      let outstandingCents = 0
      let paidCents = 0

      for (const doc of docs) {
        if (doc.status === "draft") {
          draftCount++
        } else if (doc.status === "open" || doc.status === "overdue") {
          outstandingCents += parseToCents(doc.total)
        } else if (doc.status === "paid") {
          paidCents += parseToCents(doc.total)
        }
      }

      return {
        totalInvoices: docs.length,
        draftCount,
        outstandingAmount: `$${formatCents(outstandingCents)}`,
        paidAmount: `$${formatCents(paidCents)}`,
      }
    } catch (error) {
      console.error("[InvoiceRepository.getMerchantInvoiceSummary] Error:", error)
      throw new Error("Failed to compute invoice summary metrics.")
    }
  }

  /**
   * Finds an invoice by its unique invoice number scoped to a specific merchant.
   *
   * @param merchantId - Authenticated merchant identifier
   * @param invoiceNumber - Unique merchant-scoped invoice number
   */
  static async findByMerchantIdAndInvoiceNumber(
    merchantId: string,
    invoiceNumber: string
  ): Promise<Invoice | null> {
    if (!merchantId || !invoiceNumber) return null

    try {
      const collection = await this.getCollection()
      const doc = await collection.findOne({
        merchantId,
        invoiceNumber: invoiceNumber.trim(),
      })

      if (!doc) return null
      return serializeInvoiceDocument(doc)
    } catch (error) {
      console.error("[InvoiceRepository.findByMerchantIdAndInvoiceNumber] Error:", error)
      throw new Error("Failed to query invoice by invoice number.")
    }
  }

  /**
   * Counts the total number of invoices for a merchant, optionally filtered by status.
   *
   * @param merchantId - Authenticated merchant identifier
   * @param status - Optional status filter
   */
  static async countByMerchantId(
    merchantId: string,
    status?: InvoiceStatus
  ): Promise<number> {
    if (!merchantId) return 0

    try {
      const collection = await this.getCollection()
      const filter: Filter<InvoiceDocument> = { merchantId }
      if (status) {
        filter.status = status
      }

      return await collection.countDocuments(filter)
    } catch (error) {
      console.error("[InvoiceRepository.countByMerchantId] Error:", error)
      throw new Error("Failed to count merchant invoices.")
    }
  }

  /**
   * Foundational database insertion primitive for an invoice.
   * Note: Pure server-side primitive for future persistence phases.
   *
   * @param input - Validated invoice creation data
   */
  static async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    if (!input.merchantId) {
      throw new Error("Merchant ID is required to create an invoice.")
    }
    if (!input.invoiceNumber) {
      throw new Error("Invoice number is required.")
    }

    try {
      const collection = await this.getCollection()
      const now = new Date()

      let dueDateObj: Date | undefined
      if (input.dueDate) {
        dueDateObj = input.dueDate instanceof Date ? input.dueDate : new Date(input.dueDate)
        if (isNaN(dueDateObj.getTime())) {
          dueDateObj = undefined
        }
      }

      const newDoc: InvoiceDocument = {
        _id: new ObjectId(),
        merchantId: input.merchantId,
        customerId: input.customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        invoiceNumber: input.invoiceNumber.trim(),
        status: input.status || "draft",
        currency: input.currency || "USD",
        items: input.items.map((item, idx) => ({
          id: item.id || `item-${idx + 1}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
        subtotal: input.subtotal,
        taxRate: input.taxRate,
        taxAmount: input.taxAmount,
        total: input.total,
        notes: input.notes,
        dueDate: dueDateObj,
        paymentAddress: input.paymentAddress || "",
        createdAt: now,
        updatedAt: now,
        paidAt: undefined,
        paymentId: input.paymentId,
      }

      await collection.insertOne(newDoc)
      return serializeInvoiceDocument(newDoc)
    } catch (error) {
      console.error("[InvoiceRepository.createInvoice] Error:", error)
      throw new Error("Failed to persist invoice to database.")
    }
  }

  /**
   * Updates an existing invoice strictly scoped to the authenticated merchant.
   * Modifies ONLY explicitly permitted editable fields and updates `updatedAt`.
   * Preserves immutable fields: _id, merchantId, invoiceNumber, createdAt, paymentId, paidAt.
   *
   * @param invoiceId - Hexadecimal MongoDB ObjectId string
   * @param merchantId - Authenticated merchant identifier
   * @param input - Validated update fields
   */
  static async updateInvoiceForMerchant(
    invoiceId: string,
    merchantId: string,
    input: UpdateInvoiceInput
  ): Promise<Invoice | null> {
    if (!invoiceId || !merchantId) return null
    if (!ObjectId.isValid(invoiceId)) return null

    try {
      const collection = await this.getCollection()
      const now = new Date()

      let dueDateObj: Date | undefined = undefined
      if (input.dueDate !== undefined) {
        if (input.dueDate instanceof Date) {
          dueDateObj = isNaN(input.dueDate.getTime()) ? undefined : input.dueDate
        } else if (typeof input.dueDate === "string" && input.dueDate.trim()) {
          const parsed = new Date(input.dueDate.trim())
          dueDateObj = isNaN(parsed.getTime()) ? undefined : parsed
        }
      }

      // Build explicit $set document with ONLY editable fields
      const setFields: Record<string, unknown> = {
        updatedAt: now,
      }

      if (input.customerName !== undefined) {
        setFields.customerName = input.customerName.trim()
      }
      if (input.customerEmail !== undefined) {
        setFields.customerEmail = input.customerEmail ? input.customerEmail.trim() : undefined
      }
      if (input.currency !== undefined) {
        setFields.currency = input.currency.trim().toUpperCase()
      }
      if (input.items !== undefined) {
        setFields.items = input.items.map((item, idx) => ({
          id: item.id || `item-${idx + 1}`,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        }))
      }
      if (input.subtotal !== undefined) {
        setFields.subtotal = input.subtotal
      }
      if (input.taxRate !== undefined) {
        setFields.taxRate = input.taxRate
      }
      if (input.taxAmount !== undefined) {
        setFields.taxAmount = input.taxAmount
      }
      if (input.total !== undefined) {
        setFields.total = input.total
      }
      if (input.notes !== undefined) {
        setFields.notes = input.notes ? input.notes.trim() : undefined
      }
      if (input.dueDate !== undefined) {
        setFields.dueDate = dueDateObj
      }

      const updatedDoc = await collection.findOneAndUpdate(
        {
          _id: new ObjectId(invoiceId),
          merchantId,
          status: { $in: ["draft", "open", "overdue"] as InvoiceStatus[] },
        },
        {
          $set: setFields,
        },
        {
          returnDocument: "after",
        }
      )

      if (!updatedDoc) {
        const existingDoc = await collection.findOne({
          _id: new ObjectId(invoiceId),
          merchantId,
        })
        if (!existingDoc) {
          return null
        }
        throw new Error("This invoice cannot be edited.")
      }
      return serializeInvoiceDocument(updatedDoc)
    } catch (error) {
      console.error("[InvoiceRepository.updateInvoiceForMerchant] Error:", error)
      throw new Error("Failed to update invoice record.")
    }
  }

  /**
   * Cancels an existing invoice strictly scoped to the authenticated merchant.
   * Verifies current status is cancellable (draft, open, overdue) before mutation.
   *
   * @param invoiceId - Hexadecimal MongoDB ObjectId string
   * @param merchantId - Authenticated merchant identifier
   */
  static async cancelInvoiceForMerchant(
    invoiceId: string,
    merchantId: string
  ): Promise<Invoice | null> {
    if (!invoiceId || !merchantId) return null
    if (!ObjectId.isValid(invoiceId)) return null

    try {
      const collection = await this.getCollection()
      const now = new Date()

      // Perform atomic conditional update matching on editable/cancellable statuses only
      const updatedDoc = await collection.findOneAndUpdate(
        {
          _id: new ObjectId(invoiceId),
          merchantId,
          status: { $in: ["draft", "open", "overdue"] as InvoiceStatus[] },
        },
        {
          $set: {
            status: "cancelled" as InvoiceStatus,
            updatedAt: now,
          },
        },
        {
          returnDocument: "after",
        }
      )

      if (!updatedDoc) {
        // Distinguish between non-existent invoice and invalid state transition
        const existingDoc = await collection.findOne({
          _id: new ObjectId(invoiceId),
          merchantId,
        })
        if (!existingDoc) {
          return null
        }
        throw new Error("This invoice cannot be cancelled.")
      }

      return serializeInvoiceDocument(updatedDoc)
    } catch (error) {
      console.error("[InvoiceRepository.cancelInvoiceForMerchant] Error:", error)
      if (error instanceof Error && error.message === "This invoice cannot be cancelled.") {
        throw error
      }
      throw new Error("Failed to cancel invoice record.")
    }
  }

  /**
   * Links a payment record to an invoice, preserving strict merchant isolation.
   */
  static async linkPaymentId(
    invoiceId: string,
    merchantId: string,
    paymentId: string
  ): Promise<Invoice | null> {
    if (!invoiceId || !merchantId || !paymentId) return null
    if (!ObjectId.isValid(invoiceId)) return null

    try {
      const collection = await this.getCollection()
      const now = new Date()
      const updatedDoc = await collection.findOneAndUpdate(
        {
          _id: new ObjectId(invoiceId),
          merchantId,
        },
        {
          $set: {
            paymentId,
            updatedAt: now,
          },
        },
        { returnDocument: "after" }
      )

      if (!updatedDoc) return null
      return serializeInvoiceDocument(updatedDoc)
    } catch (error) {
      console.error("[InvoiceRepository.linkPaymentId] Error:", error)
      throw new Error("Failed to link payment to invoice.")
    }
  }

  /**
   * Authoritatively marks an invoice as paid after verified payment confirmation.
   * Atomically transitions status to paid and sets paidAt and paymentId.
   */
  static async markInvoicePaid(
    invoiceId: string,
    merchantId?: string,
    paymentId?: string,
    paidAtDate: Date = new Date()
  ): Promise<Invoice | null> {
    if (!invoiceId) return null

    try {
      const collection = await this.getCollection()
      const now = new Date()

      const query: any = {}
      if (ObjectId.isValid(invoiceId)) {
        query._id = new ObjectId(invoiceId)
      } else {
        query.invoiceNumber = invoiceId.trim()
      }
      if (merchantId) {
        query.merchantId = merchantId
      }

      const updatedDoc = await collection.findOneAndUpdate(
        query,
        {
          $set: {
            status: "paid" as InvoiceStatus,
            paymentId: paymentId || undefined,
            paidAt: paidAtDate,
            updatedAt: now,
          },
        },
        { returnDocument: "after" }
      )

      if (!updatedDoc) return null
      return serializeInvoiceDocument(updatedDoc)
    } catch (error) {
      console.error("[InvoiceRepository.markInvoicePaid] Error:", error)
      throw new Error("Failed to mark invoice as paid.")
    }
  }

  /**
   * Universal update invoice method (supporting both merchant and verification callers)
   */
  static async updateInvoice(
    invoiceId: string,
    merchantId: string,
    updates: Partial<InvoiceDocument> | { status?: InvoiceStatus; paymentId?: string }
  ): Promise<Invoice | null> {
    if (!invoiceId) return null

    try {
      const collection = await this.getCollection()
      const now = new Date()

      const query: any = {}
      if (ObjectId.isValid(invoiceId)) {
        query._id = new ObjectId(invoiceId)
      } else {
        query.invoiceNumber = invoiceId.trim()
      }
      if (merchantId) {
        query.merchantId = merchantId
      }

      const setObj: any = { ...updates, updatedAt: now }
      if (updates.status === "paid" && !setObj.paidAt) {
        setObj.paidAt = now
      }

      const updatedDoc = await collection.findOneAndUpdate(
        query,
        { $set: setObj },
        { returnDocument: "after" }
      )

      if (!updatedDoc) return null
      return serializeInvoiceDocument(updatedDoc)
    } catch (error) {
      console.error("[InvoiceRepository.updateInvoice] Error:", error)
      throw new Error("Failed to update invoice record.")
    }
  }

  /**
   * Deletes an invoice permanently from the database, strictly scoped to the invoice creator (merchant).
   *
   * @param invoiceId - Hexadecimal MongoDB ObjectId string
   * @param merchantId - Authenticated merchant identifier (creator)
   */
  static async deleteInvoiceForMerchant(
    invoiceId: string,
    merchantId: string
  ): Promise<boolean> {
    if (!invoiceId || !merchantId) return false
    if (!ObjectId.isValid(invoiceId)) return false

    try {
      const collection = await this.getCollection()
      const result = await collection.deleteOne({
        _id: new ObjectId(invoiceId),
        merchantId,
      })

      return result.deletedCount > 0
    } catch (error) {
      console.error("[InvoiceRepository.deleteInvoiceForMerchant] Error:", error)
      throw new Error("Failed to delete invoice record.")
    }
  }
}
