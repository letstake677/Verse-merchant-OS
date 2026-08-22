import { getMongoClient, getDbName, isMongoConfigured } from "./mongodb"

export interface DatabaseHealthResult {
  ok: boolean
  message: string
  database?: string
  latencyMs?: number
}

/**
 * Server-side MongoDB Health Check Utility
 * Executes a lightweight `ping` command against the MongoDB deployment.
 * Never leaks credentials or connection strings in error outputs.
 */
export async function checkMongoHealth(): Promise<DatabaseHealthResult> {
  if (typeof window !== "undefined") {
    return {
      ok: false,
      message: "Health check cannot be executed on the client.",
    }
  }

  if (!isMongoConfigured()) {
    return {
      ok: false,
      message: "MONGODB_URI is not configured in environment variables.",
    }
  }

  const startTime = Date.now()

  try {
    const client = await getMongoClient()
    const dbName = getDbName()
    
    // Ping the admin database
    await client.db("admin").command({ ping: 1 })
    
    const latencyMs = Date.now() - startTime

    return {
      ok: true,
      message: "MongoDB Atlas connection is healthy and responsive.",
      database: dbName,
      latencyMs,
    }
  } catch (error) {
    const latencyMs = Date.now() - startTime
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database connection error"

    // Sanitize any accidental connection string fragments in error messages
    const sanitizedMessage = errorMessage.replace(
      /mongodb(\+srv)?:\/\/[^@]+@/gi,
      "mongodb://***:***@"
    )

    return {
      ok: false,
      message: `Database connectivity failed: ${sanitizedMessage}`,
      database: getDbName(),
      latencyMs,
    }
  }
}
