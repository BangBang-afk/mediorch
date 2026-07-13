"use server"

import { ChatOpenAI } from "@langchain/openai"
import { store } from "@/lib/store"
import { isDemoMode } from "@/lib/ai-config"
import { getMedicationDemoResponse, getInteractionDemoResponse } from "@/lib/demo-responses"

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
})

export async function analyzeMedications(userId: string) {
  const medications = store.medication.findByUser(userId).filter(m => m.isActive)

  if (isDemoMode()) {
    return getMedicationDemoResponse(medications)
  }

  if (medications.length === 0) {
    return {
      response: "You haven't added any active medications yet. Add medications to your profile so I can help analyze them!",
      plainLanguage: "No medications to analyze. Please add your medications first.",
    }
  }

  const medList = medications
    .map((m) => `- ${m.name} ${m.dosage || ""} ${m.frequency ? `(${m.frequency})` : ""}${m.prescribedBy ? ` prescribed by ${m.prescribedBy}` : ""}`)
    .join("\n")

  const prompt = `You are MedAgent, an AI medication safety specialist. Analyze these medications for potential interactions, duplications, and concerns.

PATIENT'S MEDICATIONS:
${medList}

Provide a comprehensive analysis including:
1. Potential drug-drug interactions (be specific about which medications interact)
2. Any duplicate therapies
3. Adherence suggestions
4. Questions the patient should ask their doctor
5. Overall safety assessment

Format the response in clear sections with emoji headers. Include a "Plain Language Summary" at the end that simplifies everything.`

  const result = await model.invoke(prompt)
  const content = result.content.toString()

  const plainPrompt = `Rewrite the following medication analysis in extremely simple language that someone without medical knowledge could understand. Use short sentences and avoid jargon:\n\n${content}`

  const plainResult = await model.invoke(plainPrompt)
  const plainLanguage = plainResult.content.toString()

  return { response: content, plainLanguage }
}

export async function checkMedicationInteraction(
  userId: string,
  newMedication: string
) {
  const medications = store.medication.findByUser(userId).filter(m => m.isActive)

  const currentMeds = medications.map((m) => m.name).join(", ")

  if (isDemoMode()) {
    return getInteractionDemoResponse(currentMeds, newMedication)
  }

  const prompt = `You are MedAgent. A patient currently takes: ${currentMeds || "no medications"}. They want to know about adding: ${newMedication}.

Provide:
1. Known interactions between ${newMedication} and their current medications
2. General side effects to watch for
3. Recommended monitoring
4. Questions for their doctor

Keep it clear and actionable. End with a one-sentence plain language summary.`

  const result = await model.invoke(prompt)
  return { response: result.content.toString() }
}
