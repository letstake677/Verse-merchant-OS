import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const SESSION_COOKIE_NAME = "verse_merchant_session"

/**
 * Edge-compatible Next.js middleware for fast route guarding.
 * Checks for session token existence on protected dashboard paths.
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

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
}
