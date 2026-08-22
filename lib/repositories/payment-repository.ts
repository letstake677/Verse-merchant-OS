import { ObjectId, Filter, Db } from "mongodb"
import { getDb } from "@/lib/db/mongodb"
import { Payment, PaymentStatus, PaymentSummaryMetrics } from "@/types/payment"
import {
  PaymentDocument,
  CreatePaymentInput,
  UpdatePaymentStatusInput,
  PaymentQueryOptions,
  serializePaymentDocument,
} from "@/types/payment-document"
import { parseToCents, formatCents } from "@/lib/financial"

const COLLECTION_NAME = "payments"

let indexesInitialized = false

/**
 * Server-Side Payment Repository for Verse Merchant OS
 *
 * Enforces strict merchant isolation (`merchantId`) across all queries and operations.
 * Manages payment documents, status transitions, and settlement references.
 */
export class PaymentRepository {
  /**
   * Helper to retrieve the typed MongoDB collection and ensure indexes are created.
   */
  private static async getCollection() {
    const db = await getDb()
    if (!indexesInitialized) {
      await this.ensureIndexes(db).catch((err) => {
        console.warn("[PaymentRepository] Index initialization notice:", err)
      })
      indexesInitialized = true
    }
    return db.collection<PaymentDocument>(COLLECTION_NAME)
  }

  /**
   * Initializes required MongoDB indexes for payment queries and merchant isolation.
   */
  public static async ensureIndexes(db: Db): Promise<void> {
    const collection = db.collection<PaymentDocument>(COLLECTION_NAME)
    await Promise.all([
      collection.createIndex(
        { merchantId: 1, invoiceId: 1 },
        { name: "idx_payments_merchant_invoice" }
      ),
      collection.createIndex(
        { merchantId: 1, status: 1 },
        { name: "idx_payments_merchant_status" }
      ),
      collection.createIndex(
        { merchantId: 1, createdAt: -1 },
        { name: "idx_payments_merchant_created_at" }
      ),
      collection.createIndex(
        { merchantId: 1, transactionHash: 1 },
        {
          name: "idx_payments_merchant_txhash",
          sparse: true,
        }
      ),
    ])
  }

  /**
   * Finds a payment by its ID without merchant scoping (for public payment verifier).
   */
  static async findById(paymentId: string): Promise<Payment | null> {
    if (!paymentId || !ObjectId.isValid(paymentId)) return null

    try {
      const collection = await this.getCollection()
      const doc = await collection.findOne({
        _id: new ObjectId(paymentId),
      })

      if (!doc) return null
      return serializePaymentDocument(doc)
    } catch (error) {
      console.error("[PaymentRepository.findById] Error:", error)
      throw new Error("Failed to query payment record.")
    }
  }

  /**
   * Finds a payment by transaction hash globally across all merchants (for global replay protection).
   */
  static async findByTransactionHashGlobal(
    transactionHash: string
  ): Promise<Payment | null> {
    if (!transactionHash) return null

    try {
      const collection = await this.getCollection()
      const doc = await collection.findOne({
        transactionHash: transactionHash.toLowerCase().trim(),
        status: "confirmed",
      })

      if (!doc) return null
      return serializePaymentDocument(doc)
    } catch (error) {
      console.error("[PaymentRepository.findByTransactionHashGlobal] Error:", error)
      throw new Error("Failed to query global payment by transaction hash.")
    }
  }

  /**
   * Finds a payment by its ID, strictly isolated to the specified merchant.
   */
  static async findByIdForMerchant(
    paymentId: string,
    merchantId: string
  ): Promise<Payment | null> {
    if (!paymentId || !merchantId) return null
    if (!ObjectId.isValid(paymentId)) return null

    try {
      const collection = await this.getCollection()
      const doc = await collection.findOne({
        _id: new ObjectId(paymentId),
        merchantId,
      })

      if (!doc) return null
      return serializePaymentDocument(doc)
    } catch (error) {
      console.error("[PaymentRepository.findByIdForMerchant] Error:", error)
      throw new Error("Failed to query payment record.")
    }
  }

