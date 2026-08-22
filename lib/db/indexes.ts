import { Db } from "mongodb"
import { getDb, isMongoConfigured } from "./mongodb"
import { AppLogger } from "@/lib/observability/logger"

/**
 * MongoDB Index Initialization and Management for Verse Merchant OS (Phase 6N)
 *
 * Defines explicit indexes tailored for merchant-scoped queries, transaction uniqueness constraints,
 * payment intent lookups, and audit event logs.
 * Safe to execute multiple times (idempotent).
 */

export const INVOICE_INDEXES = [
  // Compound unique index ensuring invoice numbers are distinct per merchant
  {
    key: { merchantId: 1, invoiceNumber: 1 },
    options: { unique: true, name: "merchantId_1_invoiceNumber_1_unique" },
  },
  // Chronological query index for merchant dashboard & invoice listings
  {
    key: { merchantId: 1, createdAt: -1 },
    options: { name: "merchantId_1_createdAt_-1" },
  },
  // Status filter index for open, paid, overdue invoices
  {
    key: { merchantId: 1, status: 1 },
    options: { name: "merchantId_1_status_1" },
  },
]

export const MERCHANT_INDEXES = [
  // Unique index for the authoritative wallet address
  {
    key: { walletAddress: 1 },
    options: { unique: true, name: "walletAddress_1_unique", sparse: true },
  },
  // Index for session version lookups
  {
    key: { sessionVersion: 1 },
    options: { name: "sessionVersion_1" },
  },
]

export const PAYMENT_INDEXES = [
  // Transaction hash global unique index (sparse to allow unconfirmed/pending without hash)
  {
    key: { transactionHash: 1 },
    options: { unique: true, name: "transactionHash_1_unique", sparse: true },
  },
  // Merchant scoped chronological listing
  {
    key: { merchantId: 1, createdAt: -1 },
    options: { name: "merchantId_1_createdAt_-1" },
  },
  // Invoice lookup index
  {
    key: { invoiceId: 1 },
    options: { name: "invoiceId_1" },
  },
  // Status filter
  {
    key: { merchantId: 1, status: 1 },
    options: { name: "merchantId_1_status_1" },
  },
]

export const PAYMENT_INTENT_INDEXES = [
  {
    key: { invoiceId: 1 },
    options: { name: "invoiceId_1" },
  },
  {
    key: { merchantId: 1 },
    options: { name: "merchantId_1" },
  },
  {
    key: { expiresAt: 1 },
    options: { name: "expiresAt_1" },
  },
]

export const PAYMENT_EVENT_INDEXES = [
  {
    key: { paymentId: 1, createdAt: -1 },
    options: { name: "paymentId_1_createdAt_-1" },
  },
  {
    key: { merchantId: 1, createdAt: -1 },
    options: { name: "merchantId_1_createdAt_-1" },
  },
]

/**
 * Ensures indexes exist on a target collection idempotently.
 */
async function ensureCollectionIndexes(
  db: Db,
  collectionName: string,
  indexes: Array<{ key: Record<string, number>; options: Record<string, unknown> }>
): Promise<void> {
  const collection = db.collection(collectionName)
  for (const index of indexes) {
    try {
      await collection.createIndex(index.key as any, index.options as any)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Index exists with same spec is a standard harmless notice
      if (!msg.includes("already exists")) {
        AppLogger.warn(`[MongoDB Indexes] Notice for ${collectionName}.${index.options.name}: ${msg}`)
      }
    }
  }
}

/**
 * Top-level utility to initialize all application database indexes.
 */
export async function initAllIndexes(): Promise<{ ok: boolean; message: string }> {
  if (typeof window !== "undefined") {
    return {
      ok: false,
      message: "Index initialization must be executed in a server-side context.",
    }
  }

  if (!isMongoConfigured()) {
    return {
      ok: false,
      message: "MONGODB_URI is not configured. Skipped index initialization.",
    }
  }

  try {
    const db = await getDb()
    await Promise.all([
      ensureCollectionIndexes(db, "merchants", MERCHANT_INDEXES),
      ensureCollectionIndexes(db, "invoices", INVOICE_INDEXES),
      ensureCollectionIndexes(db, "payments", PAYMENT_INDEXES),
      ensureCollectionIndexes(db, "payment_intents", PAYMENT_INTENT_INDEXES),
      ensureCollectionIndexes(db, "payment_events", PAYMENT_EVENT_INDEXES),
    ])

    AppLogger.info("[MongoDB] All database indexes verified and initialized.")
    return {
      ok: true,
      message: "All database indexes initialized successfully.",
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during index initialization"

    AppLogger.error("[MongoDB] Failed to initialize database indexes:", error)
    return {
      ok: false,
      message: `Failed to initialize indexes: ${errorMessage}`,
    }
  }
}
