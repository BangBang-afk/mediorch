import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [conditions, medications, providers, appointments] = await Promise.all([
    prisma.condition.findMany({ where: { userId: session.user.id } }),
    prisma.medication.findMany({ where: { userId: session.user.id } }),
    prisma.provider.findMany({ where: { userId: session.user.id } }),
    prisma.appointment.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "asc" },
    }),
  ])

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
        result = await prisma.condition.create({
          data: { ...data, userId: session.user.id },
        })
        break
      }
      case "medication": {
        result = await prisma.medication.create({
          data: {
            ...data,
            userId: session.user.id,
            startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
          },
        })
        break
      }
      case "provider": {
        result = await prisma.provider.create({
          data: { ...data, userId: session.user.id },
        })
        break
      }
      case "appointment": {
        result = await prisma.appointment.create({
          data: {
            ...data,
            userId: session.user.id,
            date: new Date(data.date),
          },
        })
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
    const modelMap: Record<string, unknown> = {
      condition: prisma.condition,
      medication: prisma.medication,
      provider: prisma.provider,
      appointment: prisma.appointment,
    }

    const model = modelMap[type] as { delete: (args: { where: { id: string; userId: string } }) => unknown }
    if (!model) {
      return Response.json({ error: "Invalid type" }, { status: 400 })
    }

    await model.delete({
      where: { id, userId: session.user.id },
    } as never)

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: "Failed to delete" }, { status: 500 })
  }
}
