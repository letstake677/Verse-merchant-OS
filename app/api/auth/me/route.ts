import { NextResponse } from "next/server"
import { getAuthenticatedSession } from "@/lib/auth/session"

/**
 * GET /api/auth/me
 * Returns authenticated session metadata for the current verified wallet.
 * Fails with HTTP 401 if unauthenticated.
 * Never leaks database _id, internal merchantId, or session secret tokens.
 */
export async function GET() {
  try {
    const session = await getAuthenticatedSession()
    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message: "Authentication required.",
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        authenticated: true,
        walletAddress: session.walletAddress,
        merchant: {
          walletAddress: session.walletAddress,
          businessName: session.businessName || "",
          displayName: session.displayName || "",
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[GET /api/auth/me] Error resolving session:", error)
    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        message: "Unable to verify session due to an internal error.",
      },
      { status: 500 }
    )
  }
}