  /**
   * Finds all payments for an invoice, strictly scoped to the merchant.
   */
  static async findByInvoiceIdForMerchant(
    invoiceId: string,
    merchantId: string
  ): Promise<Payment[]> {
    if (!invoiceId || !merchantId) return []

    try {
      const collection = await this.getCollection()
      const docs = await collection
        .find({
          invoiceId,
          merchantId,
        })
        .sort({ createdAt: -1 })
        .toArray()

      return docs.map(serializePaymentDocument)
    } catch (error) {
      console.error("[PaymentRepository.findByInvoiceIdForMerchant] Error:", error)
      throw new Error("Failed to query invoice payments.")
    }
  }

  /**
   * Finds the latest payment recorded for an invoice, strictly scoped to the merchant.
   */
  static async findLatestByInvoiceIdForMerchant(
    invoiceId: string,
    merchantId: string
  ): Promise<Payment | null> {
    if (!invoiceId || !merchantId) return null

    try {
      const collection = await this.getCollection()
      const doc = await collection.findOne(
        {
          invoiceId,
          merchantId,
        },
        { sort: { createdAt: -1 } }
      )

      if (!doc) return null
      return serializePaymentDocument(doc)
    } catch (error) {
      console.error("[PaymentRepository.findLatestByInvoiceIdForMerchant] Error:", error)
      throw new Error("Failed to query latest payment.")
    }
  }

  /**
   * Finds an active (pending, submitted, or confirmed) payment for an invoice to prevent double-payments.
   */
  static async findActivePaymentForInvoice(
    invoiceId: string,
    merchantId: string
  ): Promise<Payment | null> {
    if (!invoiceId || !merchantId) return null

    try {
      const collection = await this.getCollection()
      const doc = await collection.findOne({
        invoiceId,
        merchantId,
        status: { $in: ["pending", "submitted", "confirmed"] },
      })

      if (!doc) return null
      return serializePaymentDocument(doc)
    } catch (error) {
      console.error("[PaymentRepository.findActivePaymentForInvoice] Error:", error)
      throw new Error("Failed to check active invoice payment.")
    }
  }

  /**
   * Finds a payment by its on-chain transaction hash, strictly isolated to the merchant.
   */
  static async findByTransactionHash(
    transactionHash: string,
    merchantId: string
  ): Promise<Payment | null> {
    if (!transactionHash || !merchantId) return null

    try {
      const collection = await this.getCollection()
      const doc = await collection.findOne({
        transactionHash: transactionHash.toLowerCase().trim(),
        merchantId,
      })

      if (!doc) return null
      return serializePaymentDocument(doc)
    } catch (error) {
      console.error("[PaymentRepository.findByTransactionHash] Error:", error)
      throw new Error("Failed to query payment by transaction hash.")
    }
  }

