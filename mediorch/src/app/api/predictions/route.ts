import { auth } from "@/lib/auth"
import { generatePredictions } from "@/lib/prediction-engine"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const report = await generatePredictions(session.user.id)
    return Response.json(report)
  } catch (error) {
    console.error("Prediction error:", error)
    return Response.json({ error: "Failed to generate predictions" }, { status: 500 })
  }
}
