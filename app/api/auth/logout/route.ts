import { NextRequest, NextResponse } from "next/server"
import { clearSessionCookie, getAuthenticatedSession } from "@/lib/auth/session"
import { getDb } from "@/lib/db/mongodb"
import { ObjectId } from "mongodb"
import { randomBytes } from "crypto"

/**
 * POST /api/auth/logout
 * Destroys the active session by rotating the server session nonce and removing the cookie.
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await getAuthenticatedSession()
    if (session && session.merchantId) {
      try {
        const db = await getDb()
        const newVersion = randomBytes(16).toString("hex")
        await db.collection("merchants").updateOne(
          { _id: new ObjectId(session.merchantId) },
          { $set: { sessionVersion: newVersion, updatedAt: new Date() } }
        )
      } catch (dbError) {
        console.warn("[POST /api/auth/logout] Session version rotation skipped or failed:", dbError)
      }
    }

    await clearSessionCookie()
    return NextResponse.json(
      { ok: true, message: "Logged out successfully." },
      { status: 200 }
    )
  } catch (error) {
    console.error("[POST /api/auth/logout] Error during logout:", error)
    return NextResponse.json(
      { ok: false, message: "Failed to logout cleanly." },
      { status: 500 }
    )
  }
}
