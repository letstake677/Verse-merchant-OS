import { ObjectId, Db } from "mongodb"
import { getDb } from "@/lib/db/mongodb"

export interface PaymentEventDocument {
  _id?: ObjectId
  paymentId: string
  merchantId: string
  invoiceId: string
  eventType: "payment_created" | "payment_submitted" | "payment_confirmed" | "payment_failed" | "payment_reconciled"
  status: string
  transactionHash?: string
  blockNumber?: number
  actor: string // e.g. "system:polygon_verifier" | "merchant:manual_reconcile" | "payer:web3_modal"
  metadata?: Record<string, any>
  createdAt: Date
}

const COLLECTION_NAME = "payment_events"

export class PaymentEventRepository {
  private static async getCollection() {
    const db = await getDb()
    return db.collection<PaymentEventDocument>(COLLECTION_NAME)
  }

  static async recordEvent(event: Omit<PaymentEventDocument, "_id" | "createdAt">): Promise<void> {
    try {
      const collection = await this.getCollection()
      await collection.insertOne({
        ...event,
        createdAt: new Date(),
      })
    } catch (err) {
      console.error("[PaymentEventRepository] Error recording payment event:", err)
      // Non-blocking for primary settlement path
    }
  }

  static async findEventsForPayment(paymentId: string, merchantId: string): Promise<PaymentEventDocument[]> {
    if (!paymentId || !merchantId) return []
    try {
      const collection = await this.getCollection()
      const docs = await collection
        .find({ paymentId, merchantId })
        .sort({ createdAt: -1 })
        .toArray()
      return docs
    } catch (err) {
      console.error("[PaymentEventRepository] Error finding payment events:", err)
      return []
    }
  }
}
