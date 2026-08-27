import { NextResponse } from "next/server"
import { checkMongoHealth } from "@/lib/db/health"
import { POLYGON_MAINNET_CHAIN_ID } from "@/lib/payments/config"

export const dynamic = "force-dynamic"

export async function GET() {
  const dbHealth = await checkMongoHealth()
  const hasSessionSecret = Boolean(
    process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 32
  )

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
          rpcConfigured: Boolean(process.env.POLYGON_RPC_URL),
        },
      },
    },
  }

  return NextResponse.json(response, {
    status: response.status === "healthy" ? 200 : 200,
  })
}
