/**
 * Real-Time Crypto Price Feed Engine
 *
 * Fetches real-time market conversion rates for POL, VERSE, and USDC to USD
 * from public free APIs (Binance, CoinGecko, DexScreener, CryptoCompare) with
 * in-memory caching and graceful fallback rates.
 */

export interface CryptoPrices {
  USD: number
  USDC: number
  POL: number
  VERSE: number
  lastUpdated: number
}

// Baseline prices set to 0 initially so no estimated values are shown until live prices are fetched
export const FALLBACK_PRICES: Record<string, number> = {
  USD: 1.0,
  USDC: 1.0,
  POL: 0,
  VERSE: 0,
}

let priceCache: CryptoPrices = {
  USD: 1.0,
  USDC: 1.0,
  POL: 0,
  VERSE: 0,
  lastUpdated: 0,
}

const CACHE_TTL_MS = 15 * 1000 // 15 seconds cache

/**
 * Fetches real-time price of POL, VERSE, and USDC in USD without static baseline defaults.
 */
export async function getLiveCryptoPrices(): Promise<CryptoPrices> {
  const now = Date.now()
  if (now - priceCache.lastUpdated < CACHE_TTL_MS && priceCache.lastUpdated > 0) {
    return priceCache
  }

  let polPrice = priceCache.POL || 0
  let versePrice = priceCache.VERSE || 0
  let usdcPrice = priceCache.USDC || 1.0

  try {
    const fetchWithTimeout = async (url: string, timeoutMs = 2500) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        clearTimeout(timer)
        if (res.ok) return await res.json()
      } catch {
        clearTimeout(timer)
      }
      return null
    }

    const [binanceData, dexData, cgData, ccData] = await Promise.all([
      fetchWithTimeout("https://api.binance.com/api/v3/ticker/price?symbol=POLUSDT", 2500),
      fetchWithTimeout("https://api.dexscreener.com/latest/dex/tokens/0xc708d6f2153933daa50b2d0758955be0a93a8fec", 2500),
      fetchWithTimeout("https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token,verse,usd-coin&vs_currencies=usd", 2500),
      fetchWithTimeout("https://min-api.cryptocompare.com/data/pricemulti?fsyms=POL,MATIC,VERSE,USDC&tsyms=USD", 2500),
    ])

    // Parse Binance POL
    if (binanceData?.price) {
      const p = parseFloat(binanceData.price)
      if (p > 0) polPrice = p
    }

    // Parse DexScreener VERSE
    if (dexData?.pairs?.[0]?.priceUsd) {
      const p = parseFloat(dexData.pairs[0].priceUsd)
      if (p > 0) versePrice = p
    }

    // Parse CoinGecko
    if (cgData) {
      if (cgData["polygon-ecosystem-token"]?.usd && polPrice === 0) {
        polPrice = cgData["polygon-ecosystem-token"].usd
      }
      if (cgData["verse"]?.usd && versePrice === 0) {
        versePrice = cgData["verse"].usd
      }
      if (cgData["usd-coin"]?.usd) {
        usdcPrice = cgData["usd-coin"].usd
      }
    }

    // Parse CryptoCompare
    if (ccData) {
      if ((ccData.POL?.USD || ccData.MATIC?.USD) && polPrice === 0) {
        polPrice = ccData.POL?.USD || ccData.MATIC?.USD
      }
      if (ccData.VERSE?.USD && versePrice === 0) {
        versePrice = ccData.VERSE?.USD
      }
    }
  } catch (err) {
    console.warn("[Prices] Live price fetch error:", (err as Error).message)
  }

  priceCache = {
    USD: 1.0,
    USDC: usdcPrice || 1.0,
    POL: polPrice,
    VERSE: versePrice,
    lastUpdated: Date.now(),
  }

  return priceCache
}

/**
 * Calculates how many crypto tokens are needed for a given billed USD (or fiat) invoice amount.
 *
 * Example:
 *   amount: 0.05 USD
 *   token: "POL" (price = 0.38 USD)
 *   returns: "0.131579" (0.05 / 0.38)
 */
export function calculateTokenAmount(
  invoiceAmount: number,
  invoiceCurrency: string,
  targetTokenSymbol: string,
  prices: CryptoPrices
): {
  tokenAmount: string
  rawAmount: number
  rate: number
  formattedRate: string
  isEstimated: boolean
} {
  const symbol = (targetTokenSymbol || "USDC").toUpperCase().trim()
  const invCurr = (invoiceCurrency || "USD").toUpperCase().trim()

  // If already in target crypto, return 1:1
  if (invCurr === symbol) {
    return {
      tokenAmount: invoiceAmount.toFixed(symbol === "USDC" ? 2 : 6),
      rawAmount: invoiceAmount,
      rate: 1.0,
      formattedRate: "$1.00",
      isEstimated: false,
    }
  }

  // Determine target token price in USD
  let tokenPriceUsd = 1.0
  if (symbol === "USDC") {
    tokenPriceUsd = prices.USDC || 1.0
  } else if (symbol === "POL" || symbol === "MATIC") {
    tokenPriceUsd = prices.POL || 0
  } else if (symbol === "VERSE") {
    tokenPriceUsd = prices.VERSE || 0
  }

  // If live price is not yet available, do not perform baseline estimations
  if (tokenPriceUsd <= 0 && symbol !== "USDC") {
    return {
      tokenAmount: "0",
      rawAmount: 0,
      rate: 0,
      formattedRate: "Fetching live market rate...",
      isEstimated: true,
    }
  }

  // Number of tokens = invoiceAmount / tokenPriceUsd
  const rawCryptoAmount = invoiceAmount / tokenPriceUsd

  let formattedAmount: string
  if (symbol === "USDC") {
    formattedAmount = Math.max(0.01, rawCryptoAmount).toFixed(2)
  } else if (symbol === "POL" || symbol === "MATIC") {
    // 4 to 6 decimal precision for POL
    formattedAmount = rawCryptoAmount >= 1 ? rawCryptoAmount.toFixed(4) : rawCryptoAmount.toFixed(6)
  } else if (symbol === "VERSE") {
    // VERSE is a sub-cent token, format to 2 decimals if >= 10, or 4 decimals if small
    formattedAmount = rawCryptoAmount >= 10 ? rawCryptoAmount.toFixed(2) : rawCryptoAmount.toFixed(4)
  } else {
    formattedAmount = rawCryptoAmount.toFixed(6)
  }

  let formattedRate = `$${tokenPriceUsd.toFixed(2)}`
  if (tokenPriceUsd < 0.01) {
    formattedRate = `$${tokenPriceUsd.toFixed(6)}`
  } else if (tokenPriceUsd < 1) {
    formattedRate = `$${tokenPriceUsd.toFixed(4)}`
  }

  return {
    tokenAmount: formattedAmount,
    rawAmount: rawCryptoAmount,
    rate: tokenPriceUsd,
    formattedRate,
    isEstimated: symbol !== "USDC",
  }
}
