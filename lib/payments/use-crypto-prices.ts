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

// In-memory module cache to persist prices across component unmounts
let globalPriceCache: CryptoPrices = {
  USD: 1.0,
  USDC: 1.0,
  POL: 0,
  VERSE: 0,
  lastUpdated: 0,
}

export function useCryptoPrices() {
  const [prices, setPrices] = React.useState<CryptoPrices>(() => globalPriceCache)
  const [isLoading, setIsLoading] = React.useState<boolean>(() => globalPriceCache.lastUpdated === 0)
  const [isCalculating, setIsCalculating] = React.useState<boolean>(() => globalPriceCache.lastUpdated === 0)
  const [secondsRemaining, setSecondsRemaining] = React.useState<number>(30)
  const isFetchingRef = React.useRef<boolean>(false)
  const isPausedRef = React.useRef<boolean>(false)

  const fetchPrices = React.useCallback(async (isInitial = false) => {
    if (isFetchingRef.current || isPausedRef.current) return
    isFetchingRef.current = true

    // Only set calculating state on initial cold load to prevent UI disruptions
    if (isInitial && globalPriceCache.lastUpdated === 0) {
      setIsCalculating(true)
      setIsLoading(true)
    }

    try {
      const res = await fetch("/api/prices", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data.ok && data.prices) {
          globalPriceCache = data.prices
          setPrices(data.prices)
          setSecondsRemaining(30)
        }
      }
    } catch (e) {
      console.warn("[useCryptoPrices] Error fetching live prices:", e)
    } finally {
      isFetchingRef.current = false
      setIsLoading(false)
      setIsCalculating(false)
    }
  }, [])

  // Initial load once on mount if cache is stale (> 30s)
  React.useEffect(() => {
    const isStale = Date.now() - globalPriceCache.lastUpdated > 30000
    if (globalPriceCache.lastUpdated === 0 || isStale) {
      fetchPrices(globalPriceCache.lastUpdated === 0)
    }
  }, [fetchPrices])

  // 30-Second Countdown & Scheduled Rate Refresh Timer
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (isPausedRef.current) return

      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Time expired: Trigger silent background update & reset to 30s
          fetchPrices(false)
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [fetchPrices])

  const refreshPrices = React.useCallback(() => {
    setSecondsRemaining(30)
    fetchPrices(false)
  }, [fetchPrices])

  const setPaused = React.useCallback((paused: boolean) => {
    isPausedRef.current = paused
  }, [])

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

      // Only show calculating if the token price has never been fetched yet (cold start)
      const isColdStart = (tokenPrice <= 0 && symbolUpper !== "USDC" && symbolUpper !== "USD") && globalPriceCache.lastUpdated === 0

      return {
        ...res,
        isCalculating: isColdStart,
      }
    },
    [prices]
  )

  return {
    prices,
    isLoading,
    isCalculating,
    secondsRemaining,
    calculateAmount,
    refreshPrices,
    setPaused,
  }
}
