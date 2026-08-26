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

// Fallback baseline prices in case all external public APIs are unreachable or rate-limited
export const FALLBACK_PRICES: Record<string, number> = {
  USD: 1.0,
  USDC: 1.0,
  POL: 0.38, // 1 POL ≈ $0.38 USD
  VERSE: 0.00021, // 1 VERSE ≈ $0.00021 USD
}

let priceCache: CryptoPrices = {
  USD: 1.0,
  USDC: 1.0,
  POL: 0.38,
  VERSE: 0.00021,
  lastUpdated: 0,
}

const CACHE_TTL_MS = 30 * 1000 // 30 seconds cache

/**
 * Fetches real-time price of POL, VERSE, and USDC in USD.
 */
export async function getLiveCryptoPrices(): Promise<CryptoPrices> {
  const now = Date.now()
  if (now - priceCache.lastUpdated < CACHE_TTL_MS && priceCache.lastUpdated > 0) {
    return priceCache
  }

  let polPrice = priceCache.POL || FALLBACK_PRICES.POL
  let versePrice = priceCache.VERSE || FALLBACK_PRICES.VERSE
  let usdcPrice = 1.0

  // 1. Try Binance Public API for POL (fastest & highest reliability)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const binanceRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=POLUSDT", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    })
    clearTimeout(timeout)

    if (binanceRes.ok) {
      const data = await binanceRes.json()
      const parsed = parseFloat(data.price)
      if (parsed > 0) {
        polPrice = parsed
      }
    }
  } catch (err) {
    console.warn("[Prices] Binance API fetch skipped:", (err as Error).message)
  }

  // 2. Try DexScreener for VERSE (Polygon contract: 0xc708d6f2153933daa50b2d0758955be0a93a8fec)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)
    const dexRes = await fetch(
      "https://api.dexscreener.com/latest/dex/tokens/0xc708d6f2153933daa50b2d0758955be0a93a8fec",
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: 30 },
      }
    )
    clearTimeout(timeout)

    if (dexRes.ok) {
      const dexData = await dexRes.json()
      if (dexData.pairs && dexData.pairs.length > 0) {
        const pair = dexData.pairs[0]
        const priceUsd = parseFloat(pair.priceUsd)
        if (priceUsd > 0) {
          versePrice = priceUsd
        }
      }
    }
  } catch (err) {
    console.warn("[Prices] DexScreener API fetch skipped:", (err as Error).message)
  }

  // 3. Fallback: CoinGecko Free API if either price still needs fresh data
  if (polPrice === FALLBACK_PRICES.POL || versePrice === FALLBACK_PRICES.VERSE) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3500)
      const cgRes = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=polygon-ecosystem-token,verse,usd-coin&vs_currencies=usd",
        {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          next: { revalidate: 60 },
        }
      )
      clearTimeout(timeout)

      if (cgRes.ok) {
        const data = await cgRes.json()
        if (data["polygon-ecosystem-token"]?.usd) {
          polPrice = data["polygon-ecosystem-token"].usd
        }
        if (data["verse"]?.usd) {
          versePrice = data["verse"].usd
        }
        if (data["usd-coin"]?.usd) {
          usdcPrice = data["usd-coin"].usd
        }
      }
    } catch (err) {
      console.warn("[Prices] CoinGecko API fetch skipped:", (err as Error).message)
    }
  }

  // 4. Fallback: CryptoCompare API
  if (polPrice === FALLBACK_PRICES.POL || versePrice === FALLBACK_PRICES.VERSE) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 3000)
      const ccRes = await fetch(
        "https://min-api.cryptocompare.com/data/pricemulti?fsyms=POL,MATIC,VERSE,USDC&tsyms=USD",
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      if (ccRes.ok) {
        const ccData = await ccRes.json()
        if (ccData.POL?.USD) polPrice = ccData.POL.USD
        else if (ccData.MATIC?.USD) polPrice = ccData.MATIC.USD
        if (ccData.VERSE?.USD) versePrice = ccData.VERSE.USD
      }
    } catch (e) {
      console.warn("[Prices] CryptoCompare API skipped:", (e as Error).message)
    }
  }

  priceCache = {
    USD: 1.0,
    USDC: usdcPrice || 1.0,
    POL: polPrice,
    VERSE: versePrice,
    lastUpdated: now,
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
    tokenPriceUsd = prices.POL || FALLBACK_PRICES.POL
  } else if (symbol === "VERSE") {
    tokenPriceUsd = prices.VERSE || FALLBACK_PRICES.VERSE
  }

  // If price is 0 or negative (safety protection)
  if (tokenPriceUsd <= 0) {
    tokenPriceUsd = 1.0
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
