import { MongoClient, Db, MongoClientOptions } from "mongodb"
import { MemoryDb } from "./memory-db"

/**
 * MongoDB Atlas Connection Management for Verse Merchant OS
 * 
 * Implements cached connection pooling for Next.js App Router development & production.
 * Ensures connections are not recreated across hot-reloads in development.
 * Provides a resilient in-memory database fallback if MONGODB_URI is not set.
 */

const DEFAULT_DB_NAME = "verse-merchant-os"

// Global scope declaration for connection caching across Next.js dev reloads
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
  var _verseFallbackMemoryDb: MemoryDb | undefined
}

/**
 * Sanitizes and extracts the raw MongoDB connection URI.
 * Handles common copy-paste issues like quotes, whitespace, or accidental "MONGODB_URI=" prefix.
 */
export function getSanitizedMongoUri(): string | null {
  let uri = process.env.MONGODB_URI?.trim()
  if (!uri) return null

  // Remove accidental quotes wrapping the URI (e.g. "mongodb+srv://..." or 'mongodb+srv://...')
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim()
  }

  // Remove accidental "MONGODB_URI=" prefix if pasted into the value field
  if (uri.startsWith("MONGODB_URI=")) {
    uri = uri.replace(/^MONGODB_URI=\s*/, "").trim()
  }

  // Remove wrapping quotes again if present after key stripping
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim()
  }

  return uri.length > 0 ? uri : null
}

/**
 * Returns whether MONGODB_URI is defined and valid in the environment.
 */
export function isMongoConfigured(): boolean {
  const uri = getSanitizedMongoUri()
  return Boolean(uri && (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")))
}

/**
 * Retrieves the configured database name.
 */
export function getDbName(): string {
  return process.env.MONGODB_DB_NAME?.trim() || DEFAULT_DB_NAME
}

/**
 * Retrieves or establishes the cached MongoClient connection promise.
 * Fails fast with a clean error if MONGODB_URI is missing.
 */
export function getMongoClient(): Promise<MongoClient> {
  if (typeof window !== "undefined") {
    throw new Error(
      "Security Error: MongoDB database utilities must only be executed in a server-side context."
    )
  }

  const uri = getSanitizedMongoUri()
  if (!uri) {
    return Promise.reject(
      new Error(
        "Database Configuration Error: MONGODB_URI is not set. Please define MONGODB_URI in your environment variables."
      )
    )
  }

  const options: MongoClientOptions = {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  }

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR.
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  } else {
    // In production mode, reuse the pooled client promise.
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options)
      global._mongoClientPromise = client.connect()
    }
    return global._mongoClientPromise
  }
}

/**
 * Retrieves the MongoDB Database instance (or resilient in-memory fallback if not yet configured).
 * @param customDbName Optional override for database name.
 */
export async function getDb(customDbName?: string): Promise<Db> {
  const dbName = customDbName || getDbName()

  if (!isMongoConfigured()) {
    if (!global._verseFallbackMemoryDb) {
      global._verseFallbackMemoryDb = new MemoryDb(dbName)
    }
    return global._verseFallbackMemoryDb as unknown as Db
  }

  try {
    const client = await getMongoClient()
    return client.db(dbName)
  } catch (err) {
    console.warn("[MongoDB] Remote connection error, falling back to resilient storage:", err)
    if (!global._verseFallbackMemoryDb) {
      global._verseFallbackMemoryDb = new MemoryDb(dbName)
    }
    return global._verseFallbackMemoryDb as unknown as Db
  }
}

/**
 * Gracefully closes the active MongoDB client connection if open.
 */
export async function closeMongoConnection(): Promise<void> {
  if (global._mongoClientPromise) {
    try {
      const client = await global._mongoClientPromise
      await client.close()
    } catch {
      // Ignore close errors during teardown
    } finally {
      global._mongoClientPromise = undefined
    }
  }
}
