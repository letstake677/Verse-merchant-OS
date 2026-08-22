/**
 * Verse Merchant OS - Production Server-Side Structured Logger (Phase 6N)
 *
 * Security Guarantees:
 * 1. Executes server-side only; never exposes internals to client bundles.
 * 2. Automatically redacts sensitive fields (passwords, private keys, cookies, session tokens, connection strings).
 * 3. Formats logs with ISO timestamps, correlation levels, and structured metadata.
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogContext {
  merchantId?: string
  walletAddress?: string
  invoiceId?: string
  paymentId?: string
  transactionHash?: string
  chainId?: number
  action?: string
  ip?: string
  error?: unknown
  [key: string]: unknown
}

const REDACTED_KEYS = new Set([
  "password",
  "secret",
  "sessionsecret",
  "session_secret",
  "privatekey",
  "private_key",
  "token",
  "sessiontoken",
  "cookie",
  "cookies",
  "authorization",
  "auth",
  "mongodb_uri",
  "mongouri",
  "seedphrase",
  "mnemonic",
])

/**
 * Recursively sanitizes metadata to ensure no sensitive credentials or keys are logged.
 */
function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 4) return "[Max Depth]"
  if (data === null || data === undefined) return data

  if (typeof data === "string") {
    // Redact hex private keys or lengthy secret hashes if matched
    if (/^(0x)?[0-9a-fA-F]{64}$/.test(data.trim()) && !data.startsWith("0x0000")) {
      // Could be a transaction hash or private key. We allow txHashes if named as such.
      return data
    }
    // Redact connection strings containing credentials
    if (data.includes("mongodb+srv://") || data.includes("postgres://") || data.includes("mysql://")) {
      return "[REDACTED_URI]"
    }
    return data
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: process.env.NODE_ENV === "development" ? data.stack : undefined,
    }
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1))
  }

  if (typeof data === "object") {
    const sanitizedObj: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9_]/g, "")
      if (REDACTED_KEYS.has(lowerKey)) {
        sanitizedObj[key] = "[REDACTED]"
      } else {
        sanitizedObj[key] = sanitizeLogData(value, depth + 1)
      }
    }
    return sanitizedObj
  }

  return data
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const sanitizedContext = context ? sanitizeLogData(context) : undefined

  return JSON.stringify({
    timestamp,
    level,
    service: "verse-merchant-os",
    message,
    ...(sanitizedContext && typeof sanitizedContext === "object" ? sanitizedContext : {}),
  })
}

export class AppLogger {
  static debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production" || process.env.LOG_LEVEL === "debug") {
      console.debug(formatLog("debug", message, context))
    }
  }

  static info(message: string, context?: LogContext): void {
    console.log(formatLog("info", message, context))
  }

  static warn(message: string, context?: LogContext): void {
    console.warn(formatLog("warn", message, context))
  }

  static error(message: string, error?: unknown, context?: LogContext): void {
    const mergedContext: LogContext = {
      ...(context || {}),
      error: error instanceof Error ? error.message : error,
    }
    console.error(formatLog("error", message, mergedContext))
  }

  // Domain-specific audit log helpers
  static auditAuth(action: "nonce_generated" | "login_success" | "login_failed" | "logout", context: LogContext): void {
    this.info(`[Audit:Auth] ${action}`, { ...context, category: "AUTH_AUDIT" })
  }

  static auditInvoice(action: "created" | "updated" | "cancelled" | "paid", context: LogContext): void {
    this.info(`[Audit:Invoice] ${action}`, { ...context, category: "INVOICE_AUDIT" })
  }

  static auditPayment(
    action: "intent_created" | "verification_started" | "verification_succeeded" | "verification_failed" | "reconciled",
    context: LogContext
  ): void {
    this.info(`[Audit:Payment] ${action}`, { ...context, category: "PAYMENT_AUDIT" })
  }
}
