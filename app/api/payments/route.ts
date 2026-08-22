import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
import { PaymentRepository } from "@/lib/repositories/payment-repository"
import { requireCurrentMerchant } from "@/lib/auth/merchant"
import { PaymentStatus } from "@/types/payment"

/**
 * GET /api/payments
 * Server endpoint to query merchant payment transactions with status filter,
 * token filter, search query, date range, pagination, and summary metrics.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authoritatively resolve merchant identity on the server
    let merchantId: string
    try {
      const identity = await requireCurrentMerchant()
      merchantId = identity.merchantId
    } catch (authError) {
      if (authError instanceof Error && authError.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { ok: false, message: "Authentication required." },
          { status: 401 }
        )
      }
      throw authError
    }

    // 2. Parse query string parameters
    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get("status") || "all"
    const tokenParam = searchParams.get("token") || "all"
    const search = searchParams.get("search") || ""
    const dateRange = searchParams.get("dateRange") || "all"
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)

    // 3. Query repository strictly isolated to merchant
    const result = await PaymentRepository.findPaginatedByMerchantId(merchantId, {
      status: statusParam as PaymentStatus | "all",
      tokenSymbol: tokenParam,
      search,
      dateRange: dateRange as "all" | "today" | "7d" | "30d" | "90d",
      page,
      limit,
    })

    const summary = await PaymentRepository.getMerchantPaymentSummary(merchantId)

    return NextResponse.json({
      ok: true,
      payments: result.payments,
      pagination: {
        totalCount: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      summary,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    console.error("[GET /api/payments] Error:", errorMsg)

    return NextResponse.json(
      { ok: false, message: "Failed to query merchant payments." },
      { status: 500 }
    )
  }
}
