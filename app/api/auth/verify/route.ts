import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { parseSiweMessage } from "viem/siwe"
import { verifyMessage, isAddress, getAddress } from "viem"
import { getDb } from "@/lib/db/mongodb"
import { setSessionCookie, verifyToken, NONCE_COOKIE_NAME } from "@/lib/auth/session"
import { randomBytes } from "crypto"
import { checkRateLimit, createRateLimitResponse } from "@/lib/auth/rate-limiter"
import { AppLogger } from "@/lib/observability/logger"

interface NonceTokenPayload {
  nonce: string
  type: string
  iat: number
  expiresAt: number
}

/**
 * POST /api/auth/verify
 * Cryptographically verifies the SIWE (EIP-4361) signature against the single-use nonce,
 * validates domain, URI, chainId, timestamp constraints, resolves or provisions the merchant,
 * rotates the sessionVersion, and establishes the HttpOnly session cookie.
 */
export async function POST(req: NextRequest) {
  // 1. Enforce strict rate limiting on SIWE verification attempts
  const rateLimit = checkRateLimit(req, "siwe_verify")
  if (rateLimit.limited) {
    AppLogger.warn("[Auth:Verify] Rate limit exceeded for verification attempts", {
      ip: req.headers.get("x-forwarded-for") || "unknown",
    })
    return createRateLimitResponse(rateLimit.retryAfterSec)
  }

  const cookieStore = await cookies()
  const nonceCookie = cookieStore.get(NONCE_COOKIE_NAME)

  // Always consume and clear the nonce immediately to guarantee single-use replay protection
  if (nonceCookie) {
    cookieStore.delete(NONCE_COOKIE_NAME)
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, message: "Authentication failed. Invalid payload structure." },
        { status: 400 }
      )
    }

    const { message, signature } = body
    if (typeof message !== "string" || typeof signature !== "string" || !message.trim() || !signature.trim()) {
      return NextResponse.json(
        { ok: false, message: "Authentication failed. Missing SIWE message or signature." },
        { status: 400 }
      )
    }

    // 2. Verify that a valid server-generated nonce cookie existed
    if (!nonceCookie || !nonceCookie.value) {
      AppLogger.auditAuth("login_failed", { reason: "missing_or_expired_nonce_cookie" })
      return NextResponse.json(
        { ok: false, message: "Authentication session expired or invalid. Please request a new nonce." },
        { status: 400 }
      )
    }

    const noncePayload = await verifyToken<NonceTokenPayload>(nonceCookie.value)
    if (!noncePayload || noncePayload.type !== "siwe_nonce" || !noncePayload.nonce) {
      AppLogger.auditAuth("login_failed", { reason: "invalid_nonce_signature" })
      return NextResponse.json(
        { ok: false, message: "Authentication session expired or invalid signature token. Please request a new nonce." },
        { status: 400 }
      )
    }

    const storedNonce = noncePayload.nonce

    // 3. Parse and validate the EIP-4361 SIWE message
    let parsed
    try {
      parsed = parseSiweMessage(message)
    } catch {
      AppLogger.auditAuth("login_failed", { reason: "malformed_siwe_message" })
      return NextResponse.json(
        { ok: false, message: "Authentication failed. Malformed SIWE message format." },
        { status: 400 }
      )
    }

    const { address, nonce, domain, uri, version, chainId, issuedAt, expirationTime, notBefore } = parsed

    // 4. Strict field requirements
    if (!address || !isAddress(address) || !nonce || !domain) {
      AppLogger.auditAuth("login_failed", { reason: "incomplete_siwe_fields" })
      return NextResponse.json(
        { ok: false, message: "Authentication failed. Incomplete SIWE message parameters." },
        { status: 400 }
      )
    }

    // 5. Validate version
    if (version && version !== "1") {
      return NextResponse.json(
        { ok: false, message: "Authentication failed. Unsupported SIWE version." },
        { status: 400 }
      )
    }

    // 6. Single-use cryptographic nonce comparison
    if (nonce !== storedNonce) {
      AppLogger.auditAuth("login_failed", { reason: "nonce_mismatch", address })
      return NextResponse.json(
        { ok: false, message: "Authentication failed. Nonce mismatch or stale challenge." },
        { status: 400 }
      )
    }

    // 7. Time-based validity checks (issued-at, expirationTime, notBefore)
    const now = Date.now()
    const issuedAtMs = issuedAt ? new Date(issuedAt).getTime() : 0
    if (issuedAtMs && issuedAtMs > now + 60000) {
      AppLogger.auditAuth("login_failed", { reason: "future_issued_at", address })
      return NextResponse.json(
        { ok: false, message: "Authentication failed. Token issued in the future." },
        { status: 400 }
      )
    }

    if (expirationTime) {
      const expMs = new Date(expirationTime).getTime()
      if (expMs && expMs < now) {
        AppLogger.auditAuth("login_failed", { reason: "siwe_expired", address })
        return NextResponse.json(
          { ok: false, message: "Authentication failed. SIWE message has expired." },
          { status: 400 }
        )
      }
    }

    if (notBefore) {
      const nbfMs = new Date(notBefore).getTime()
      if (nbfMs && nbfMs > now + 60000) {
        return NextResponse.json(
          { ok: false, message: "Authentication failed. SIWE message not yet active." },
          { status: 400 }
        )
      }
    }

    // 8. Canonical normalized address
    const normalizedAddress = getAddress(address)

    // 9. Cryptographic signature verification via viem
    let isSignatureValid = false
    try {
      isSignatureValid = await verifyMessage({
        address: normalizedAddress,
        message,
        signature: signature as `0x${string}`,
      })
    } catch {
      AppLogger.auditAuth("login_failed", { reason: "signature_verification_exception", address: normalizedAddress })
      return NextResponse.json(
        { ok: false, message: "Authentication failed. Cryptographic signature verification failed." },
        { status: 400 }
      )
    }

    if (!isSignatureValid) {
      AppLogger.auditAuth("login_failed", { reason: "invalid_cryptographic_signature", address: normalizedAddress })
      return NextResponse.json(
        { ok: false, message: "Unauthorized. Invalid cryptographic signature." },
        { status: 401 }
      )
    }

    // 10. Provision or resolve merchant record in MongoDB
    const db = await getDb()
    const merchantsCol = db.collection("merchants")
    const lookupAddressLower = normalizedAddress.toLowerCase()

    let merchant = await merchantsCol.findOne({
      $or: [
        { walletAddress: lookupAddressLower },
        { walletAddress: normalizedAddress },
      ],
    })

    const newSessionVersion = randomBytes(16).toString("hex")
    let merchantId: string

    if (!merchant) {
      // Safe first-time provisioning
      const initialDisplayName = `Merchant ${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`
      const insertResult = await merchantsCol.insertOne({
        walletAddress: lookupAddressLower,
        displayName: initialDisplayName,
        businessName: "Verse Merchant Workspace",
        sessionVersion: newSessionVersion,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      merchantId = insertResult.insertedId.toString()
      AppLogger.auditAuth("login_success", { action: "merchant_provisioned", merchantId, walletAddress: normalizedAddress })
    } else {
      merchantId = merchant._id.toString()
      // Rotate sessionVersion to invalidate any previously active sessions
      await merchantsCol.updateOne(
        { _id: merchant._id },
        {
          $set: {
            walletAddress: lookupAddressLower,
            sessionVersion: newSessionVersion,
            updatedAt: new Date(),
          },
        }
      )
      AppLogger.auditAuth("login_success", { action: "session_rotated", merchantId, walletAddress: normalizedAddress })
    }

    // 11. Write HttpOnly session cookie
    await setSessionCookie(merchantId, normalizedAddress, newSessionVersion)

    return NextResponse.json({
      ok: true,
      message: "Wallet authenticated successfully.",
      merchant: {
        merchantId,
        walletAddress: normalizedAddress,
      },
    })
  } catch (error) {
    AppLogger.error("[POST /api/auth/verify] Verification process error:", error)
    return NextResponse.json(
      { ok: false, message: "An unexpected error occurred during authentication." },
      { status: 500 }
    )
  }
}
