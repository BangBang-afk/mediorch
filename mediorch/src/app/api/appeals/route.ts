import { auth } from "@/lib/auth"
import { generateAppeal, createAppealRequest } from "@/lib/appeals-agent"
import { store } from "@/lib/store"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const appeals = store.appeal.findByUser(session.user.id)
  return Response.json(appeals)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { action, ...data } = body

  try {
    if (action === "generate" && data.appealId) {
      const letter = await generateAppeal(session.user.id, data.appealId)
      if (!letter) return Response.json({ error: "Appeal not found" }, { status: 404 })
      return Response.json(letter)
    }

    if (action === "create") {
      const appeal = await createAppealRequest(session.user.id, data)
      return Response.json(appeal, { status: 201 })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Appeal error:", error)
    return Response.json({ error: "Failed to process appeal" }, { status: 500 })
  }
}
