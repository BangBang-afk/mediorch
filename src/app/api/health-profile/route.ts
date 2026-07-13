import { auth } from "@/lib/auth"
import { import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Health check failed" }, { status: 500 })
  }
}
