import { NextResponse } from "next/server"
import { getLiveCryptoPrices, calculateTokenAmount } from "@/lib/payments/prices"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const amount = parseFloat(searchParams.get("amount") || "0")
    const currency = searchParams.get("currency") || "USD"
    const symbol = searchParams.get("symbol") || "USDC"

    const prices = await getLiveCryptoPrices()

    if (amount > 0) {
      const calculation = calculateTokenAmount(amount, currency, symbol, prices)
      return NextResponse.json({
        ok: true,
        prices,
        calculation,
      })
    }

    return NextResponse.json({
      ok: true,
      prices,
    })
  } catch (error) {
    console.error("[GET /api/prices] Error:", error)
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to fetch price conversion rates.",
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
