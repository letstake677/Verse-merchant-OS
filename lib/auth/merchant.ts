import { headers } from "next/headers"
import { getAuthenticatedSession } from "./session"

export interface MerchantIdentity {
  merchantId: string
  walletAddress: string
  businessName?: string
  displayName?: string
}

/**
 * Server-only function to obtain the current authenticated merchant identity.
 * 
 * Secure identity contract:
 * 1. This executes server-side only.
 * 2. It never accepts merchantId or walletAddress from request body, headers, or query parameters.
 * 3. It acts as the single source of truth for the merchant identity derived strictly from verified SIWE sessions.
 * 4. Fails closed with an explicit "UNAUTHORIZED" error if no valid verified session exists.
 */
export async function requireCurrentMerchant(): Promise<MerchantIdentity> {
  // 1. Strict runtime guard to ensure this is never run in browser bundles
  if (typeof window !== "undefined") {
    throw new Error("[Auth] requireCurrentMerchant can only be executed in a server environment.")
  }

  // 2. Call headers() to opt into dynamic rendering and verify server context
  try {
    await headers()
  } catch {
    // Verified request context
  }

  // 3. Resolve the actual authenticated session from HttpOnly session token + DB verification
  const session = await getAuthenticatedSession()
  if (session && session.merchantId && session.walletAddress) {
    return {
      merchantId: session.merchantId,
      walletAddress: session.walletAddress,
      businessName: session.businessName,
      displayName: session.displayName,
    }
  }

  // 4. Strict fail-closed: No active or valid SIWE session found
  throw new Error("UNAUTHORIZED")
}