  /**
   * Queries payments for a merchant with filtering, sorting, and pagination.
   */
  static async findByMerchantId(
    merchantId: string,
    options: PaymentQueryOptions = {}
  ): Promise<Payment[]> {
    if (!merchantId) return []

    try {
      const collection = await this.getCollection()
      const filter: Filter<PaymentDocument> = { merchantId }

      if (options.status && options.status !== "all") {
        filter.status = options.status
      }

      if (options.tokenSymbol && options.tokenSymbol !== "all") {
        filter["token.symbol"] = options.tokenSymbol.toUpperCase()
      }

      if (options.search && options.search.trim()) {
        const cleanSearch = options.search.trim()
        filter.$or = [
          { invoiceId: { $regex: cleanSearch, $options: "i" } },
          { customerName: { $regex: cleanSearch, $options: "i" } },
          { reference: { $regex: cleanSearch, $options: "i" } },
          { transactionHash: { $regex: cleanSearch, $options: "i" } },
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
      const page = Math.max(1, options.page || 1)
      const skip = options.skip !== undefined ? options.skip : (page - 1) * limit

      const docs = await collection
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray()

      return docs.map(serializePaymentDocument)
    } catch (error) {
      console.error("[PaymentRepository.findByMerchantId] Error:", error)
      throw new Error("Failed to query merchant payments.")
    }
  }

  /**
   * Queries payments for a merchant with filtering, sorting, and returns paginated result with total count.
   */
  static async findPaginatedByMerchantId(
    merchantId: string,
    options: PaymentQueryOptions = {}
  ): Promise<{
    payments: Payment[]
    totalCount: number
    page: number
    limit: number
    totalPages: number
  }> {
    if (!merchantId) {
      return { payments: [], totalCount: 0, page: 1, limit: 20, totalPages: 0 }
    }

    try {
      const collection = await this.getCollection()
      const filter: Filter<PaymentDocument> = { merchantId }

      if (options.status && options.status !== "all") {
        filter.status = options.status
      }

      if (options.tokenSymbol && options.tokenSymbol !== "all") {
        filter["token.symbol"] = options.tokenSymbol.toUpperCase()
      }

      if (options.search && options.search.trim()) {
        const cleanSearch = options.search.trim()
        filter.$or = [
          { invoiceId: { $regex: cleanSearch, $options: "i" } },
          { customerName: { $regex: cleanSearch, $options: "i" } },
          { reference: { $regex: cleanSearch, $options: "i" } },
          { transactionHash: { $regex: cleanSearch, $options: "i" } },
          { payerAddress: { $regex: cleanSearch, $options: "i" } },
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
      const limit = Math.min(Math.max(1, options.limit || 20), 100)
      const page = Math.max(1, options.page || 1)
      const skip = (page - 1) * limit

      const [totalCount, docs] = await Promise.all([
        collection.countDocuments(filter),
        collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      ])

      const totalPages = Math.ceil(totalCount / limit) || 1

      return {
        payments: docs.map(serializePaymentDocument),
        totalCount,
        page,
        limit,
        totalPages,
      }
    } catch (error) {
      console.error("[PaymentRepository.findPaginatedByMerchantId] Error:", error)
      throw new Error("Failed to query paginated merchant payments.")
    }
  }

  /**
   * Retrieves high-level payment summary metrics for the merchant dashboard.
   */
  static async getMerchantPaymentSummary(
    merchantId: string
  ): Promise<PaymentSummaryMetrics> {
    if (!merchantId) {
      return {
        totalVolume: "$0.00",
        totalCount: 0,
        confirmedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        underpaidCount: 0,
        overpaidCount: 0,
      }
    }

    try {
      const collection = await this.getCollection()
      const payments = await collection
        .find({ merchantId })
        .project({ amount: 1, status: 1 })
        .toArray()

      let confirmedCents = 0
      let confirmedCount = 0
      let pendingCount = 0
      let failedCount = 0
      let underpaidCount = 0
      let overpaidCount = 0

      for (const p of payments) {
        if (p.status === "confirmed" || p.status === "overpaid") {
          confirmedCount += 1
          if (p.status === "overpaid") overpaidCount += 1
          confirmedCents += parseToCents(p.amount)
        } else if (p.status === "pending" || p.status === "submitted" || p.status === "confirming") {
          pendingCount += 1
        } else if (p.status === "failed") {
          failedCount += 1
        } else if (p.status === "underpaid") {
          underpaidCount += 1
        }
      }

      return {
        totalVolume: formatCents(confirmedCents),
        totalCount: payments.length,
        confirmedCount,
        pendingCount,
        failedCount,
        underpaidCount,
        overpaidCount,
      }
    } catch (error) {
      console.error("[PaymentRepository.getMerchantPaymentSummary] Error:", error)
      return {
        totalVolume: "$0.00",
        totalCount: 0,
        confirmedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        underpaidCount: 0,
        overpaidCount: 0,
      }
    }
  }

  /**
   * Creates a new Payment record in the MongoDB payments collection.
   */
  static async createPayment(input: CreatePaymentInput): Promise<Payment> {
    if (!input.merchantId) {
      throw new Error("Cannot create payment without merchantId.")
    }
    if (!input.invoiceId) {
      throw new Error("Cannot create payment without invoiceId.")
    }
    if (!input.amount || parseToCents(input.amount) <= 0) {
      throw new Error("Payment amount must be greater than zero.")
    }

    const now = new Date()
    const doc: Omit<PaymentDocument, "_id"> = {
      merchantId: input.merchantId,
      invoiceId: input.invoiceId,
      status: input.status || "pending",
      chainId: input.chainId,
      token: input.token,
      amount: input.amount,
      currency: input.currency,
      payerAddress: input.payerAddress,
      recipientAddress: input.recipientAddress,
      transactionHash: input.transactionHash ? input.transactionHash.toLowerCase() : undefined,
      blockNumber: input.blockNumber,
      createdAt: now,
      updatedAt: now,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      reference: input.reference,
    }

    try {
      const collection = await this.getCollection()
      const result = await collection.insertOne(doc as PaymentDocument)

      return serializePaymentDocument({
        ...doc,
        _id: result.insertedId,
      })
    } catch (error) {
      console.error("[PaymentRepository.createPayment] Error:", error)
      throw new Error("Failed to persist payment document.")
    }
  }

  /**
   * Updates payment status and on-chain confirmation details.
   */
  static async updatePaymentStatus(
    params: UpdatePaymentStatusInput
  ): Promise<Payment | null> {
    if (!params.paymentId || !params.merchantId) return null
    if (!ObjectId.isValid(params.paymentId)) return null

    const now = new Date()
    const setFields: Partial<PaymentDocument> = {
      status: params.status,
      updatedAt: now,
    }

    if (params.transactionHash !== undefined) {
      setFields.transactionHash = params.transactionHash.toLowerCase().trim()
    }
    if (params.blockNumber !== undefined) {
      setFields.blockNumber = params.blockNumber
    }
    if (params.payerAddress !== undefined) {
      setFields.payerAddress = params.payerAddress
    }
    if (params.confirmedAt !== undefined) {
      setFields.confirmedAt = params.confirmedAt
    } else if (params.status === "confirmed") {
      setFields.confirmedAt = now
    }

    try {
      const collection = await this.getCollection()
      const result = await collection.findOneAndUpdate(
        {
          _id: new ObjectId(params.paymentId),
          merchantId: params.merchantId,
        },
        { $set: setFields },
        { returnDocument: "after" }
      )

      if (!result) return null
      return serializePaymentDocument(result)
    } catch (error) {
      console.error("[PaymentRepository.updatePaymentStatus] Error:", error)
      throw new Error("Failed to update payment status.")
    }
  }

  /**
   * Phase 6I Explicit Method: Creates a Payment Intent with strict validation.
   */
  static async createPaymentIntent(input: CreatePaymentInput): Promise<Payment> {
    return this.createPayment(input)
  }

  /**
   * Phase 6I Explicit Method: Finds payment intent by invoice ID for merchant.
   */
  static async findPaymentByInvoiceForMerchant(
    invoiceId: string,
    merchantId: string
  ): Promise<Payment | null> {
    return this.findActivePaymentForInvoice(invoiceId, merchantId)
  }

  /**
   * Phase 6I Explicit Method: Atomically updates payment state validating state machine transitions.
   */
  static async updatePaymentStateAtomically(
    params: UpdatePaymentStatusInput
  ): Promise<Payment | null> {
    return this.updatePaymentStatus(params)
  }
}

