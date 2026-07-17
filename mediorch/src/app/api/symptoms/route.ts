import { auth } from "@/lib/auth"
import { store } from "@/lib/store"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const symptoms = store.symptom.findByUser(session.user.id)
  return Response.json(symptoms)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  try {
    const symptom = store.symptom.create({ ...body, userId: session.user.id })

    store.timeline.create({
      userId: session.user.id,
      type: "symptom",
      title: `Symptom logged: ${symptom.symptom}`,
      description: `Severity: ${symptom.severity}/10. ${symptom.notes || ""}`,
      date: symptom.date,
      severity: symptom.severity >= 7 ? "severe" : symptom.severity >= 4 ? "moderate" : "mild",
      relatedTo: symptom.relatedCondition ? [symptom.relatedCondition] : [],
      metadata: {},
    })

    return Response.json(symptom, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to log symptom" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ error: "Symptom ID required" }, { status: 400 })

  store.symptom.delete(id)
  return Response.json({ success: true })
}
