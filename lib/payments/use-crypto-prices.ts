"use client"

import * as React from "react"
import { CryptoPrices, calculateTokenAmount } from "./prices"

export function useCryptoPrices() {
  const [prices, setPrices] = React.useState<CryptoPrices>({
    USD: 1.0,
    USDC: 1.0,
    POL: 0.38,
    VERSE: 0.00021,
    lastUpdated: 0,
  })
  const [isLoading, setIsLoading] = React.useState<boolean>(true)

  const fetchPrices = React.useCallback(async () => {
    try {
      const res = await fetch("/api/prices", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.ok && data.prices) {
          setPrices(data.prices)
        }
      }
    } catch (e) {
      console.warn("[useCryptoPrices] Error fetching live prices:", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000) // update every 30 seconds
    return () => clearInterval(interval)
  }, [fetchPrices])

  const calculateAmount = React.useCallback(
    (amount: number | string, currency = "USD", symbol = "USDC") => {
      const numeric = typeof amount === "string" ? parseFloat(amount || "0") : amount
      if (isNaN(numeric) || numeric <= 0) {
        return {
          tokenAmount: "0.00",
          rate: 1.0,
          isEstimated: false,
          formattedRate: "$1.00",
        }
      }
      return calculateTokenAmount(numeric, currency, symbol, prices)
    },
    [prices]
  )

  return {
    prices,
    isLoading,
    calculateAmount,
    refreshPrices: fetchPrices,
  }
}
