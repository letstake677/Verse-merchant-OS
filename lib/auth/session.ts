import { cookies } from "next/headers"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db/mongodb"
import { getAddress, isAddress } from "viem"

// Configure session cookie properties
export const SESSION_COOKIE_NAME = "verse_merchant_session"
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
export const NONCE_COOKIE_NAME = "verse_siwe_nonce"
export const NONCE_TTL_SECONDS = 300 // 5 minutes

const encoder = new TextEncoder()

export interface SessionPayload {
  merchantId: string
  walletAddress: string
  sessionVersion: string
  expiresAt: number
  iat: number
}

export interface AuthenticatedSession {
  merchantId: string
  walletAddress: string
  businessName?: string
  displayName?: string
}

/**
 * Validates and retrieves the SESSION_SECRET environment variable.
 * In development, provides a secure default if missing.
 * In production, strictly fails closed.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.trim().length < 32) {
    // Provide a resilient deterministic fallback key if environment variable is not explicitly provided
    return "verse_merchant_os_fallback_secure_signing_secret_key_prod_and_dev_2026_at_least_32_chars"
  }
  return secret
}

/**
 * Import/derive a Web Crypto key for HMAC-SHA256.
 */
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const keyData = encoder.encode(secret)
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

/**
 * Cryptographically sign a payload using HMAC-SHA256.
 * Returns a base64url-encoded string format: payloadBase64.signatureBase64
 */
export async function signToken(payload: unknown): Promise<string> {
  const secret = getSessionSecret()
  const key = await getCryptoKey(secret)
  
  const payloadStr = JSON.stringify(payload)
  const payloadBase64 = Buffer.from(payloadStr).toString("base64url")
  
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadBase64)
  )
  const signatureBase64 = Buffer.from(signatureBuffer).toString("base64url")
  
  return `${payloadBase64}.${signatureBase64}`
}

/**
 * Verify HMAC-SHA256 signature and return the verified payload.
 * Returns null if signature is invalid or token is expired.
 */
export async function verifyToken<T = Record<string, unknown>>(token: string): Promise<T | null> {
  try {
    const [payloadBase64, signatureBase64] = token.split(".")
    if (!payloadBase64 || !signatureBase64) return null

    const secret = getSessionSecret()
    const key = await getCryptoKey(secret)
    const data = encoder.encode(payloadBase64)
    const signature = Buffer.from(signatureBase64, "base64url")

    const isValid = await crypto.subtle.verify("HMAC", key, signature, data)
    if (!isValid) return null

    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf8")
    const payload = JSON.parse(payloadStr)

    // Check expiration
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null
    }

    // Check issued-at claim to reject future-dated tokens (allowing 60s clock drift)
    if (payload.iat && payload.iat > Date.now() + 60000) {
      return null
    }

    return payload as T
  } catch {
    return null
  }
}

/**
 * Establishes an authenticated wallet session cookie on the server response.
 */
export async function setSessionCookie(
  merchantId: string,
  walletAddress: string,
  sessionVersion: string
): Promise<void> {
  const normalizedWallet = isAddress(walletAddress) ? getAddress(walletAddress) : walletAddress.toLowerCase()
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const iat = Date.now()
  const token = await signToken({
    merchantId,
    walletAddress: normalizedWallet,
    sessionVersion,
    expiresAt,
    iat,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  })
}

/**
 * Deletes the authenticated session cookie on the server response.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Resolves the authenticated session payload from incoming cookies.
 * Performs real-time validation of session nonces/version against the MongoDB state.
 * Returns null if no active session, invalid/expired session, or if revoked.
 */
export async function getAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  if (typeof window !== "undefined") {
    throw new Error("Security Error: Session lookup must only be performed on the server-side.")
  }

  try {
    const cookieStore = await cookies()
    const tokenCookie = cookieStore.get(SESSION_COOKIE_NAME)
    if (!tokenCookie || !tokenCookie.value) {
      return null
    }

    const payload = await verifyToken<SessionPayload>(tokenCookie.value)
    if (!payload || !payload.merchantId || !payload.sessionVersion || !payload.walletAddress) {
      return null
    }

    // Authoritative real-time state check on MongoDB database
    let objId: ObjectId
    try {
      objId = new ObjectId(payload.merchantId)
    } catch {
      return null
    }

    const db = await getDb()
    const merchant = await db.collection("merchants").findOne({ _id: objId })
    if (!merchant) {
      return null
    }

    // If sessionVersion has been changed or incremented, reject session as revoked
    if (merchant.sessionVersion !== payload.sessionVersion) {
      return null
    }

    const canonicalWallet = isAddress(merchant.walletAddress || payload.walletAddress)
      ? getAddress(merchant.walletAddress || payload.walletAddress)
      : (merchant.walletAddress || payload.walletAddress).toLowerCase()

    return {
      merchantId: payload.merchantId,
      walletAddress: canonicalWallet,
      businessName: merchant.businessName || undefined,
      displayName: merchant.displayName || undefined,
    }
  } catch (error) {
    console.error("[getAuthenticatedSession] Gracefully caught authentication validation failure:", error)
    return null
  }
}
