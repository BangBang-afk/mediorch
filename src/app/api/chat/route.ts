import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isDemoMode } from "@/lib/ai-config"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 })
    }

    // Return a mock response for demo mode
    if (isDemoMode()) {
      return NextResponse.json({
        message: {
          role: "assistant",
          content: "Demo response: This is a sample AI response in demo mode."
        }
      })
    }

    return NextResponse.json({
      message: {
        role: "assistant",
        content: "Chat endpoint is available. Configure your AI API keys to enable full functionality."
      }
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Chat failed" }, { status: 500 })
  }
}
