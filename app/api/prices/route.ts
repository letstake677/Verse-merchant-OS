import { NextResponse } from "next/server"
import { getLiveCryptoPrices } from "@/lib/payments/prices"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const prices = await getLiveCryptoPrices()
    return NextResponse.json({
      ok: true,
      prices,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("[API Prices Error]:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch crypto prices",
        prices: {
          USD: 1.0,
          USDC: 1.0,
          POL: 0.38,
          VERSE: 0.00021,
          lastUpdated: Date.now(),
        },
      },
      { status: 200 }
    )
  }
}
