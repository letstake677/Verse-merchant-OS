"use client"

import * as React from "react"
import { CryptoPrices, calculateTokenAmount } from "./prices"

export interface TokenCalculation {
  tokenAmount: string
  rawAmount: number
  rate: number
  formattedRate: string
  isEstimated: boolean
  isCalculating: boolean
}

export function useCryptoPrices() {
  const [prices, setPrices] = React.useState<CryptoPrices>({
    USD: 1.0,
    USDC: 1.0,
    POL: 0,
    VERSE: 0,
    lastUpdated: 0,
  })
  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [isCalculating, setIsCalculating] = React.useState<boolean>(true)

  const fetchPrices = React.useCallback(async () => {
    setIsCalculating(true)
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
      setIsCalculating(false)
    }
  }, [])

  React.useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 30000) // update every 30 seconds
    return () => clearInterval(interval)
  }, [fetchPrices])

  const calculateAmount = React.useCallback(
    (amount: number | string, currency = "USD", symbol = "USDC"): TokenCalculation => {
      const numeric = typeof amount === "string" ? parseFloat(amount || "0") : amount
      if (isNaN(numeric) || numeric <= 0) {
        return {
          tokenAmount: "0.00",
          rawAmount: 0,
          rate: 1.0,
          isEstimated: false,
          formattedRate: "$1.00",
          isCalculating: false,
        }
      }

      const res = calculateTokenAmount(numeric, currency, symbol, prices)
      const symbolUpper = (symbol || "").toUpperCase().trim()
      const tokenPrice = prices[symbolUpper as keyof CryptoPrices] || 0
      const isStillCalculating =
        (tokenPrice <= 0 && symbolUpper !== "USDC" && symbolUpper !== "USD") ||
        isCalculating ||
        isLoading

      return {
        ...res,
        isCalculating: isStillCalculating,
      }
    },
    [prices, isCalculating]
  )

  return {
    prices,
    isLoading,
    isCalculating,
    calculateAmount,
    refreshPrices: () => {
      setIsLoading(true)
      setIsCalculating(true)
      fetchPrices()
    },
  }
}

