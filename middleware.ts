import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const SESSION_COOKIE_NAME = "verse_merchant_session"

/**
 * Edge-compatible Next.js middleware for fast route guarding.
 * Checks for session token existence on protected dashboard and API paths.
 * Note: Authoritative cryptographic SIWE session verification occurs server-side in API handlers and components.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
  const hasSession = Boolean(sessionCookie && sessionCookie.value)

  // Guard dashboard pages -> Redirect to /login
  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Guard protected API routes -> Return HTTP 401 JSON
  if (pathname.startsWith("/api/invoices") || pathname === "/api/auth/me") {
    if (!hasSession) {
      return NextResponse.json(
        {
          ok: false,
          message: "Authentication required.",
        },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/invoices/:path*",
    "/api/auth/me",
  ],
}
