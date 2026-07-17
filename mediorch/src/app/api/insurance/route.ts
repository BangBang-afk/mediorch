import { auth } from "@/lib/auth"
import { store } from "@/lib/store"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const plans = store.insurance.findByUser(session.user.id)
  return Response.json(plans)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  try {
    const plan = store.insurance.create({ ...body, userId: session.user.id })
    return Response.json(plan, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create insurance plan" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, ...data } = body
  if (!id) return Response.json({ error: "Plan ID required" }, { status: 400 })

  const updated = store.insurance.update(id, data)
  if (!updated) return Response.json({ error: "Plan not found" }, { status: 404 })
  return Response.json(updated)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ error: "Plan ID required" }, { status: 400 })

  store.insurance.delete(id)
  return Response.json({ success: true })
}
