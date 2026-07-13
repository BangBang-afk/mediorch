import { auth } from "@/lib/auth"
import { orchestrate } from "@/lib/agents/orchestrator"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { message, history } = await req.json()

  if (!message) {
    return Response.json({ error: "Message is required" }, { status: 400 })
  }

  try {
    const result = await orchestrate(session.user.id, message, history || [])
    return Response.json(result)
  } catch (error) {
    console.error("Chat error:", error)
    return Response.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    )
  }
}
