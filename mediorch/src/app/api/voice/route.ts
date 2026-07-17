import { auth } from "@/lib/auth"
import { processVoiceInput } from "@/lib/voice-processor"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { transcript } = await req.json()
  if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
    return Response.json({ error: "Transcript is required" }, { status: 400 })
  }

  try {
    const result = await processVoiceInput(session.user.id, transcript.trim())
    return Response.json(result)
  } catch (error) {
    console.error("Voice processing error:", error)
    return Response.json({ error: "Failed to process voice input" }, { status: 500 })
  }
}
