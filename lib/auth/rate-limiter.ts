import { NextRequest, NextResponse } from "next/server"

// Server-only runtime guard
if (typeof window !== "undefined") {
  throw new Error("rate-limiter.ts is server-only.")
}

interface RateLimitRecord {
  timestamps: number[]
}

// In-memory rate limiting storage map
// Key: policyKey:clientIp
const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up memory periodically every 10 minutes
if (typeof global !== "undefined" && !(global as any).__rateLimitCleanerInterval) {
  ;(global as any).__rateLimitCleanerInterval = setInterval(() => {
    const now = Date.now()
    const expiryWindow = 15 * 60 * 1000 // 15 minutes window
    for (const [key, record] of rateLimitStore.entries()) {
      const activeTimestamps = record.timestamps.filter((ts) => now - ts < expiryWindow)
      if (activeTimestamps.length === 0) {
        rateLimitStore.delete(key)
      } else {
        rateLimitStore.set(key, { timestamps: activeTimestamps })
      }
    }
  }, 10 * 60 * 1000)
}

export type RateLimitPolicy =
  | "siwe_nonce"
  | "siwe_verify"
  | "public_checkout"
  | "payment_intent"
  | "payment_verify"
  | "payment_reconcile"
  | "invoices_api"

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export const RATE_LIMIT_POLICIES: Record<RateLimitPolicy, RateLimitConfig> = {
  siwe_nonce: { limit: 30, windowMs: 60 * 1000 }, // 30 nonces per min
  siwe_verify: { limit: 15, windowMs: 60 * 1000 }, // 15 verification attempts per min
  public_checkout: { limit: 60, windowMs: 60 * 1000 }, // 60 checkout lookups per min
  payment_intent: { limit: 40, windowMs: 60 * 1000 }, // 40 payment intents per min
  payment_verify: { limit: 30, windowMs: 60 * 1000 }, // 30 on-chain verifications per min
  payment_reconcile: { limit: 20, windowMs: 60 * 1000 }, // 20 reconciliations per min
  invoices_api: { limit: 100, windowMs: 60 * 1000 }, // 100 invoice calls per min
}

/**
 * Extracts client IP safely from proxy headers.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim()
    if (firstIp) return firstIp
  }
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp.trim()
  return "127.0.0.1"
}

/**
 * Checks if a request exceeds the specified rate limiting policy.
 */
export function checkRateLimit(
  req: NextRequest,
  policy: RateLimitPolicy = "siwe_verify"
): {
  limited: boolean
  remaining: number
  resetTime: number
  retryAfterSec: number
} {
  const config = RATE_LIMIT_POLICIES[policy] || { limit: 20, windowMs: 60000 }
  const clientIp = getClientIp(req)
  const storeKey = `${policy}:${clientIp}`
  const now = Date.now()

  const record = rateLimitStore.get(storeKey) || { timestamps: [] }
  const activeTimestamps = record.timestamps.filter((ts) => now - ts < config.windowMs)

  if (activeTimestamps.length >= config.limit) {
    const oldestActive = activeTimestamps[0]
    const resetTime = oldestActive + config.windowMs
    const retryAfterSec = Math.max(1, Math.ceil((resetTime - now) / 1000))

    rateLimitStore.set(storeKey, { timestamps: activeTimestamps })

    return {
      limited: true,
      remaining: 0,
      resetTime,
      retryAfterSec,
    }
  }

  activeTimestamps.push(now)
  rateLimitStore.set(storeKey, { timestamps: activeTimestamps })

  const remaining = Math.max(0, config.limit - activeTimestamps.length)
  const resetTime = now + config.windowMs
  const retryAfterSec = 0

  return {
    limited: false,
    remaining,
    resetTime,
    retryAfterSec,
  }
}

/**
 * Standard HTTP 429 Too Many Requests response helper.
 */
export function createRateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      message: `Too many requests. Please retry in ${retryAfterSec} second${retryAfterSec === 1 ? "" : "s"}.`,
      retryAfter: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    }
  )
}

/**
 * Backward-compatible helper.
 */
export function isRateLimited(
  req: NextRequest,
  limit: number = 3,
  windowMs: number = 60 * 1000
): { limited: boolean; remaining: number; resetTime: number } {
  const clientIp = getClientIp(req)
  const now = Date.now()
  const record = rateLimitStore.get(`legacy:${clientIp}`) || { timestamps: [] }
  const activeTimestamps = record.timestamps.filter((ts) => now - ts < windowMs)

  if (activeTimestamps.length >= limit) {
    const oldestActive = activeTimestamps[0]
    const resetTime = oldestActive + windowMs
    rateLimitStore.set(`legacy:${clientIp}`, { timestamps: activeTimestamps })
    return { limited: true, remaining: 0, resetTime }
  }

  activeTimestamps.push(now)
  rateLimitStore.set(`legacy:${clientIp}`, { timestamps: activeTimestamps })

  return {
    limited: false,
    remaining: limit - activeTimestamps.length,
    resetTime: now + windowMs,
  }
}
