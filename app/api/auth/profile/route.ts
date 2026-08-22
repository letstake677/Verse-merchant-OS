import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db/mongodb"
import { requireCurrentMerchant } from "@/lib/auth/merchant"
import { ObjectId } from "mongodb"

/**
 * GET /api/auth/profile
 * Retrieves safe profile details of the active authenticated merchant.
 * Returns only merchant identity fields (walletAddress, businessName, displayName).
 */
export async function GET() {
  try {
    const identity = await requireCurrentMerchant()
    if (!identity || !identity.merchantId) {
      return NextResponse.json(
        { ok: false, message: "Authentication required." },
        { status: 401 }
      )
    }

    const db = await getDb()
    let objId: ObjectId
    try {
      objId = new ObjectId(identity.merchantId)
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid merchant session identifier." },
        { status: 400 }
      )
    }

    const merchant = await db.collection("merchants").findOne({ _id: objId })
    if (!merchant) {
      return NextResponse.json(
        { ok: false, message: "Merchant account not found." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      profile: {
        walletAddress: identity.walletAddress || merchant.walletAddress,
        businessName: merchant.businessName || "",
        displayName: merchant.displayName || "",
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { ok: false, message: "Authentication required." },
        { status: 401 }
      )
    }
    console.error("[GET /api/auth/profile] Error resolving profile:", error)
    return NextResponse.json(
      { ok: false, message: "Unable to load profile due to an internal error." },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/auth/profile
 * Safely updates profile settings (businessName, displayName) with server-authoritative validations.
 */
export async function PATCH(req: NextRequest) {
  try {
    const identity = await requireCurrentMerchant()
    if (!identity || !identity.merchantId) {
      return NextResponse.json(
        { ok: false, message: "Authentication required." },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, message: "Invalid payload format." },
        { status: 400 }
      )
    }

    const updates: { businessName?: string; displayName?: string } = {}
    const errors: string[] = []

    // 1. Process businessName parameter (max 150 chars, trimmed)
    if ("businessName" in body) {
      const bName = body.businessName
      if (bName !== null && bName !== undefined && bName !== "") {
        if (typeof bName !== "string") {
          errors.push("Business name must be a string.")
        } else {
          const trimmed = bName.trim()
          if (trimmed === "") {
            errors.push("Business name cannot be whitespace-only.")
          } else if (trimmed.length > 150) {
            errors.push("Business name cannot exceed 150 characters.")
          } else {
            updates.businessName = trimmed
          }
        }
      } else {
        updates.businessName = ""
      }
    }

    // 2. Process displayName parameter (max 100 chars, trimmed)
    if ("displayName" in body) {
      const dName = body.displayName
      if (dName !== null && dName !== undefined && dName !== "") {
        if (typeof dName !== "string") {
          errors.push("Display name must be a string.")
        } else {
          const trimmed = dName.trim()
          if (trimmed === "") {
            errors.push("Display name cannot be whitespace-only.")
          } else if (trimmed.length > 100) {
            errors.push("Display name cannot exceed 100 characters.")
          } else {
            updates.displayName = trimmed
          }
        }
      } else {
        updates.displayName = ""
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { ok: false, message: errors.join(" ") },
        { status: 400 }
      )
    }

    // Check if any allowable update properties are present
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, message: "No valid profile updates supplied." },
        { status: 400 }
      )
    }

    const db = await getDb()
    let objId: ObjectId
    try {
      objId = new ObjectId(identity.merchantId)
    } catch {
      return NextResponse.json(
        { ok: false, message: "Invalid merchant session identifier." },
        { status: 400 }
      )
    }

    const merchant = await db.collection("merchants").findOne({ _id: objId })
    if (!merchant) {
      return NextResponse.json(
        { ok: false, message: "Merchant account not found." },
        { status: 404 }
      )
    }

    // Explicit $set mapping
    await db.collection("merchants").updateOne(
      { _id: objId },
      {
        $set: {
          ...(updates.businessName !== undefined ? { businessName: updates.businessName } : {}),
          ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully.",
      profile: {
        walletAddress: identity.walletAddress || merchant.walletAddress,
        businessName: updates.businessName !== undefined ? updates.businessName : (merchant.businessName || ""),
        displayName: updates.displayName !== undefined ? updates.displayName : (merchant.displayName || ""),
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { ok: false, message: "Authentication required." },
        { status: 401 }
      )
    }
    console.error("[PATCH /api/auth/profile] Error updating profile:", error)
    return NextResponse.json(
      { ok: false, message: "Unable to update profile due to an internal error." },
      { status: 500 }
    )
  }
}
