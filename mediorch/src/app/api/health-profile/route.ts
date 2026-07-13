import { auth } from "@/lib/auth"
import { store } from "@/lib/store"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const conditions = store.condition.findByUser(session.user.id)
  const medications = store.medication.findByUser(session.user.id)
  const providers = store.provider.findByUser(session.user.id)
  const appointments = store.appointment.findByUser(session.user.id)

  return Response.json({ conditions, medications, providers, appointments })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { type, data } = body

  try {
    let result

    switch (type) {
      case "condition": {
        result = store.condition.create({ ...data, userId: session.user.id })
        break
      }
      case "medication": {
        result = store.medication.create({ ...data, userId: session.user.id })
        break
      }
      case "provider": {
        result = store.provider.create({ ...data, userId: session.user.id })
        break
      }
      case "appointment": {
        result = store.appointment.create({ ...data, userId: session.user.id })
        break
      }
      default:
        return Response.json({ error: "Invalid type" }, { status: 400 })
    }

    return Response.json(result, { status: 201 })
  } catch (error) {
    console.error("Create error:", error)
    return Response.json({ error: "Failed to create" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const id = searchParams.get("id")

  if (!type || !id) {
    return Response.json({ error: "Type and id required" }, { status: 400 })
  }

  try {
    switch (type) {
      case "condition": store.condition.delete(id); break
      case "medication": store.medication.delete(id); break
      case "provider": store.provider.delete(id); break
      case "appointment": store.appointment.delete(id); break
      default: return Response.json({ error: "Invalid type" }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: "Failed to delete" }, { status: 500 })
  }
}
