import { auth } from "@/lib/auth"
import { store } from "@/lib/store"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const events = store.timeline.findByUser(session.user.id)
  return Response.json(events)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  try {
    const event = store.timeline.create({ ...body, userId: session.user.id })
    return Response.json(event, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create event" }, { status: 500 })
  }
}
