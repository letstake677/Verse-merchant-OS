import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { generateSiweNonce } from "viem/siwe"
import { signToken, NONCE_COOKIE_NAME, NONCE_TTL_SECONDS } from "@/lib/auth/session"
import { checkRateLimit, createRateLimitResponse } from "@/lib/auth/rate-limiter"
import { AppLogger } from "@/lib/observability/logger"

/**
 * GET /api/auth/nonce
 * Generates a cryptographically secure random nonce for EIP-4361 / SIWE authentication.
 * Protected by rate limiting.
 * Signs the nonce with HMAC-SHA256 and stores it in a short-lived HttpOnly, SameSite=Lax cookie.
 * Returns the raw nonce string to the client for constructing the SIWE message.
 */
export async function GET(req: NextRequest) {
  // 1. Enforce rate limiting on SIWE nonce requests
  const rateLimit = checkRateLimit(req, "siwe_nonce")
  if (rateLimit.limited) {
    AppLogger.warn("[Auth:Nonce] Rate limit exceeded for IP", { ip: req.headers.get("x-forwarded-for") || "unknown" })
    return createRateLimitResponse(rateLimit.retryAfterSec)
  }

  try {
    const nonce = generateSiweNonce()
    const issuedAt = Date.now()
    const expiresAt = issuedAt + NONCE_TTL_SECONDS * 1000

    // HMAC sign the nonce payload to prevent client-side forgery or tampering
    const signedNonceToken = await signToken({
      nonce,
      type: "siwe_nonce",
      iat: issuedAt,
      expiresAt,
    })

    const cookieStore = await cookies()

    // Store signed token in a secure HttpOnly cookie
    cookieStore.set(NONCE_COOKIE_NAME, signedNonceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: NONCE_TTL_SECONDS,
    })

    AppLogger.auditAuth("nonce_generated", { action: "nonce_created" })

    return NextResponse.json({
      ok: true,
      nonce,
      expiresIn: NONCE_TTL_SECONDS,
    })
  } catch (error) {
    AppLogger.error("[GET /api/auth/nonce] Error generating cryptographic nonce:", error)
    return NextResponse.json(
      { ok: false, message: "Authentication service temporarily unavailable." },
      { status: 500 }
    )
  }
}
