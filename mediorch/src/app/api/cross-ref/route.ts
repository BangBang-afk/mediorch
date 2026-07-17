import { auth } from "@/lib/auth"
import { runCrossReference } from "@/lib/cross-ref"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const report = await runCrossReference(session.user.id)
    return Response.json(report)
  } catch (error) {
    console.error("Cross-ref error:", error)
    return Response.json({ error: "Failed to run cross-reference" }, { status: 500 })
  }
}
