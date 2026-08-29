import { NextResponse } from "next/server"
import { checkMongoHealth } from "@/lib/db/health"
import { POLYGON_MAINNET_CHAIN_ID, POLYGON_AMOY_CHAIN_ID } from "@/lib/payments/config"
import { getResolvedPolygonRpcUrls } from "@/lib/payments/transaction-verifier"

export const dynamic = "force-dynamic"

export async function GET() {
  const dbHealth = await checkMongoHealth()
  const hasSessionSecret = Boolean(
    process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 32
  )

  const hasAlchemy = Boolean(
    process.env.ALCHEMY_API_KEY ||
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY ||
    process.env.ALCHEMY_POLYGON_URL ||
    (process.env.POLYGON_RPC_URL && process.env.POLYGON_RPC_URL.includes("alchemy"))
  )

  const hasCustomRpc = Boolean(
    process.env.POLYGON_RPC_URL ||
    process.env.POLYGON_MAINNET_RPC_URL ||
    process.env.ALCHEMY_API_KEY
  )

  const hasAmoyRpc = Boolean(
    process.env.AMOY_RPC_URL ||
    process.env.POLYGON_AMOY_RPC_URL ||
    process.env.ALCHEMY_AMOY_URL ||
    process.env.NEXT_PUBLIC_AMOY_RPC_URL ||
    process.env.ALCHEMY_API_KEY
  )

  const mainnetRpcPool = getResolvedPolygonRpcUrls(POLYGON_MAINNET_CHAIN_ID)
  const amoyRpcPool = getResolvedPolygonRpcUrls(POLYGON_AMOY_CHAIN_ID)

  const response = {
    status: dbHealth.ok && hasSessionSecret ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    checks: {
      database: {
        status: dbHealth.ok ? "connected" : "disconnected",
        message: dbHealth.message,
        latencyMs: dbHealth.latencyMs,
      },
      sessionSecurity: {
        configured: hasSessionSecret,
        status: hasSessionSecret ? "secure" : "missing_or_too_short",
      },
      blockchain: {
        polygonMainnet: {
          chainId: POLYGON_MAINNET_CHAIN_ID,
          rpcConfigured: hasCustomRpc,
          alchemyAttached: hasAlchemy,
          activeRpcPoolSize: mainnetRpcPool.length,
          primaryEndpoint: mainnetRpcPool[0] ? (mainnetRpcPool[0].includes("alchemy") ? "Alchemy Polygon Mainnet (Authenticated)" : mainnetRpcPool[0].replace(/\/[^/]+$/, "/...")) : "Default Pool",
        },
        polygonAmoy: {
          chainId: POLYGON_AMOY_CHAIN_ID,
          rpcConfigured: hasAmoyRpc,
          activeRpcPoolSize: amoyRpcPool.length,
          primaryEndpoint: amoyRpcPool[0] ? (amoyRpcPool[0].includes("alchemy") ? "Alchemy Amoy Testnet (Authenticated)" : amoyRpcPool[0].replace(/\/[^/]+$/, "/...")) : "Default Pool",
        },
      },
    },
  }

  return NextResponse.json(response, {
    status: 200,
  })
}
