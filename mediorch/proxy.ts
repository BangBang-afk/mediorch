import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

export async function proxy(request: NextRequest) {
  try {
    const session = await auth()
    const { pathname } = request.nextUrl

    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")
    const isDashboard = pathname.startsWith("/dashboard")

    if (!session && isDashboard) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (session && isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  } catch (error) {
    console.error("Proxy error:", error)
  }

  return NextResponse.next()
}
