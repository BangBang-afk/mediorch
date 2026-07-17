import { auth } from "@/lib/auth"
import { findBestHospitals } from "@/lib/insurance-costs"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const treatment = searchParams.get("treatment")
  const zipCode = searchParams.get("zipCode")

  if (!treatment || !zipCode) {
    return Response.json({ error: "treatment and zipCode required" }, { status: 400 })
  }

  try {
    const result = await findBestHospitals(session.user.id, treatment, zipCode)
    return Response.json(result)
  } catch (error) {
    console.error("Hospital search error:", error)
    return Response.json({ error: "Failed to search hospitals" }, { status: 500 })
  }
}
