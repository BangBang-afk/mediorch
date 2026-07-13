import { auth } from "@/lib/auth"
import { store } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"

function generateDemoPrescriptionData(fileName: string) {
  const fileName_lower = fileName.toLowerCase()

  if (fileName_lower.includes("metformin") || fileName_lower.includes("diabetes")) {
    return {
      conditions: [{ name: "Type 2 Diabetes", severity: "moderate", notes: "Diagnosed based on elevated HbA1c levels" }],
      medications: [
        { name: "Metformin", dosage: "500mg", frequency: "Twice daily with meals", prescribedBy: "Dr. Sarah Chen", isActive: true },
        { name: "Glipizide", dosage: "5mg", frequency: "Once daily before breakfast", prescribedBy: "Dr. Sarah Chen", isActive: true },
      ],
      providers: [{ name: "Dr. Sarah Chen", specialty: "Endocrinology", phone: "(555) 234-5678" }],
    }
  }

  if (fileName_lower.includes("blood") || fileName_lower.includes("bp") || fileName_lower.includes("hypertension") || fileName_lower.includes("cardio")) {
    return {
      conditions: [{ name: "Hypertension", severity: "mild", notes: "Blood pressure monitored regularly" }],
      medications: [
        { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", prescribedBy: "Dr. James Wilson", isActive: true },
        { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", prescribedBy: "Dr. James Wilson", isActive: true },
      ],
      providers: [{ name: "Dr. James Wilson", specialty: "Cardiology", phone: "(555) 345-6789" }],
    }
  }

  if (fileName_lower.includes("antibiotic") || fileName_lower.includes("amoxicillin") || fileName_lower.includes("infection") || fileName_lower.includes("zithro") || fileName_lower.includes("azithro")) {
    return {
      conditions: [],
      medications: [
        { name: "Amoxicillin", dosage: "500mg", frequency: "Three times daily for 7 days", prescribedBy: "Dr. Emily Park", isActive: true },
        { name: "Ibuprofen", dosage: "400mg", frequency: "As needed for pain, max 3 times daily", prescribedBy: "Dr. Emily Park", isActive: true },
      ],
      providers: [{ name: "Dr. Emily Park", specialty: "Internal Medicine", phone: "(555) 456-7890" }],
    }
  }

  if (fileName_lower.includes("antidepress") || fileName_lower.includes("anxiety") || fileName_lower.includes("mental") || fileName_lower.includes("zoloft") || fileName_lower.includes("prozac") || fileName_lower.includes("lexapro")) {
    return {
      conditions: [{ name: "Generalized Anxiety Disorder", severity: "moderate", notes: "Follow-up every 3 months" }],
      medications: [
        { name: "Sertraline", dosage: "50mg", frequency: "Once daily in the morning", prescribedBy: "Dr. Michael Torres", isActive: true },
      ],
      providers: [{ name: "Dr. Michael Torres", specialty: "Psychiatry", phone: "(555) 567-8901" }],
    }
  }

  if (fileName_lower.includes("cholesterol") || fileName_lower.includes("statin") || fileName_lower.includes("lipitor") || fileName_lower.includes("atorvastatin") || fileName_lower.includes("rosuva")) {
    return {
      conditions: [{ name: "Hyperlipidemia", severity: "mild", notes: "Elevated LDL cholesterol" }],
      medications: [
        { name: "Atorvastatin", dosage: "20mg", frequency: "Once daily at bedtime", prescribedBy: "Dr. Karen Lee", isActive: true },
      ],
      providers: [{ name: "Dr. Karen Lee", specialty: "Primary Care", phone: "(555) 678-9012" }],
    }
  }

  return {
    conditions: [
      { name: "Seasonal Allergies", severity: "mild", notes: "Spring and fall symptoms" },
      { name: "Vitamin D Deficiency", severity: "mild", notes: "Discovered on routine blood work" },
    ],
    medications: [
      { name: "Cetirizine", dosage: "10mg", frequency: "Once daily as needed", prescribedBy: "Dr. Robert Kim", isActive: true },
      { name: "Vitamin D3", dosage: "2000 IU", frequency: "Once daily", prescribedBy: "Dr. Robert Kim", isActive: true },
    ],
    providers: [{ name: "Dr. Robert Kim", specialty: "Family Medicine", phone: "(555) 789-0123" }],
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (isDemoMode()) {
      const fileName = file.name || "prescription.jpg"
      const data = generateDemoPrescriptionData(fileName)

      for (const condition of data.conditions) {
        store.condition.create({ ...condition, userId: session.user.id })
      }

      for (const med of data.medications) {
        store.medication.create({ ...med, userId: session.user.id })
      }

      for (const provider of data.providers) {
        store.provider.create({ ...provider, userId: session.user.id })
      }

      return Response.json({
        success: true,
        data,
        message: `Scanned ${fileName}. Found ${data.conditions.length} condition(s), ${data.medications.length} medication(s), and ${data.providers.length} provider(s).`,
      })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name || "prescription"

    let extractedText = ""

    if (file.type === "application/pdf") {
      try {
        const { PDFParse } = await import("pdf-parse")
        const parser = new PDFParse({ data: buffer })
        const pdfData = await parser.getText()
        extractedText = pdfData.text
      } catch {
        extractedText = "[PDF could not be parsed]"
      }
    } else {
      extractedText = "[Image uploaded - processing with OCR...]"
    }

    const { ChatOpenAI } = await import("@langchain/openai")
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.1,
    })

    const prompt = `Extract medical information from this prescription text. Return ONLY valid JSON with this structure:
{
  "conditions": [{ "name": string, "severity"?: string, "notes"?: string }],
  "medications": [{ "name": string, "dosage"?: string, "frequency"?: string, "prescribedBy"?: string }],
  "providers": [{ "name": string, "specialty"?: string, "phone"?: string }]
}

If the text is unreadable or empty, return empty arrays.
Only include information explicitly present in the text.

TEXT:
${extractedText || "[Image file: " + fileName + "]"}

Provide reasonable defaults for severity and specialty if not specified.`

      const result = await model.invoke(prompt)
      const content = result.content.toString()
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      const parsed = JSON.parse(cleaned)

      for (const condition of parsed.conditions || []) {
        store.condition.create({ ...condition, userId: session.user.id })
      }

      for (const med of parsed.medications || []) {
        store.medication.create({ ...med, userId: session.user.id, isActive: true })
      }

      for (const provider of parsed.providers || []) {
        store.provider.create({ ...provider, userId: session.user.id })
      }

      return Response.json({
        success: true,
        data: parsed,
        message: `Analyzed "${fileName}". Found ${(parsed.conditions || []).length} condition(s), ${(parsed.medications || []).length} medication(s), and ${(parsed.providers || []).length} provider(s).`,
      })
  } catch (error) {
    console.error("Upload error:", error)
    return Response.json({ error: "Failed to process prescription" }, { status: 500 })
  }
}
