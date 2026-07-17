import { auth } from "@/lib/auth"
import { generateGaslightShieldReport } from "@/lib/gaslight-shield"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const report = await generateGaslightShieldReport(session.user.id)
    return Response.json(report)
  } catch (error) {
    console.error("Gaslight shield error:", error)
    return Response.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
