import { NextRequest, NextResponse } from "next/server"
import { InvoiceRepository } from "@/lib/repositories/invoice-repository"
import { CreateInvoiceInput } from "@/types/invoice-document"
import { InvoiceStatus } from "@/types/invoice"
import { validateInvoiceData } from "@/lib/invoices/validation"
import { requireCurrentMerchant } from "@/lib/auth/merchant"

const VALID_STATUSES = new Set<string>(["all", "draft", "open", "paid", "overdue", "cancelled"])
const VALID_DATE_RANGES = new Set<string>(["all", "today", "7d", "30d", "90d"])

/**
 * GET /api/invoices
 * Server endpoint to query merchant invoices with search, status filter, date range, pagination, and summary metrics.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // 1. Parse and validate pagination
    const pageParam = parseInt(searchParams.get("page") || "1", 10)
    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam

    const limitParam = parseInt(searchParams.get("limit") || "20", 10)
    const limit = isNaN(limitParam) || limitParam < 1 ? 20 : Math.min(limitParam, 50)

    // 2. Parse search query (trimmed, max 100 chars)
    const searchRaw = searchParams.get("search") || ""
    const search = searchRaw.trim().slice(0, 100)

    // 3. Parse and validate status filter
    const statusParam = (searchParams.get("status") || "all").toLowerCase()
    const status: InvoiceStatus | "all" = VALID_STATUSES.has(statusParam)
      ? (statusParam as InvoiceStatus | "all")
      : "all"

    // 4. Parse and validate date range filter
    const dateRangeParam = (searchParams.get("dateRange") || "all").toLowerCase()
    const dateRange: "all" | "today" | "7d" | "30d" | "90d" = VALID_DATE_RANGES.has(dateRangeParam)
      ? (dateRangeParam as "all" | "today" | "7d" | "30d" | "90d")
      : "all"

    // 5. Authoritatively resolve merchant identity on the server
    let merchantId: string
    try {
      const identity = await requireCurrentMerchant()
      merchantId = identity.merchantId
    } catch (authError) {
      if (authError instanceof Error && authError.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { ok: false, error: "Authentication required." },
          { status: 401 }
        )
      }
      throw authError
    }

    // 6. Query repository for paginated invoices and summary
    const [paginatedData, summary] = await Promise.all([
      InvoiceRepository.findInvoicesWithPagination(merchantId, {
        page,
        limit,
        search: search || undefined,
        status,
        dateRange,
      }),
      InvoiceRepository.getMerchantInvoiceSummary(merchantId),
    ])

    return NextResponse.json({
      ok: true,
      invoices: paginatedData.invoices,
      pagination: paginatedData.pagination,
      summary,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    console.error("[GET /api/invoices] Error querying invoices:", errorMsg)

    const safeUserMessage = errorMsg.includes("MONGODB_URI")
      ? "Database configuration notice: MongoDB connection is not configured."
      : "Failed to retrieve invoices. Please try again later."

    return NextResponse.json(
      {
        ok: false,
        error: safeUserMessage,
        invoices: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        summary: {
          totalInvoices: 0,
          draftCount: 0,
          outstandingAmount: "$0.00",
          paidAmount: "$0.00",
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Server-side helper to generate unique, sequential merchant-scoped invoice numbers.
 * e.g. "INV-0001", "INV-0002"
 */
async function generateInvoiceNumber(merchantId: string): Promise<string> {
  const currentCount = await InvoiceRepository.countByMerchantId(merchantId)
  let candidateIndex = currentCount + 1

  while (candidateIndex < currentCount + 1000) {
    const candidateNumber = `INV-${String(candidateIndex).padStart(4, "0")}`
    const existing = await InvoiceRepository.findByMerchantIdAndInvoiceNumber(
      merchantId,
      candidateNumber
    )
    if (!existing) {
      return candidateNumber
    }
    candidateIndex++
  }

  // Fallback timestamp-based suffix if dense collisions occur
  return `INV-${Date.now().toString().slice(-6)}`
}

/**
 * POST /api/invoices
 * Server endpoint to validate, compute financials, and persist a new merchant invoice.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 1. Enforce server-side financial invariant and data limits validation
    const validationResult = validateInvoiceData(body)
    if (!validationResult.ok || !validationResult.data) {
      return NextResponse.json(
        { ok: false, error: validationResult.error || "Invalid invoice data." },
        { status: 400 }
      )
    }

    // 2. Authoritatively resolve merchant identity on the server
    let merchantId: string
    try {
      const identity = await requireCurrentMerchant()
      merchantId = identity.merchantId
    } catch (authError) {
      if (authError instanceof Error && authError.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { ok: false, error: "Authentication required." },
          { status: 401 }
        )
      }
      throw authError
    }

    // 3. Generate merchant-scoped unique invoice number
    const invoiceNumber = await generateInvoiceNumber(merchantId)

    // 4. Construct persistence payload
    const createInput: CreateInvoiceInput = {
      merchantId,
      customerName: validationResult.data.customerName,
      customerEmail: validationResult.data.customerEmail,
      currency: validationResult.data.currency,
      invoiceNumber,
      status: "open", // Initial status for new merchant payment requests
      items: validationResult.data.items,
      subtotal: validationResult.data.subtotal,
      taxRate: "0.00",
      taxAmount: "0.00",
      total: validationResult.data.total,
      notes: validationResult.data.notes,
      dueDate: validationResult.data.dueDate,
    }

    // 5. Persist via repository
    const createdInvoice = await InvoiceRepository.createInvoice(createInput)

    return NextResponse.json(
      {
        ok: true,
        message: "Invoice created successfully.",
        invoice: createdInvoice,
      },
      { status: 201 }
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error"
    
    // Log on server for diagnostics
    console.error("[POST /api/invoices] Error creating invoice:", errorMsg)

    // Ensure connection strings or credentials are never leaked to the client
    const safeUserMessage = errorMsg.includes("MONGODB_URI")
      ? "Database configuration error: MongoDB connection is not configured."
      : "Failed to persist invoice. Please try again later."

    return NextResponse.json(
      {
        ok: false,
        error: safeUserMessage,
      },
      { status: 500 }
    )
  }
}
